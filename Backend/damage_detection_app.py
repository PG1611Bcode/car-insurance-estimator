import streamlit as st
import os
import time
import numpy as np
from PIL import Image

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Car Damage Detector",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* Google Font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* Root */
html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* Dark gradient background */
.stApp {
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    min-height: 100vh;
}

/* Sidebar */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    border-right: 1px solid rgba(255,255,255,0.08);
}

/* Hide Streamlit branding */
#MainMenu, footer, header { visibility: hidden; }

/* Hero banner */
.hero-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%);
    border-radius: 20px;
    padding: 40px 50px;
    margin-bottom: 32px;
    box-shadow: 0 20px 60px rgba(102,126,234,0.4);
    position: relative;
    overflow: hidden;
}
.hero-banner::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
    animation: pulse 4s ease-in-out infinite;
}
@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.1); opacity: 1; }
}
.hero-title {
    font-size: 3rem;
    font-weight: 800;
    color: white;
    margin: 0 0 8px;
    letter-spacing: -1px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.3);
}
.hero-sub {
    font-size: 1.15rem;
    color: rgba(255,255,255,0.85);
    margin: 0;
    font-weight: 400;
}

/* Glass card */
.glass-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 20px;
}

/* Prediction banner */
.pred-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25));
    border: 1px solid rgba(102,126,234,0.4);
    border-radius: 14px;
    padding: 20px 24px;
    margin-top: 20px;
}
.pred-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
}
.pred-class {
    font-size: 2rem;
    font-weight: 800;
    color: white;
    line-height: 1;
}
.pred-conf {
    font-size: 1rem;
    color: rgba(255,255,255,0.7);
    margin-top: 6px;
}
.pred-icon { font-size: 3rem; }

/* Confidence bar */
.conf-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}
.conf-label {
    width: 130px;
    font-size: 0.82rem;
    font-weight: 500;
    color: rgba(255,255,255,0.75);
    text-align: right;
    flex-shrink: 0;
}
.conf-bar-bg {
    flex: 1;
    background: rgba(255,255,255,0.08);
    border-radius: 50px;
    height: 10px;
    overflow: hidden;
}
.conf-bar-fill {
    height: 100%;
    border-radius: 50px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.6s ease;
}
.conf-bar-fill.top {
    background: linear-gradient(90deg, #f64f59, #c471ed, #12c2e9);
}
.conf-pct {
    width: 46px;
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    text-align: right;
}

/* Stat badges  */
.stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 24px;
}
.stat-badge {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 16px 14px;
    text-align: center;
}
.stat-val {
    font-size: 1.5rem;
    font-weight: 700;
    color: #a78bfa;
    line-height: 1;
}
.stat-lbl {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.5);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

/* Warning box */
.warn-box {
    background: rgba(251,191,36,0.1);
    border: 1px solid rgba(251,191,36,0.3);
    border-radius: 10px;
    padding: 14px 16px;
    color: rgba(251,191,36,0.9);
    font-size: 0.85rem;
}

/* Success box */
.success-box {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    border-radius: 10px;
    padding: 14px 16px;
    color: rgba(52,211,153,0.9);
    font-size: 0.85rem;
}

