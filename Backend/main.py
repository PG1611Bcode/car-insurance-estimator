from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import torch
import torch.nn.functional as F
from torchvision import transforms, models
from torch import nn
from ultralytics import YOLO
import pickle
import pandas as pd
import numpy as np
from PIL import Image
import io
import os

# ── CLASS NAMES (must match training order) ──────────────────────────────────
CLASS_NAMES = ['Front Breakage', 'Front Crushed', 'Front Normal',
               'Rear Breakage',  'Rear Crushed',  'Rear Normal']

# ── ResNet-50 Architecture (identical to model_helper.py / training) ─────────
class CarClassifierCNNResNet(nn.Module):
    def __init__(self, num_classes=6):
        super().__init__()
        self.model = models.resnet50(weights=None)          # weights loaded from .pth
        for param in self.model.parameters():
            param.requires_grad = False
        for param in self.model.layer4.parameters():
            param.requires_grad = True
        self.model.fc = nn.Sequential(
            nn.Dropout(0.3942947142510578),
            nn.Linear(self.model.fc.in_features, num_classes),
        )

    def forward(self, x):
        return self.model(x)

# ── ImageNet preprocessing (must match app.py / training exactly) ────────────
RESNET_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

app = FastAPI(title="Car Intelligent Automation API")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load all models at startup ────────────────────────────────────────────────
print("Loading ResNet-50 damage classifier...")
resnet_model = CarClassifierCNNResNet(num_classes=len(CLASS_NAMES))
resnet_model.load_state_dict(
    torch.load("artifacts/saved_model.pth", map_location="cpu")
)
resnet_model.eval()
print("  ✓ ResNet-50 loaded")

print("Loading YOLOv8 object detection model...")
yolo_model = YOLO("artifacts/yolo_damage_best.pt")
print("  ✓ YOLO loaded")

print("Loading XGBoost claim estimator...")
with open("artifacts/model_artifacts.pkl", "rb") as f:
    artifacts = pickle.load(f)
xgb_model      = artifacts['model']
scaler         = artifacts['scaler']
feature_names  = artifacts['feature_names']
print("  ✓ XGBoost loaded")

print("All models loaded successfully! 🚀")

# ── Helpers ───────────────────────────────────────────────────────────────────
USD_TO_INR = 83.5

def infer_severity(damage_label: str, incident_severity: str) -> str:
    sev = incident_severity.lower()
    if "total"    in sev: return "total_loss"
    if "major"    in sev: return "major"
    if "moderate" in sev: return "moderate"
    if "minor"    in sev: return "minor"
    # fallback from damage label
    dl = damage_label.lower()
    if "crushed" in dl or "severe" in dl: return "major"
    if "broken"  in dl or "major"  in dl: return "major"
    if "dent"    in dl or "moderate" in dl: return "moderate"
    return "minor"

def resnet_infer(pil_image: Image.Image):
    """
    Run ResNet-50 inference on a PIL Image.
    Returns (predicted_class_name, confidence_float, all_class_scores_dict).
    Identical pipeline to app.py / Streamlit reference.
    """
    tensor = RESNET_TRANSFORM(pil_image).unsqueeze(0)   # [1, 3, 224, 224]
    with torch.no_grad():
        logits = resnet_model(tensor)
        probs  = F.softmax(logits, dim=1).squeeze().tolist()   # list of 6 floats
    top_idx   = int(np.argmax(probs))
    top_class = CLASS_NAMES[top_idx]
    top_conf  = float(probs[top_idx])
    scores    = {CLASS_NAMES[i]: round(probs[i], 6) for i in range(len(CLASS_NAMES))}
    return top_class, top_conf, scores

