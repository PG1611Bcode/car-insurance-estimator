import streamlit as st
import os
import time
import torch.nn.functional as F
from model_helper import predict, trained_model, class_names, CarClassifierCNNResNet
import torch

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Vehicle Damage Classifier",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Injected CSS ──────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

.stApp {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    min-height: 100vh;
}
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-right: 1px solid rgba(255,255,255,0.08);
}
#MainMenu, footer, header { visibility: hidden; }

/* Hero */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%);
    border-radius: 20px;
    padding: 40px 50px;
    margin-bottom: 28px;
    box-shadow: 0 20px 60px rgba(102,126,234,0.4);
}
.hero-title  { font-size:2.8rem; font-weight:800; color:white; margin:0 0 6px; letter-spacing:-1px; }
.hero-sub    { font-size:1.05rem; color:rgba(255,255,255,0.82); margin:0; }

/* Cards */
.glass-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 18px;
}

/* Prediction result */
.pred-card {
    background: linear-gradient(135deg, rgba(102,126,234,0.22), rgba(118,75,162,0.22));
    border: 1px solid rgba(102,126,234,0.45);
    border-radius: 16px;
    padding: 24px 28px;
    margin-top: 18px;
    display: flex;
    align-items: center;
    gap: 18px;
}
.pred-icon  { font-size:3.2rem; }
.pred-lbl   { font-size:0.75rem; font-weight:700; color:rgba(255,255,255,0.55); letter-spacing:1.5px; text-transform:uppercase; }
.pred-name  { font-size:2rem; font-weight:800; color:white; line-height:1.1; }
.pred-conf  { font-size:0.95rem; color:rgba(255,255,255,0.65); margin-top:6px; }