/* Section title */
.section-title {
    font-size: 1rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 0.5px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Sidebar headings */
.sidebar-section {
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(255,255,255,0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 20px 0 8px;
}

/* Image container */
.img-container {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
}

/* Spinner override */
.stSpinner > div {
    border-top-color: #764ba2 !important;
}

/* File uploader */
[data-testid="stFileUploader"] {
    background: rgba(255,255,255,0.03) !important;
    border: 2px dashed rgba(102,126,234,0.4) !important;
    border-radius: 14px !important;
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #667eea, #764ba2) !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    padding: 10px 24px !important;
    width: 100% !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 15px rgba(102,126,234,0.3) !important;
}
.stButton > button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(102,126,234,0.5) !important;
}
</style>
""", unsafe_allow_html=True)

# ── Class metadata ────────────────────────────────────────────────────────────
CLASS_META = {
    "crack":         {"icon": "🔩", "color": "#ef4444", "desc": "Structural crack in body panel or glass"},
    "dent":          {"icon": "🔨", "color": "#f97316", "desc": "Dent or deformation in the vehicle body"},
    "glass_shatter": {"icon": "💥", "color": "#a855f7", "desc": "Shattered or broken glass (windshield/window)"},
    "lamp_broken":   {"icon": "💡", "color": "#eab308", "desc": "Broken headlight, tail light or indicator"},
    "scratch":       {"icon": "✏️",  "color": "#3b82f6", "desc": "Surface scratch or paint damage"},
    "tire_flat":     {"icon": "🛞", "color": "#10b981", "desc": "Flat, punctured or deflated tyre"},
}

# ── Model path ────────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join("artifacts", "yolo_damage_best.pt")

# ── Load model ────────────────────────────────────────────────────────────────
@st.cache_resource(show_spinner=False)
def load_model(path):
    from ultralytics import YOLO
    model = YOLO(path)
    return model

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown('<p class="sidebar-section">🚗 Navigation</p>', unsafe_allow_html=True)

    st.markdown("### Car Damage AI")
    st.markdown(
        "<p style='color:rgba(255,255,255,0.55);font-size:0.85rem;'>"
        "Powered by YOLOv8n-cls fine-tuned on 6 vehicle damage categories."
        "</p>",
        unsafe_allow_html=True,
    )

    st.divider()

    # Model info
    st.markdown('<p class="sidebar-section">⚙️ Model Info</p>', unsafe_allow_html=True)
    model_exists = os.path.exists(MODEL_PATH)
    if model_exists:
        size_mb = os.path.getsize(MODEL_PATH) / 1_048_576
        st.markdown(f"""
        <div class="glass-card" style="padding:16px;">
            <div class="stat-grid" style="grid-template-columns:1fr 1fr;">
                <div class="stat-badge">
                    <div class="stat-val">52%</div>
                    <div class="stat-lbl">Val Acc</div>
                </div>
                <div class="stat-badge">
                    <div class="stat-val">{size_mb:.1f}M</div>
                    <div class="stat-lbl">Size</div>
                </div>
            </div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.45);margin-top:4px;">
                YOLOv8n-cls · 10 epochs · 6 classes
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.warning("Model not found at `artifacts/yolo_damage_best.pt`")

    st.divider()

    # Damage classes
    st.markdown('<p class="sidebar-section">🏷️ Damage Classes</p>', unsafe_allow_html=True)
    for cls, meta in CLASS_META.items():
        st.markdown(
            f"<div style='display:flex;align-items:center;gap:8px;margin-bottom:8px;'>"
            f"<span style='font-size:1.1rem;'>{meta['icon']}</span>"
            f"<div>"
            f"<div style='font-size:0.82rem;font-weight:600;color:rgba(255,255,255,0.85);'>{cls.replace('_',' ').title()}</div>"
            f"<div style='font-size:0.72rem;color:rgba(255,255,255,0.45);'>{meta['desc']}</div>"
            f"</div></div>",
            unsafe_allow_html=True,
        )

    st.divider()
    st.markdown(
        "<p style='font-size:0.7rem;color:rgba(255,255,255,0.3);text-align:center;'>"
        "MiniProject · Car Damage Detection · 2026"
        "</p>",
        unsafe_allow_html=True,
    )

# ── Main layout ───────────────────────────────────────────────────────────────
# Hero
st.markdown("""
<div class="hero-banner">
    <div class="hero-title">🚗 Car Damage Detector</div>
    <div class="hero-sub">Upload a photo of a damaged vehicle and let YOLOv8 identify the damage type instantly</div>
</div>
""", unsafe_allow_html=True)

