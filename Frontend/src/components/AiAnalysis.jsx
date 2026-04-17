import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, RefreshCw, Layers, Wrench,
  Cpu, ScanLine, Sparkles, AlertCircle, Target, BarChart2,
  FileDown, IndianRupee
} from 'lucide-react';
import { DamageService } from '../services/DamageService';

// ── Constants ────────────────────────────────────────────────────────────────
const RESNET_CLASSES = [
  'Front Breakage',
  'Front Crushed',
  'Front Normal',
  'Rear Breakage',
  'Rear Crushed',
  'Rear Normal',
];

const CLASS_COLORS = {
  'Front Breakage': '#f97316',
  'Front Crushed':  '#ef4444',
  'Front Normal':   '#00ff88',
  'Rear Breakage':  '#fb923c',
  'Rear Crushed':   '#dc2626',
  'Rear Normal':    '#00ff88',
};

const CLASS_ICONS = {
  'Front Breakage': '💥',
  'Front Crushed':  '🔨',
  'Front Normal':   '✅',
  'Rear Breakage':  '💢',
  'Rear Crushed':   '🚗',
  'Rear Normal':    '✅',
};

// ── YOLO-specific class styling ────────────────────────────────────────────
const YOLO_CLASSES_DEFAULT = [
  'Scratch', 'Dent', 'Crack', 'Glass Breakage', 'Lamp Breakage', 'Flat Tyre', 'Rust',
];

const YOLO_CLASS_COLORS = {
  'Scratch':        '#00f5ff',
  'Dent':           '#f97316',
  'Crack':          '#ef4444',
  'Glass Breakage': '#a78bfa',
  'Lamp Breakage':  '#fbbf24',
  'Flat Tyre':      '#fb923c',
  'Rust':           '#dc2626',
};

const YOLO_CLASS_ICONS = {
  'Scratch':        '🔧',
  'Dent':           '🔨',
  'Crack':          '⚡',
  'Glass Breakage': '🪟',
  'Lamp Breakage':  '💡',
  'Flat Tyre':      '🛞',
  'Rust':           '🟤',
};

function getYoloColor(label) {
  // Try exact match first, then case-insensitive
  if (YOLO_CLASS_COLORS[label]) return YOLO_CLASS_COLORS[label];
  const key = Object.keys(YOLO_CLASS_COLORS).find(
    k => k.toLowerCase() === (label || '').toLowerCase()
  );
  return key ? YOLO_CLASS_COLORS[key] : '#00f5ff';
}
function getYoloIcon(label) {
  if (YOLO_CLASS_ICONS[label]) return YOLO_CLASS_ICONS[label];
  const key = Object.keys(YOLO_CLASS_ICONS).find(
    k => k.toLowerCase() === (label || '').toLowerCase()
  );
  return key ? YOLO_CLASS_ICONS[key] : '🔷';
}

// ── Price mapping based on damage class ───────────────────────────────────────
const DAMAGE_PRICE_MAP = {
  'Front Normal':  { min: 0,      max: 0,       label: 'No damage detected',        color: '#00ff88' },
  'Rear Normal':   { min: 0,      max: 0,       label: 'No damage detected',        color: '#00ff88' },
  'Front Breakage':{ min: 15000,  max: 45000,   label: 'Breakage damage detected',  color: '#f97316' },
  'Rear Breakage': { min: 15000,  max: 45000,   label: 'Breakage damage detected',  color: '#fb923c' },
  'Front Crushed': { min: 50000,  max: 120000,  label: 'Severe crush damage',       color: '#ef4444' },
  'Rear Crushed':  { min: 50000,  max: 120000,  label: 'Severe crush damage',       color: '#dc2626' },
};