/* Confidence bars */
.bar-row   { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.bar-label { width:160px; font-size:0.8rem; font-weight:500; color:rgba(255,255,255,0.7); text-align:right; flex-shrink:0; }
.bar-bg    { flex:1; background:rgba(255,255,255,0.08); border-radius:50px; height:10px; overflow:hidden; }
.bar-fill  { height:100%; border-radius:50px; background:linear-gradient(90deg,#667eea,#764ba2); }
.bar-fill.top { background:linear-gradient(90deg,#f64f59,#c471ed,#12c2e9); }
.bar-pct   { width:48px; font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.85); text-align:right; }

/* Stat badges */
.stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px; }
.stat-badge { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:16px 10px; text-align:center; }
.stat-val  { font-size:1.5rem; font-weight:700; color:#a78bfa; }
.stat-lbl  { font-size:0.7rem; color:rgba(255,255,255,0.45); margin-top:4px; text-transform:uppercase; letter-spacing:0.8px; }

/* Misc */
.section-title { font-size:1rem; font-weight:700; color:rgba(255,255,255,0.9); margin-bottom:14px; }
.tip { background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); border-radius:10px; padding:13px 16px; color:rgba(52,211,153,0.9); font-size:0.84rem; }
.warn { background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); border-radius:10px; padding:13px 16px; color:rgba(251,191,36,0.9); font-size:0.84rem; }
.sidebar-sec { font-size:0.7rem; font-weight:700; color:rgba(255,255,255,0.4); letter-spacing:2px; text-transform:uppercase; margin:18px 0 8px; }

[data-testid="stFileUploader"] { border:2px dashed rgba(102,126,234,0.45) !important; border-radius:14px !important; }
.stButton>button {
    background:linear-gradient(135deg,#667eea,#764ba2)!important;
    color:white!important; border:none!important; border-radius:10px!important;
    font-weight:600!important; width:100%!important;
    box-shadow:0 4px 15px rgba(102,126,234,0.35)!important;
}
.stButton>button:hover { transform:translateY(-2px)!important; }
</style>
""", unsafe_allow_html=True)

# ── Class metadata ────────────────────────────────────────────────────────────
CLASS_META = {
    "Front Breakage": {"icon": "💥", "desc": "Front panel breakage / structural fracture"},
    "Front Crushed":  {"icon": "🔨", "desc": "Front section crushed / severe impact damage"},
    "Front Normal":   {"icon": "✅", "desc": "Front of vehicle appears undamaged"},
    "Rear Breakage":  {"icon": "💢", "desc": "Rear panel breakage / structural fracture"},
    "Rear Crushed":   {"icon": "🚗", "desc": "Rear section crushed / severe rear-end impact"},
    "Rear Normal":    {"icon": "✅", "desc": "Rear of vehicle appears undamaged"},
}

MODEL_PATH = os.path.join("artifacts", "saved_model.pth")

# ── Load model with softmax probabilities ─────────────────────────────────────
@st.cache_resource(show_spinner=False)
def load_resnet():
    import torch
    m = CarClassifierCNNResNet()
    m.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
    m.eval()
    return m

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🚗 Vehicle Damage AI")
    st.markdown("<p style='color:rgba(255,255,255,0.5);font-size:0.83rem;'>ResNet-50 transfer learning model trained to classify front/rear vehicle damage.</p>", unsafe_allow_html=True)
    st.divider()

    st.markdown('<p class="sidebar-sec">⚙️ Model Info</p>', unsafe_allow_html=True)
    model_ok = os.path.exists(MODEL_PATH)
    if model_ok:
        size_mb = os.path.getsize(MODEL_PATH) / 1_048_576
        st.markdown(f"""
        <div class="glass-card" style="padding:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="stat-badge"><div class="stat-val">{len(class_names)}</div><div class="stat-lbl">Classes</div></div>
                <div class="stat-badge"><div class="stat-val">{size_mb:.0f}M</div><div class="stat-lbl">Size</div></div>
            </div>
            <div style="font-size:0.73rem;color:rgba(255,255,255,0.4);margin-top:8px;">ResNet-50 · saved_model.pth</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.warning("❌ `artifacts/saved_model.pth` not found")

    st.divider()
    st.markdown('<p class="sidebar-sec">🏷️ Classes</p>', unsafe_allow_html=True)
    for name, meta in CLASS_META.items():
        st.markdown(
            f"<div style='display:flex;align-items:center;gap:8px;margin-bottom:8px;'>"
            f"<span style='font-size:1.1rem'>{meta['icon']}</span>"
            f"<div><div style='font-size:0.82rem;font-weight:600;color:rgba(255,255,255,0.85);'>{name}</div>"
            f"<div style='font-size:0.7rem;color:rgba(255,255,255,0.42);'>{meta['desc']}</div></div></div>",
            unsafe_allow_html=True,
        )

    st.divider()
    st.markdown("<p style='font-size:0.68rem;color:rgba(255,255,255,0.25);text-align:center;'>MiniProject · Vehicle Damage Classifier · 2026</p>", unsafe_allow_html=True)

# ── Hero ──────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="hero">
    <div class="hero-title">🚗 Vehicle Damage Classifier</div>
    <div class="hero-sub">Upload a front or rear photo of a vehicle — ResNet-50 identifies the damage category instantly</div>
</div>
""", unsafe_allow_html=True)

# Stat badges
st.markdown("""
<div class="stat-grid">
    <div class="stat-badge"><div class="stat-val">6</div><div class="stat-lbl">Damage Classes</div></div>
    <div class="stat-badge"><div class="stat-val">ResNet</div><div class="stat-lbl">Architecture</div></div>
    <div class="stat-badge"><div class="stat-val">224px</div><div class="stat-lbl">Input Size</div></div>
</div>
""", unsafe_allow_html=True)

# Guard: model must exist
if not model_ok:
    st.markdown('<div class="warn">⚠️ Model file not found at <code>artifacts/saved_model.pth</code>. Please check the path.</div>', unsafe_allow_html=True)
    st.stop()

# Load model
with st.spinner("Loading ResNet-50 model…"):
    resnet = load_resnet()

st.markdown('<div class="tip">✅ ResNet-50 model loaded and ready</div>', unsafe_allow_html=True)
st.markdown("<br>", unsafe_allow_html=True)

# ── Upload + Results ──────────────────────────────────────────────────────────
col_up, col_res = st.columns([1.1, 1], gap="large")

with col_up:
    st.markdown('<div class="section-title">📤 Upload Vehicle Image</div>', unsafe_allow_html=True)
    uploaded = st.file_uploader("Drop or browse", type=["jpg", "jpeg", "png"], label_visibility="collapsed")

    if uploaded:
        st.image(uploaded, caption=uploaded.name, use_container_width=True)
        run_btn = st.button("🔍  Classify Damage", key="run")
    else:
        st.markdown("""
        <div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.28);">
            <div style="font-size:3rem;margin-bottom:12px;">📷</div>
            <div style="font-size:0.88rem;">Upload a front or rear vehicle photo</div>
        </div>
        """, unsafe_allow_html=True)

with col_res:
    st.markdown('<div class="section-title">📊 Prediction Results</div>', unsafe_allow_html=True)

    if uploaded and "run_btn" in dir() and run_btn:
        # Save temp file (model_helper needs a file path)
        tmp_path = "temp_upload.jpg"
        with open(tmp_path, "wb") as f:
            f.write(uploaded.getbuffer())

        with st.spinner("Running inference…"):
            from torchvision import transforms
            from PIL import Image
            import torch

            img = Image.open(tmp_path).convert("RGB")
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])
            tensor = transform(img).unsqueeze(0)

            t0 = time.perf_counter()
            with torch.no_grad():
                logits = resnet(tensor)
                probs  = F.softmax(logits, dim=1).squeeze().tolist()
            elapsed_ms = (time.perf_counter() - t0) * 1000

        top_idx  = probs.index(max(probs))
        pred_name = class_names[top_idx]
        conf      = probs[top_idx]
        meta      = CLASS_META.get(pred_name, {"icon": "🔍", "desc": ""})

        # Prediction card
        st.markdown(f"""
        <div class="pred-card">
            <div class="pred-icon">{meta['icon']}</div>
            <div>
                <div class="pred-lbl">Predicted Class</div>
                <div class="pred-name">{pred_name}</div>
                <div class="pred-conf">Confidence: <strong>{conf*100:.1f}%</strong></div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown(f"<p style='color:rgba(255,255,255,0.55);font-size:0.84rem;margin-top:12px;'>📌 {meta['desc']}</p>", unsafe_allow_html=True)

        # Confidence bars
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown('<div class="section-title">📈 Class Probabilities</div>', unsafe_allow_html=True)

        sorted_classes = sorted(zip(class_names, probs), key=lambda x: x[1], reverse=True)
        bars_html = ""
        for i, (cn, sc) in enumerate(sorted_classes):
            fill_cls = "top" if i == 0 else ""
            pct      = sc * 100
            bars_html += f"""
            <div class="bar-row">
                <div class="bar-label">{cn}</div>
                <div class="bar-bg"><div class="bar-fill {fill_cls}" style="width:{max(pct,0.5):.1f}%;"></div></div>
                <div class="bar-pct">{pct:.1f}%</div>
            </div>"""
        st.markdown(bars_html, unsafe_allow_html=True)

        st.markdown(f"<p style='color:rgba(255,255,255,0.3);font-size:0.73rem;margin-top:12px;'>⚡ Inference: {elapsed_ms:.0f} ms</p>", unsafe_allow_html=True)

        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    elif uploaded:
        st.markdown("""
        <div style="text-align:center;padding:60px 10px;color:rgba(255,255,255,0.28);">
            <div style="font-size:2.5rem;margin-bottom:10px;">🔍</div>
            <div style="font-size:0.87rem;">Click <strong>Classify Damage</strong> to run the model</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="text-align:center;padding:60px 10px;color:rgba(255,255,255,0.28);">
            <div style="font-size:2.5rem;margin-bottom:10px;">⬆️</div>
            <div style="font-size:0.87rem;">Upload an image to see predictions here</div>
        </div>
        """, unsafe_allow_html=True)

# ── How it works ──────────────────────────────────────────────────────────────
st.markdown("<br>", unsafe_allow_html=True)
st.markdown('<div class="section-title">💡 How It Works</div>', unsafe_allow_html=True)
cols = st.columns(4)
steps = [
    ("📷", "Upload",      "Choose a JPG/PNG photo of a damaged vehicle"),
    ("⚙️", "Preprocess", "Resized to 224×224, normalised with ImageNet stats"),
    ("🧠", "ResNet-50",   "Fine-tuned backbone classifies front vs rear damage"),
    ("📊", "Results",     "Top-1 class + full softmax probability distribution"),
]
for col, (icon, title, desc) in zip(cols, steps):
    col.markdown(f"""
    <div class="glass-card" style="text-align:center;padding:20px 14px;">
        <div style="font-size:2rem;margin-bottom:8px;">{icon}</div>
        <div style="font-weight:700;color:white;font-size:0.88rem;margin-bottom:6px;">{title}</div>
        <div style="font-size:0.76rem;color:rgba(255,255,255,0.48);">{desc}</div>
    </div>
    """, unsafe_allow_html=True)