# Stat badges
st.markdown("""
<div class="stat-grid">
    <div class="stat-badge">
        <div class="stat-val">6</div>
        <div class="stat-lbl">Damage Types</div>
    </div>
    <div class="stat-badge">
        <div class="stat-val">6.1K</div>
        <div class="stat-lbl">Training Images</div>
    </div>
    <div class="stat-badge">
        <div class="stat-val">52%</div>
        <div class="stat-lbl">Top-1 Accuracy</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Check model availability
if not model_exists:
    st.markdown("""
    <div class="warn-box">
        ⚠️ <strong>Model not found.</strong>  
        Expected: <code>artifacts/yolo_damage_best.pt</code><br>
        Please run <code>python save_yolo_model.py</code> from the Backend directory first.
    </div>
    """, unsafe_allow_html=True)
    st.stop()

# Load model (cached)
with st.spinner("Loading YOLOv8 model…"):
    model = load_model(MODEL_PATH)

st.markdown("""
<div class="success-box">
    ✅ <strong>YOLOv8 model loaded</strong> — ready for inference
</div>
""", unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Upload + Results columns
col_upload, col_result = st.columns([1.1, 1], gap="large")

with col_upload:
    st.markdown('<div class="section-title">📤 Upload Image</div>', unsafe_allow_html=True)
    uploaded = st.file_uploader(
        label="Drop or browse an image",
        type=["jpg", "jpeg", "png", "webp", "bmp"],
        label_visibility="collapsed",
    )

    if uploaded:
        image = Image.open(uploaded).convert("RGB")
        st.markdown('<div class="img-container">', unsafe_allow_html=True)
        st.image(image, caption=uploaded.name, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

        run_btn = st.button("🔍  Analyse Damage", key="run")
    else:
        st.markdown("""
        <div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.3);">
            <div style="font-size:3rem;margin-bottom:12px;">📷</div>
            <div style="font-size:0.9rem;">Supported: JPG · PNG · WEBP · BMP</div>
        </div>
        """, unsafe_allow_html=True)

with col_result:
    st.markdown('<div class="section-title">📊 Prediction Results</div>', unsafe_allow_html=True)

    if uploaded and "run_btn" in dir() and run_btn:
        # ── Run inference ─────────────────────────────────────────────────────
        with st.spinner("Analysing image…"):
            img_array = np.array(image)          # PIL → HxWxC uint8 (RGB)

            t0    = time.perf_counter()
            preds = model.predict(img_array, verbose=False, imgsz=224)
            elapsed_ms = (time.perf_counter() - t0) * 1000

        probs  = preds[0].probs            # Ultralytics Probs object
        names  = preds[0].names            # {0: 'crack', 1: 'dent', …}
        top1   = int(probs.top1)           # index of top prediction
        top5   = list(probs.top5)          # indices of top-5

        pred_name = names[top1]
        conf_top1 = float(probs.data[top1])
        meta      = CLASS_META.get(pred_name, {"icon": "🔍", "color": "#667eea", "desc": ""})

        # ── Prediction card ───────────────────────────────────────────────────
        st.markdown(f"""
        <div class="pred-banner">
            <div class="pred-icon">{meta['icon']}</div>
            <div>
                <div class="pred-label">Detected Damage</div>
                <div class="pred-class">{pred_name.replace('_', ' ').title()}</div>
                <div class="pred-conf">Confidence: <strong>{conf_top1*100:.1f}%</strong></div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # ── Description ───────────────────────────────────────────────────────
        st.markdown(
            f"<p style='color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:14px;'>"
            f"📌 {meta['desc']}</p>",
            unsafe_allow_html=True,
        )

        # ── Confidence bars (all 6 classes sorted by score) ───────────────────
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown('<div class="section-title">📈 Class Probabilities</div>', unsafe_allow_html=True)

        all_scores = [(names[i], float(probs.data[i])) for i in range(len(names))]
        all_scores.sort(key=lambda x: x[1], reverse=True)

        html_bars = ""
        for idx, (cls_name, score) in enumerate(all_scores):
            pct        = score * 100
            fill_class = "top" if idx == 0 else ""
            bar_width  = max(pct, 0.5)   # min visible width
            display    = cls_name.replace("_", " ").title()
            html_bars += f"""
            <div class="conf-row">
                <div class="conf-label">{display}</div>
                <div class="conf-bar-bg">
                    <div class="conf-bar-fill {fill_class}" style="width:{bar_width}%;"></div>
                </div>
                <div class="conf-pct">{pct:.1f}%</div>
            </div>"""

        st.markdown(html_bars, unsafe_allow_html=True)

        # ── Inference time ────────────────────────────────────────────────────
        st.markdown(
            f"<p style='color:rgba(255,255,255,0.35);font-size:0.75rem;margin-top:14px;'>"
            f"⚡ Inference time: {elapsed_ms:.0f} ms</p>",
            unsafe_allow_html=True,
        )

    elif uploaded:
        st.markdown("""
        <div style="text-align:center;padding:60px 10px;color:rgba(255,255,255,0.3);">
            <div style="font-size:2.5rem;margin-bottom:10px;">🔍</div>
            <div style="font-size:0.9rem;">Click <strong>Analyse Damage</strong> to run the model</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="text-align:center;padding:60px 10px;color:rgba(255,255,255,0.3);">
            <div style="font-size:2.5rem;margin-bottom:10px;">⬆️</div>
            <div style="font-size:0.9rem;">Upload an image to see predictions here</div>
        </div>
        """, unsafe_allow_html=True)

# ── How it works section ──────────────────────────────────────────────────────
st.markdown("<br>", unsafe_allow_html=True)
st.markdown('<div class="section-title">💡 How It Works</div>', unsafe_allow_html=True)
c1, c2, c3, c4 = st.columns(4)
steps = [
    ("📷", "Upload", "Choose any JPG/PNG photo of a damaged vehicle"),
    ("⚙️", "Preprocess", "Image resized to 224×224 and normalised"),
    ("🧠", "YOLOv8 Inference", "Fine-tuned nano classification model runs on CPU"),
    ("📊", "Results", "Top-1 class + full probability distribution displayed"),
]
for col, (icon, title, desc) in zip([c1, c2, c3, c4], steps):
    col.markdown(f"""
    <div class="glass-card" style="text-align:center;padding:22px 16px;">
        <div style="font-size:2rem;margin-bottom:8px;">{icon}</div>
        <div style="font-weight:700;color:white;font-size:0.9rem;margin-bottom:6px;">{title}</div>
        <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);">{desc}</div>
    </div>
    """, unsafe_allow_html=True)