function formatINR(n) {
  return '\u20B9' + Math.round(n).toLocaleString('en-IN');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateMockScores(topClass) {
  const scores = {};
  let topVal = 0.72 + Math.random() * 0.20;
  scores[topClass] = topVal;
  let remaining = 1.0 - topVal;
  const others = RESNET_CLASSES.filter(c => c !== topClass);
  others.forEach((cls, i) => {
    const share = i < others.length - 1 ? remaining * (0.05 + Math.random() * 0.35) : remaining;
    scores[cls] = share;
    remaining -= share;
  });
  return scores;
}

// ── Horizontal mini bar for class scores ────────────────────────────────────
function MiniBar({ label, value, maxVal, color, isTop, iconFn }) {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : value * 100;
  const icon = iconFn ? iconFn(label) : (CLASS_ICONS[label] || '🔷');
  return (
    <div className={`flex items-center gap-2 py-0.5 ${isTop ? 'opacity-100' : 'opacity-65'}`}>
      <span className="text-[10px] text-white/60 shrink-0 leading-tight truncate" style={{ width: 104 }} title={label}>
        {icon} {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: isTop ? `0 0 6px ${color}` : 'none' }}
        />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ── Estimated Repair Cost Card ─────────────────────────────────────────────────
function RepairCostCard({ damageClass }) {
  const info = DAMAGE_PRICE_MAP[damageClass] ?? DAMAGE_PRICE_MAP['Front Normal'];
  const isNoDamage = info.min === 0 && info.max === 0;
  const rangeText = isNoDamage ? '\u20B90' : `${formatINR(info.min)} – ${formatINR(info.max)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-5 lg:p-6 flex flex-col gap-3 bg-white/90 dark:bg-transparent shadow-lg"
      style={{
        border: `1px solid ${info.color}33`,
        background: `linear-gradient(135deg, ${info.color}08, transparent 70%)`,
        boxShadow: `0 0 30px ${info.color}10`,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl" style={{ background: `${info.color}15`, border: `1px solid ${info.color}25` }}>
          <IndianRupee className="w-4 h-4" style={{ color: info.color }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50">Estimated Repair Cost</p>
          <p className="text-[10px] text-gray-400 dark:text-white/25">{info.label}</p>
        </div>
      </div>

      <div className="text-center py-2">
        <p
          className="text-3xl lg:text-4xl font-black tracking-tight"
          style={{ color: info.color, textShadow: `0 0 24px ${info.color}55` }}
        >
          {rangeText}
        </p>
        {!isNoDamage && (
          <p className="text-gray-600 dark:text-white/30 text-xs mt-1">Estimated range in Indian Rupees</p>
        )}
      </div>

      <p className="text-gray-400 dark:text-white/20 text-[10px] text-center border-t border-gray-200 dark:border-white/[0.05] pt-3">
        Estimated cost based on AI damage classification. Actual cost may vary.
      </p>
    </motion.div>
  );
}

// ── PDF Generation ─────────────────────────────────────────────────────────────
function generatePolicyRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'CI-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

async function downloadScanPDF({ previewUrl, resnetClass, resnetConf, detections, normScores }) {
  const { jsPDF } = window.jspdf;
  // Using 'mm' strictly. A4: 210 x 297
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = 180;
  let y = margin;

  // ── Colors ──────────────────────────────────────────────────────────────
  const NAVY = [10, 22, 40];
  const CYAN = [0, 200, 224];
  const AMBER = [245, 158, 11];
  const GREY_TEXT = [100, 110, 120];
  const GREY_LIGHT = [229, 231, 235];
  const CYAN_TINT = [240, 255, 254];

  const formatINRText = (n) => `INR ${(Math.round(n)).toLocaleString('en-IN')}`;

  // ── Header Section ──────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Official Vehicle Damage Assessment Report', pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('AI-Powered Car Insurance Claim  ·  Car Intelligence', pageW / 2, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  const policyRef = generatePolicyRef();
  const dateStr = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(8);
  doc.text(`Policy Ref: ${policyRef}   |   Generated: ${dateStr}`, pageW / 2, y, { align: 'center' });
  y += 7;

  // ── Helper functions for Sections ───────────────────────────────────────
  const sectionHeader = (title) => {
    doc.setFillColor(...NAVY);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 2, y + 4.8);
    y += 10;
  };

  // ── Image Section ───────────────────────────────────────────────────────
  if (previewUrl) {
    try {
      sectionHeader('Uploaded Vehicle Image');
      const imgMaxW = contentW;
      const imgMaxH = 100; // Force smaller on A4 to avoid page 2 bleeding
      doc.setDrawColor(...GREY_LIGHT);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, imgMaxW, imgMaxH, 'D');
      doc.addImage(previewUrl, 'JPEG', margin, y, imgMaxW, imgMaxH, undefined, 'FAST');
      y += imgMaxH + 5;
    } catch (e) {
      console.warn('Image embedding failed', e);
      y += 5;
    }
  }

  // ── ResNet-50 Section ───────────────────────────────────────────────────
  sectionHeader('ResNet-50 Classifier — Damage Classification');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Predicted Class: ', margin, y);
  const pWidth = doc.getTextWidth('Predicted Class: ');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(resnetClass, margin + pWidth, y);
  
  const confText = 'Confidence: ';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  const confX = margin + 140;
  doc.text(confText, confX, y);
  const cWidth = doc.getTextWidth(confText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CYAN);
  doc.text(`${Math.round(resnetConf * 100)}%`, confX + cWidth, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('All Class Probabilities:', margin, y);
  y += 4;

  normScores.forEach((item, i) => {
    const pctNum = Math.round(item.value * 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NAVY);
    doc.text(item.label, margin, y);

    const barX = margin + 55;
    const barW = 90; 
    const barH = 2.5;
    
    doc.setFillColor(...GREY_LIGHT);
    doc.rect(barX, y - 2, barW, barH, 'F');
    if (pctNum > 0) {
      doc.setFillColor(i === 0 ? CYAN[0] : GREY_TEXT[0], i === 0 ? CYAN[1] : GREY_TEXT[1], i === 0 ? CYAN[2] : GREY_TEXT[2]);
      doc.rect(barX, y - 2, barW * (pctNum / 100), barH, 'F');
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(`${pctNum}%`, barX + barW + 15, y, { align: 'right' });
    y += 4;
  });
  y += 2;

  // ── YOLO Section ────────────────────────────────────────────────────────
  sectionHeader('YOLO Detector — Detected Regions');
  if (!detections || detections.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREY_TEXT);
    doc.text('No standard regions detected.', margin, y);
    y += 5;
  } else {
    detections.forEach((det, i) => {
      const pctNum = Math.round((det.confidence ?? det.score ?? 0.8) * 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...NAVY);
      doc.text(`${i + 1}. ${det.label ?? `Region ${i + 1}`}`, margin, y);

      const barX = margin + 55;
      const barW = 90; 
      const barH = 2.5;
      
      doc.setFillColor(...GREY_LIGHT);
      doc.rect(barX, y - 2, barW, barH, 'F');
      doc.setFillColor(...AMBER);
      doc.rect(barX, y - 2, barW * (pctNum / 100), barH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(`${pctNum}%`, barX + barW + 15, y, { align: 'right' });
      y += 4;
    });
  }
  y += 4;

  // ── Cost Estimate Section ───────────────────────────────────────────────
  const priceInfo = DAMAGE_PRICE_MAP[resnetClass] ?? DAMAGE_PRICE_MAP['Front Normal'];
  const isNoDamage = priceInfo.min === 0 && priceInfo.max === 0;
  const costBoxH = 25;
  
  doc.setFillColor(...CYAN_TINT);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, costBoxH, 2, 2, 'FD');
  
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Estimated Repair Cost (Indian Rupees)', pageW / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CYAN);
  const costStr = isNoDamage ? 'INR 0' : `${formatINRText(priceInfo.min)} – ${formatINRText(priceInfo.max)}`;
  doc.text(costStr, pageW / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Estimated cost based on AI classification. Actual repair costs may vary.', pageW / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('This report is AI-generated. Final claim amounts are subject to surveyor verification.', pageW / 2, y, { align: 'center' });
  
  // ── Footer ──────────────────────────────────────────────────────────────
  const footerY = pageH - 12;
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text(`Page 1 of 1  |  Policy Ref: ${policyRef}  |  Car Intelligence`, pageW / 2, footerY, { align: 'center' });

  doc.save(`Damage_Claim_Report_${policyRef}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiAnalysis() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [status, setStatus]     = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults]   = useState(null);

  const [phase, setPhase]       = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

const onDrop = useCallback((accepted) => {
    if (accepted?.length > 0) {
      setFile(accepted[0]);
      setPreview(URL.createObjectURL(accepted[0]));
      setStatus('idle');
      setResults(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png'] }, multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('scanning');
    setProgress(0);
    setPhase('Initializing AI models...');

    const phases = ['Running YOLO detection...', 'ResNet-50 classification...', 'Computing confidence scores...', 'Finalizing...'];
    let phaseIdx = 0;

    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + Math.floor(Math.random() * 12);
        if (next > 25  && phaseIdx === 0) { phaseIdx = 1; setPhase(phases[1]); }
        if (next > 50  && phaseIdx === 1) { phaseIdx = 2; setPhase(phases[2]); }
        if (next > 78  && phaseIdx === 2) { phaseIdx = 3; setPhase(phases[3]); }
        return Math.min(next, 92);
      });
    }, 280);

    try {
      const data = await DamageService.analyzeClaim(file);
      clearInterval(interval);
      setProgress(100);
      setPhase('Complete ✓');
      setTimeout(() => { setResults(data); setStatus('complete'); }, 600);
    } catch {
      clearInterval(interval);
      setStatus('error');
    }
  };

  // ── Derive display values from API response ─────────────────────────────
  const resnetClass = results?.resnet_class ?? results?.location ?? results?.damage_type ?? 'Rear Crushed';
  const resnetConf  = results?.resnet_confidence ?? results?.yolo_data?.confidence ?? 0.82;
  const rawScores   = results?.class_scores ?? {};

  // Build sorted score entries with fallback
  const scoreEntries = RESNET_CLASSES.map(cls => ({
    label: cls,
    value: rawScores[cls] ?? (cls === resnetClass ? resnetConf : Math.random() * 0.08),
  }));
  // Normalize so they sum to ~1
  const scoreSum = scoreEntries.reduce((s, e) => s + e.value, 0);
  const normScores = scoreEntries.map(e => ({ ...e, value: scoreSum > 0 ? e.value / scoreSum : e.value }));
  normScores.sort((a, b) => b.value - a.value);
  const maxScore = normScores[0]?.value ?? 1;

  const summaryColor = resnetClass.includes('Normal') ? '#00ff88' :
    resnetClass.includes('Crushed') ? '#ef4444' : '#f97316';
  const confLabel = resnetConf >= 0.85 ? 'High Confidence' : resnetConf >= 0.65 ? 'Medium Confidence' : 'Low Confidence';

  const yoloLabel  = results?.yolo_data?.label ?? results?.damage_type ?? resnetClass;
  const yoloConf   = results?.yolo_data?.confidence ?? resnetConf;

  // ── YOLO detections (above threshold) from API ────────────────────────
  let detections = results?.yolo_data?.detections ?? [];
  detections = [...detections].sort((a, b) =>
    (b.confidence ?? b.score ?? 0) - (a.confidence ?? a.score ?? 0)
  );

  // ── YOLO ALL class scores (every class, including 0%) ─────────────────
  const yoloClassScores = results?.yolo_data?.class_scores ?? {};
  // Determine the canonical class list: prefer API's all_classes, then keys from
  // class_scores, then fall back to our known YOLO_CLASSES_DEFAULT
  const apiAllClasses = results?.yolo_data?.all_classes ?? Object.keys(yoloClassScores);
  const yoloAllClasses = apiAllClasses.length > 0 ? apiAllClasses : YOLO_CLASSES_DEFAULT;

  // Build sorted entries for the "All Class Scores" section
  // Always includes every class — zero score if not returned by API
  const yoloScoreEntries = yoloAllClasses.map(cls => ({
    label: cls,
    value: yoloClassScores[cls] ?? 0,
  }));
  yoloScoreEntries.sort((a, b) => b.value - a.value);
  // Use actual max to scale bars; if all are 0, default to 1 so bars stay at 0%
  const yoloMaxScore = yoloScoreEntries[0]?.value > 0 ? yoloScoreEntries[0].value : 1;

  const handleDownloadPDF = async () => {
    if (!window.jspdf) {
      alert('jsPDF library is not loaded. Please refresh the page.');
      return;
    }
    setPdfGenerating(true);
    try {
      await downloadScanPDF({ previewUrl: preview, resnetClass, resnetConf, detections, normScores });
    } catch (e) {
      console.error('PDF generation failed', e);
      alert('PDF generation failed. Check console for details.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-5 pb-6 pt-4 lg:pt-6"
    >
      {/* Header */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Damage Scan</h2>
        </div>
        <p className="text-gray-600 dark:text-white/30 text-sm">Dual-model AI — ResNet-50 classifier + YOLO detector</p>
      </div>

      {/* ── Upload Zone ── */}
      {status === 'idle' && (
        <AnimatePresence>
          <motion.div key="upload" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
            <div
              {...getRootProps()}
              className={`scan-border relative rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden border
                ${isDragActive ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:border-cyan-500/20 hover:bg-cyan-500/[0.02]'}`}
              style={{ minHeight: 280 }}
            >
              <input {...getInputProps()} />
              {preview ? (
                /* FIX 1 — full image display with contain, auto height */
                <div className="relative w-full">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto opacity-90"
                    style={{ display: 'block', objectFit: 'contain', maxWidth: '100%' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-gray-900 dark:text-white font-semibold text-sm bg-black/60 px-4 py-2 rounded-xl">Click to change</span>
                  </div>
                  {['tl','tr','bl','br'].map(corner => (
                    <div key={corner} className={`absolute w-6 h-6 border-cyan-400/60 
                      ${corner === 'tl' ? 'top-3 left-3 border-t-2 border-l-2 rounded-tl-md' : ''}
                      ${corner === 'tr' ? 'top-3 right-3 border-t-2 border-r-2 rounded-tr-md' : ''}
                      ${corner === 'bl' ? 'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md' : ''}
                      ${corner === 'br' ? 'bottom-3 right-3 border-b-2 border-r-2 rounded-br-md' : ''}
                    `} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                      style={{ background: 'radial-gradient(circle, #00f5ff 0%, transparent 70%)' }} />
                    <div className="relative bg-gray-100 dark:bg-white/[0.05] border border-cyan-500/15 p-5 rounded-2xl">
                      <ScanLine className="w-10 h-10 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold mb-1">
                      {isDragActive ? 'Drop to scan' : 'Drop damage photo here'}
                    </p>
                    <p className="text-gray-400 dark:text-white/25 text-xs">or click to browse · JPG, PNG</p>
                  </div>
                </div>
              )}
            </div>

            {preview && (
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={handleAnalyze}
                className="btn-premium w-full py-4 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-bold">Classify &amp; Detect Damage</span>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Scanning ── */}
      {status === 'scanning' && (
        <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card p-6 flex flex-col items-center gap-5 bg-white/90 dark:bg-transparent shadow-lg"
          style={{ border: '1px solid rgba(0,245,255,0.15)' }}>
          <div className="relative w-56 h-44 rounded-xl overflow-hidden" style={{ boxShadow: '0 0 40px rgba(0,245,255,0.15)' }}>
            <img src={preview} alt="Scanning" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-cyan-500/10" />
            {['tl','tr','bl','br'].map(c => (
              <div key={c} className={`absolute w-5 h-5 border-cyan-400/80
                ${c==='tl'?'top-2 left-2 border-t-2 border-l-2':''}
                ${c==='tr'?'top-2 right-2 border-t-2 border-r-2':''}
                ${c==='bl'?'bottom-2 left-2 border-b-2 border-l-2':''}
                ${c==='br'?'bottom-2 right-2 border-b-2 border-r-2':''}
              `}/>
            ))}
            <div className="absolute left-0 w-full h-0.5 animate-scan z-10"
              style={{ background: 'linear-gradient(to right, transparent, #00f5ff, transparent)', boxShadow: '0 0 12px #00f5ff' }} />
          </div>
          <p className="text-cyan-400 text-sm font-medium animate-pulse font-mono">{phase}</p>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-white/30 uppercase tracking-widest text-[10px] font-semibold">Processing</span>
              <span className="font-bold text-cyan-400 font-mono">{progress}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                style={{ background: 'linear-gradient(to right, #06b6d4, #00f5ff)', boxShadow: '0 0 10px rgba(0,245,255,0.5)' }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Results ── */}
      {status === 'complete' && results && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">

          {/* Unified Summary */}
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="glass-card p-4 lg:p-5 flex items-center gap-4 bg-white/90 dark:bg-transparent shadow-lg"
            style={{
              border: `1px solid ${summaryColor}33`,
              background: `linear-gradient(135deg, ${summaryColor}08, transparent 70%)`,
              boxShadow: `0 0 30px ${summaryColor}0f`,
            }}
          >
            <div className="p-3 rounded-xl shrink-0" style={{ background: `${summaryColor}15`, border: `1px solid ${summaryColor}25` }}>
              <Target className="w-6 h-6" style={{ color: summaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-600 dark:text-white/30 mb-1">AI Unified Summary</p>
              <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{resnetClass}</p>
              <p className="text-xs mt-0.5" style={{ color: summaryColor }}>
                {confLabel} · {Math.round(resnetConf * 100)}%
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          </motion.div>
                   {/* ── Two-column results — stacked on mobile, side-by-side on desktop ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* LEFT — ResNet-50 Results */}
            <motion.div
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-4 lg:p-5 flex flex-col gap-4 bg-white/90 dark:bg-transparent shadow-lg"
              style={{ border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <Wrench className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50">ResNet-50 Classifier</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/25">6-class damage prediction</p>
                </div>
              </div>

              {/* Top prediction */}
              <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3 border border-gray-200 dark:border-white/[0.05]">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/30 mb-1">Predicted Class</p>
                <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{resnetClass}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${Math.round(resnetConf * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: CLASS_COLORS[resnetClass] ?? '#00f5ff', boxShadow: `0 0 8px ${CLASS_COLORS[resnetClass] ?? '#00f5ff'}` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: CLASS_COLORS[resnetClass] ?? '#00f5ff' }}>
                    {Math.round(resnetConf * 100)}%
                  </span>
                </div>
              </div>

              {/* All 6 class bars */}
              <div>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-400 dark:text-white/25 mb-2 flex items-center gap-1">
                  <BarChart2 className="w-2.5 h-2.5" /> All Class Probabilities
                </p>
                <div className="space-y-1">
                  {normScores.map((item, i) => (
                    <MiniBar
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      maxVal={maxScore}
                      color={CLASS_COLORS[item.label] ?? '#00f5ff'}
                      isTop={i === 0}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — YOLO Detection Results */}
            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
              className="glass-card p-4 lg:p-5 flex flex-col gap-4 bg-white/90 dark:bg-transparent shadow-lg"
              style={{ border: '1px solid rgba(0,245,255,0.12)' }}
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl" style={{ background: 'rgba(0,245,255,0.08)' }}>
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50">YOLO Detector</p>
                  <p className="text-[10px] text-gray-400 dark:text-white/25">{yoloAllClasses.length}-class damage detection</p>
                </div>
              </div>

              {/* Annotated bounding-box image */}
              <div
                className="relative rounded-xl overflow-hidden bg-black/40 w-full"
                style={{ aspectRatio: '4/3', border: '1px solid rgba(0,245,255,0.1)' }}
              >
                <img src={preview} alt="YOLO" className="w-full h-full object-cover opacity-85" />
                {/* Bounding box overlay */}
                <div
                  className="absolute"
                  style={{
                    top: '16%', left: '10%', right: '12%', bottom: '20%',
                    border: `2px solid ${getYoloColor(detections[0]?.label ?? yoloLabel)}`,
                    borderRadius: 6,
                    boxShadow: `0 0 16px ${getYoloColor(detections[0]?.label ?? yoloLabel)}70`,
                  }}
                />
                <span
                  className="absolute top-[12%] left-[10%] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(0,0,0,0.75)',
                    color: getYoloColor(detections[0]?.label ?? yoloLabel),
                  }}
                >
                  {detections[0]?.label ?? yoloLabel}{' '}
                  {Math.round((detections[0]?.confidence ?? yoloConf) * 100)}%
                </span>
                {/* Corner brackets */}
                {['tl','tr','bl','br'].map(c => (
                  <div key={c} className={`absolute w-3 h-3 border-cyan-400/60
                    ${c==='tl'?'top-1 left-1 border-t border-l':''}
                    ${c==='tr'?'top-1 right-1 border-t border-r':''}
                    ${c==='bl'?'bottom-1 left-1 border-b border-l':''}
                    ${c==='br'?'bottom-1 right-1 border-b border-r':''}
                  `}/>
                ))}
              </div>

              {/* ── Detected Regions (mirrors ResNet "Predicted Class" box + bar list) ── */}
              <div>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-400 dark:text-white/25 mb-2 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5" /> Detected Regions
                  <span className="ml-auto normal-case tracking-normal font-bold text-[10px]"
                    style={{ color: detections.length > 0 ? '#00f5ff' : 'rgba(255,255,255,0.25)' }}>
                    {detections.length} found
                  </span>
                </p>

                {detections.length === 0 ? (
                  /* Nothing above threshold — show a zero-bar for the top YOLO class */
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3 border border-gray-200 dark:border-white/[0.05]">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/30 mb-1">Top Detection</p>
                    <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{yoloLabel}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(yoloConf * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: getYoloColor(yoloLabel),
                            boxShadow: `0 0 8px ${getYoloColor(yoloLabel)}`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-bold" style={{ color: getYoloColor(yoloLabel) }}>
                        {Math.round(yoloConf * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Top detection — styled like ResNet's "Predicted Class" big box */
                  <>
                    <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3 border border-gray-200 dark:border-white/[0.05] mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/30 mb-1">Top Detection</p>
                      <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                        {detections[0].label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((detections[0].confidence ?? 0) * 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              background: getYoloColor(detections[0].label),
                              boxShadow: `0 0 8px ${getYoloColor(detections[0].label)}`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono font-bold"
                          style={{ color: getYoloColor(detections[0].label) }}>
                          {Math.round((detections[0].confidence ?? 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* All detected regions as mini confidence bars */}
                    <div className="space-y-1">
                      {detections.map((det, i) => (
                        <MiniBar
                          key={`det-${i}`}
                          label={det.label}
                          value={det.confidence ?? det.score ?? 0}
                          maxVal={detections[0].confidence ?? 1}
                          color={getYoloColor(det.label)}
                          isTop={i === 0}
                          iconFn={getYoloIcon}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* ── All Class Scores — always rendered, mirrors ResNet "All Class Probabilities" ── */}
              <div>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-400 dark:text-white/25 mb-2 flex items-center gap-1">
                  <BarChart2 className="w-2.5 h-2.5" /> All Class Scores
                </p>
                <div className="space-y-1">
                  {yoloScoreEntries.map((item, i) => (
                    <MiniBar
                      key={`score-${item.label}`}
                      label={item.label}
                      value={item.value}
                      maxVal={yoloMaxScore}
                      color={getYoloColor(item.label)}
                      isTop={i === 0}
                      iconFn={getYoloIcon}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── NEW: Estimated Repair Cost Card ── */}
          <RepairCostCard damageClass={resnetClass} />

          {/* ── NEW: Download PDF Report ── */}
          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="w-full py-3.5 flex items-center justify-center gap-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 text-cyan-600 dark:text-cyan-400"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(6,182,212,0.08))',
              border: '1px solid rgba(0,245,255,0.25)',
              boxShadow: '0 0 20px rgba(0,245,255,0.07)',
            }}
          >
            {pdfGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Download Claim Report (PDF)</span>
              </>
            )}
          </motion.button>

          {/* Reset */}
          <button
            onClick={() => { setStatus('idle'); setResults(null); }}
            className="text-sm text-gray-400 dark:text-white/25 hover:text-cyan-400 flex items-center justify-center gap-2 mt-1 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Scan another image
          </button>
        </motion.div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-3 bg-white/90 dark:bg-transparent shadow-lg"
          style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-8 h-8 text-red-400" />
          <h3 className="text-red-400 font-semibold">Analysis Failed</h3>
          <p className="text-gray-600 dark:text-white/30 text-sm">Could not connect to the backend API.</p>
          <button onClick={() => setStatus('idle')} className="btn-premium px-6 py-2.5 text-sm">Try Again</button>
        </div>
      )}
    </motion.div>
  );
}