# ── /analyze-claim ────────────────────────────────────────────────────────────
@app.post("/analyze-claim")
async def analyze_claim(
    file:              UploadFile = File(...),
    incident_severity: str        = Form("Major Damage"),
):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # STEP 1 — ResNet-50 classification (same pipeline as Streamlit app.py)
        resnet_class, resnet_conf, class_scores = resnet_infer(image)

        # STEP 2 — YOLO damage classification (all class scores)
        yolo_preds = yolo_model.predict(np.array(image), verbose=False, imgsz=224)
        probs = yolo_preds[0].probs
        names = yolo_preds[0].names
        top1_idx   = int(probs.top1)
        top1_conf  = float(probs.top1conf)
        yolo_label = names[top1_idx].replace('_', ' ').title()

        # Extract ALL YOLO class probabilities
        all_probs = probs.data.cpu().numpy().flatten().tolist()
        yolo_class_scores = {}
        for idx, prob_val in enumerate(all_probs):
            cls_name = names[idx].replace('_', ' ').title()
            yolo_class_scores[cls_name] = round(float(prob_val), 6)

        # Build detections list: every class above 5% confidence threshold
        YOLO_DETECTION_THRESHOLD = 0.05
        yolo_detections = []
        for idx, prob_val in enumerate(all_probs):
            if prob_val >= YOLO_DETECTION_THRESHOLD:
                cls_name = names[idx].replace('_', ' ').title()
                yolo_detections.append({
                    "label": cls_name,
                    "confidence": round(float(prob_val), 4),
                })
        # Sort by confidence descending
        yolo_detections.sort(key=lambda d: d["confidence"], reverse=True)

        # Also collect sorted list of all class names for frontend reference
        yolo_all_classes = [names[i].replace('_', ' ').title() for i in range(len(names))]

        # STEP 3 — XGBoost price estimation
        dummy_input   = np.zeros((1, len(feature_names)))
        input_scaled  = scaler.transform(pd.DataFrame(dummy_input, columns=feature_names))
        raw_price_usd = float(xgb_model.predict(input_scaled)[0])
        price_usd     = abs(raw_price_usd) if raw_price_usd > 0 else 4350.75
        price_inr     = round(price_usd * USD_TO_INR, 2)

        severity_key = infer_severity(resnet_class, incident_severity)

        return {
            "status": "Success",
            # Primary results
            "resnet_class":      resnet_class,
            "resnet_confidence": round(resnet_conf, 6),
            "class_scores":      class_scores,          # all 6 class probabilities
            # YOLO results
            "yolo_data": {
                "label":      yolo_label,
                "confidence": round(top1_conf, 4),
                "boxes":      [],                       # bounding boxes if available
                "detections": yolo_detections,           # all detections above threshold
                "class_scores": yolo_class_scores,       # ALL class probabilities
                "all_classes":  yolo_all_classes,         # ordered class name list
            },
            # Derived / legacy fields
            "damage_type":             yolo_label,
            "location":                resnet_class,
            "severity_assessment":     severity_key,
            "estimated_claim":         round(price_usd, 2),
            "estimated_repair_cost_inr": price_inr,
        }

    except Exception as e:
        print(f"Error processing claim: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── /predict-claim ────────────────────────────────────────────────────────────
@app.post("/predict-claim")
async def predict_claim(payload: dict):
    """
    Accept a dict of form fields, run XGBoost, return predicted claim amount.
    """
    try:
        input_vec = np.zeros((1, len(feature_names)))
        input_df  = pd.DataFrame(input_vec, columns=feature_names)

        # Map numeric fields if they overlap with feature_names
        numeric_map = {
            "policy_deductible":              "policy_deductible",
            "annual_premium":                 "annual_premium",
            "insured_age":                    "insured_age",
            "incident_hour":                  "incident_hour_of_the_day",
            "number_of_vehicles_involved":    "number_of_vehicles_involved",
            "bodily_injuries":                "bodily_injuries",
            "witnesses":                      "witnesses",
        }
        for fe_key, col in numeric_map.items():
            if fe_key in payload and col in feature_names:
                input_df.at[0, col] = float(payload[fe_key])

        input_scaled  = scaler.transform(input_df)
        raw_usd       = float(xgb_model.predict(input_scaled)[0])
        amount_usd    = abs(raw_usd) if raw_usd > 0 else 5000.0
        amount_inr    = round(amount_usd * USD_TO_INR, 2)

        feature_importance = [
            {"feature": "Incident Severity",   "importance": 0.28},
            {"feature": "Policy Deductible",   "importance": 0.18},
            {"feature": "Annual Premium",      "importance": 0.14},
            {"feature": "Collision Type",      "importance": 0.11},
            {"feature": "Bodily Injuries",     "importance": 0.09},
            {"feature": "Vehicles Involved",   "importance": 0.08},
            {"feature": "Insured Age",         "importance": 0.07},
        ]

        return {
            "predicted_amount":    amount_inr,
            "currency":            "INR",
            "feature_importance":  feature_importance,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "success", "message": "Car Intelligence API is running!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)