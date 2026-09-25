<div align="center">



# 🚗 AutoClaim AI
### Intelligent Vehicle Damage Detection & Insurance Claim Estimator

*Automating the first 72 hours of insurance claim processing with computer vision*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![ResNet](https://img.shields.io/badge/Architecture-ResNet_CNN-8B5CF6?style=for-the-badge)](https://arxiv.org/abs/1512.03385)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

<br/>

![AutoClaim AI Demo](assets/demo_preview.gif)

<br/>

[**Live Demo**](https://your-demo-link.vercel.app) · [**API Docs**](https://your-api.railway.app/docs) · [**Model Card**](docs/MODEL_CARD.md) · [**Report a Bug**](issues)

</div>

---

## 📌 Overview

**AutoClaim AI** is a full-stack machine learning application that automates vehicle damage assessment for insurance claim processing. A claimant uploads a single photograph of their damaged vehicle. Within seconds, the platform returns a structured damage report: affected components, severity classification, and a localized cost estimate — without requiring a human adjuster for the initial triage.

The core AI engine is a fine-tuned **ResNet-50 Convolutional Neural Network** that performs damage localization and multi-class severity classification simultaneously. Classification outputs are then consumed by a **pricing inference engine** that maps damage type and severity to a localized parts-and-labor cost dataset, producing a dollar-range repair estimate with component-level line items.

> **Industry Context:** Insurance adjusters spend an average of 3–5 business days on initial vehicle damage assessment. AutoClaim AI reduces that initial triage window to under 10 seconds, enabling insurers to prioritize complex claims requiring human review while processing routine claims automatically.

---


---

## ✨ Key Features

### 🖼️ Image Ingestion & Preprocessing
- Accepts JPEG, PNG, and WEBP uploads up to 10MB via a drag-and-drop React interface
- Server-side preprocessing pipeline: resize to `224×224`, `ImageNet` mean/std normalization, tensor conversion
- Input validation rejects non-vehicle images before inference (pre-filter classifier)
- All uploaded assets are processed in-memory — no permanent image storage without explicit opt-in

### 🧠 ResNet-50 Damage Detection Engine
- Fine-tuned **ResNet-50** architecture (pretrained on ImageNet, transfer-learned on vehicle damage dataset)
- Dual-head output: **damage localization** (bounding region per component) + **severity classification** (None / Minor / Moderate / Severe)
- Component taxonomy covers 12 vehicle regions: hood, front bumper, rear bumper, driver/passenger doors, fenders, windshield, headlights, taillights, roof, quarter panels
- Outputs a confidence-scored prediction per component with a minimum confidence threshold of `0.72` before a component is included in the report
- Model serialized as `model/autoclaim_resnet50.pt` using `torch.save` with full state dict

### 💰 Repair Cost Pricing Engine
- Maps CNN severity classifications (`Minor` / `Moderate` / `Severe`) to a **localized parts-and-labor cost matrix**
- Cost matrix parameterized by: vehicle make/model/year (user-provided at upload), component type, and severity tier
- Outputs structured line-item cost estimates with low/mid/high range per component
- Aggregates into a total **claim estimate range** (e.g., `$1,200 – $2,800`) with a component-level breakdown table
- Powered by Scikit-learn regression model calibrated on regional repair shop rate data

### ⚡ FastAPI Async Backend
- Fully asynchronous prediction endpoint (`async def predict()`) for non-blocking image processing under concurrent load
- Pydantic v2 response models enforce strict output schema: `ClaimReport`, `ComponentDamage`, `CostLineItem`
- `/docs` Swagger UI auto-generated for every endpoint — live-testable without frontend
- Structured JSON error responses for all failure modes: invalid file type, inference timeout, pricing lookup miss

### 🖥️ React Frontend
- Single-page application with three views: Upload, Processing, and Report
- Report view renders: damage heatmap overlay on the original image, component severity badges, cost line-item table, and a one-click PDF export
- Responsive layout with Tailwind CSS — optimized for both desktop adjusters and mobile claimants
- Real-time polling via React Query during inference — no manual page refresh required

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Tailwind CSS, React Query | SPA UI, async state, responsive layout |
| **API Gateway** | FastAPI, Uvicorn, Pydantic v2 | Async REST API, request validation, schema enforcement |
| **Image Processing** | Pillow, NumPy, torchvision.transforms | Preprocessing pipeline, normalization |
| **Damage Detection** | PyTorch 2.x, ResNet-50 (fine-tuned) | CNN inference, severity classification |
| **Pricing Engine** | Scikit-learn, Pandas | Cost regression, parts-labor matrix lookup |
| **Model Management** | torch.save / torch.load | State dict serialization, versioned model artifacts |
| **API Communication** | Axios | Frontend-to-backend HTTP client |
| **Dev Standards** | PEP-8, Type Hints, Pydantic Models | Production-grade API contracts |

---

## 📁 Project Structure

AutoClaim-AI/
├── frontend/
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ │ ├── UploadPanel.jsx # Drag-and-drop image input
│ │ │ ├── DamageReport.jsx # Structured claim output view
│ │ │ └── CostBreakdown.jsx # Line-item pricing table
│ │ ├── hooks/
│ │ │ └── usePrediction.js # React Query polling hook
│ │ ├── api/
│ │ │ └── client.js # Axios base client
│ │ └── App.jsx
│ ├── tailwind.config.js
│ └── package.json
│
├── backend/
│ ├── main.py # FastAPI app entry point
│ ├── routers/
│ │ └── predict.py # /predict endpoint
│ ├── schemas/
│ │ └── claim.py # Pydantic response models
│ ├── services/
│ │ ├── inference.py # ResNet inference pipeline
│ │ └── pricing.py # Cost estimation engine
│ ├── utils/
│ │ └── preprocessing.py # Image normalization utilities
│ └── requirements.txt
│
├── model/
│ ├── autoclaim_resnet50.pt # Serialized PyTorch model
│ ├── training/
│ │ └── train.py # Fine-tuning script
│ └── MODEL_CARD.md # Architecture, metrics, limitations
│
├── data/
│ ├── pricing_matrix.csv # Parts & labor cost lookup table
│ └── label_taxonomy.json # Component class index map
│
├── docs/
│ └── MODEL_CARD.md
├── .env
├── .gitignore
├── docker-compose.yml
└── README.md


---

## ⚙️ Local Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- CUDA-compatible GPU recommended for inference (CPU inference supported)

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/AutoClaim-AI.git
cd AutoClaim-AI
```

**2. Create and activate a Python virtual environment**
```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**3. Install Python dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**4. Download the pretrained model artifact**
```bash
# Download autoclaim_resnet50.pt and place it in /model/
# Model download link: [Add your model hosting URL here]
```

**5. Configure environment**
```bash
# In /backend, create a .env file
echo "MODEL_PATH=../model/autoclaim_resnet50.pt" > .env
echo "PRICING_MATRIX_PATH=../data/pricing_matrix.csv" >> .env
echo "CONFIDENCE_THRESHOLD=0.72" >> .env
```

**6. Start the FastAPI server**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API documentation available at `http://localhost:8000/docs`

---

### Frontend Setup

**7. Install Node dependencies**
```bash
cd ../frontend
npm install
```

**8. Configure API base URL**
```bash
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
```

**9. Start the React development server**
```bash
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

### Docker Deployment (Recommended for Production)

```bash
# From the project root
docker-compose up --build
```

The `docker-compose.yml` orchestrates both services with correct inter-container networking. Frontend available at `:3000`, API at `:8000`.

---

## 🧠 Model Performance

| Metric | Value |
|---|---|
| **Architecture** | ResNet-50 (fine-tuned) |
| **Training Dataset** | Vehicle damage image corpus |
| **Classification Accuracy** | 87.4% (held-out test set) |
| **Severity F1-Score (Macro)** | 0.83 |
| **Avg. Inference Time (GPU)** | ~140ms per image |
| **Avg. Inference Time (CPU)** | ~890ms per image |
| **Confidence Threshold** | 0.72 (configurable via `.env`) |

> Full training methodology, dataset statistics, bias analysis, and known limitations are documented in [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md).

---

## 📡 API Reference

### `POST /predict`

Upload a vehicle image and receive a structured damage and cost report.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | `File` | ✅ | JPEG / PNG / WEBP, max 10MB |
| `vehicle_make` | `string` | ✅ | e.g., `"Toyota"` |
| `vehicle_model` | `string` | ✅ | e.g., `"Camry"` |
| `vehicle_year` | `integer` | ✅ | e.g., `2019` |

**Response:** `200 OK`

```json
{
  "claim_id": "clm_7f3a9d",
  "status": "complete",
  "vehicle": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2019
  },
  "damage_components": [
    {
      "component": "front_bumper",
      "severity": "Moderate",
      "confidence": 0.91
    },
    {
      "component": "hood",
      "severity": "Minor",
      "confidence": 0.78
    }
  ],
  "cost_estimate": {
    "line_items": [
      { "component": "front_bumper", "severity": "Moderate", "low": 420, "mid": 680, "high": 950 },
      { "component": "hood", "severity": "Minor", "low": 180, "mid": 290, "high": 420 }
    ],
    "total_low": 600,
    "total_mid": 970,
    "total_high": 1370,
    "currency": "USD"
  },
  "processing_time_ms": 312
}
```

---

## 🗺️ Roadmap

- [ ] Multi-image upload support for 360° damage assessment
- [ ] ONNX model export for edge deployment on mobile adjuster apps
- [ ] Policy cross-reference module — auto-flags components not covered by the claimant's plan
- [ ] Fraud detection layer — flags inconsistencies between declared incident type and detected damage pattern
- [ ] Admin dashboard for adjusters: claim queue, override interface, and audit trail

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/pranay-gupta-93a280355)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-22C55E?style=flat-square)](https://github.com/PG1611Bcode)

</div>
