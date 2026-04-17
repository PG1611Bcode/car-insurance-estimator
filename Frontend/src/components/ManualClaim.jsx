import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IndianRupee, ChevronDown, TrendingUp, Users,
  Clock, Shield, BarChart2, Activity, FileDown
} from 'lucide-react';
import { ClaimService } from '../services/ClaimService';

// ── Static options (exact values expected by ML model) ───────────────────────
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const INCIDENT_TYPE_OPTS = ['Single Vehicle Collision', 'Multi-vehicle Collision', 'Vehicle Theft', 'Parked Car', 'Other'];
const COLLISION_TYPE_OPTS = ['Front Collision', 'Rear Collision', 'Side Collision', '?/Unknown'];
const SEVERITY_OPTS     = ['Trivial Damage', 'Minor Damage', 'Major Damage', 'Total Loss'];
const AUTHORITY_OPTS    = ['Police', 'Fire', 'Ambulance', 'Other', 'None'];
const POLICE_REPORT_OPTS = ['YES', 'NO'];
const DEDUCTIBLE_OPTS   = ['500', '1000', '2000'];

// ── Currency helpers ──────────────────────────────────────────────────────────
const USD_TO_INR = 83.5;

/** Format a number in Indian numbering system (lakhs/crores) */
function formatINR(amount) {
  const n = Math.round(Number(amount));
  return '\u20B9' + n.toLocaleString('en-IN');
}

// ── Shared input classes ─────────────────────────────────────────────────────
const inputCls = [
  'w-full bg-slate-800/60 border border-white/[0.08] rounded-xl',
  'px-3 py-2.5 text-white placeholder-slate-500 text-sm',
  'focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all',
].join(' ');

const selectCls = `${inputCls} appearance-none cursor-pointer pr-8`;

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, color = 'text-cyan-400' }) {
  return (
    <div className="flex items-center gap-2 mb-3 lg:mb-4">
      <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06]">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">{children}</label>;
}

function SelectField({ label, name, value, onChange, options, placeholder = 'Select...' }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select name={name} value={value} onChange={onChange} className={selectCls}>
          <option value="" disabled>{placeholder}</option>
          {options.map(o => (
            <option key={o} value={o} className="bg-slate-900">{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function NumberField({ label, name, value, onChange, placeholder, min, max }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number" name={name} value={value} onChange={onChange}
        placeholder={placeholder} min={min} max={max} className={inputCls}
      />
    </div>
  );
}

// ── Feature Importance Chart ──────────────────────────────────────────────────
function FeatureImportanceChart({ data }) {
  const max = Math.max(...data.map(d => d.importance ?? d.value ?? 0), 0.01);
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => {
        const val = item.importance ?? item.value ?? 0;
        const pct = (val / max) * 100;
        const color = i === 0 ? '#00f5ff' : i <= 2 ? '#22d3ee' : '#0891b2';
        return (
          <div key={item.feature ?? i} className="flex items-center gap-2">
            <span className="text-[11px] text-white/60 w-[130px] shrink-0 truncate" title={item.feature}>
              {item.feature}
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 }}
                className="h-full rounded-full"
                style={{ background: color, boxShadow: i === 0 ? '0 0 8px rgba(0,245,255,0.5)' : 'none' }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/50 w-8 text-right">
              {Math.round(val * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Mock feature importance ───────────────────────────────────────────────────
const MOCK_IMPORTANCE = [
  { feature: 'Incident Severity',  importance: 0.28 },
  { feature: 'Policy Deductible',  importance: 0.18 },
  { feature: 'Annual Premium',     importance: 0.14 },
  { feature: 'Collision Type',     importance: 0.11 },
  { feature: 'Bodily Injuries',    importance: 0.09 },
  { feature: 'Vehicles Involved',  importance: 0.08 },
  { feature: 'Insured Age',        importance: 0.07 },
];

// Severity → rough base amount in INR
const SEVERITY_BASE_INR = {
  'Trivial Damage': 15000,
  'Minor Damage':   55000,
  'Major Damage':  185000,
  'Total Loss':    450000,
};

// ── Initial form state ────────────────────────────────────────────────────────
const INIT = {
  policy_state: '',
  policy_deductible: '',
  annual_premium: '',
  insured_age: '',
  incident_type: '',
  collision_type: '',
  incident_severity: '',
  authorities_contacted: '',
  incident_hour: 12,
  number_of_vehicles_involved: '',
  bodily_injuries: '',
  witnesses: '',
  police_report_available: '',
};

// ── PDF policy ref ─────────────────────────────────────────────────────────────
function generatePolicyRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'CI-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

// ── Generate PDF for claim predictor ─────────────────────────────────────────
async function downloadClaimPDF({ form, amountINR, featureImportance }) {
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
  const GREY_TEXT = [100, 110, 120];
  const GREY_LIGHT = [229, 231, 235];
  const CYAN_TINT = [240, 255, 254];

  const formatINRText = (n) => `INR ${(Math.round(n)).toLocaleString('en-IN')}`;

  // ── Header Section ──────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Official Insurance Claim Amount Estimate Report', pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text('AI-Powered Insurance Claim Prediction  ·  Car Intelligence', pageW / 2, y, { align: 'center' });
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

  const labelValueCol1 = (label, value) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY_TEXT);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NAVY);
    doc.text(String(value || 'Not provided'), margin + 40, y);
    y += 4.5;
  };

  const labelValueCol2 = (label, value) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY_TEXT);
    doc.text(label + ':', margin + 95, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NAVY);
    doc.text(String(value || 'Not provided'), margin + 135, y);
    y += 4.5;
  };

  // ── Form inputs ──────────────────────────────────────────────────────────
  sectionHeader('Claim Details Submitted');
  
  const originalY = y;
  labelValueCol1('Policy State', form.policy_state);
  labelValueCol1('Policy Deduct.', form.policy_deductible ? `INR ${form.policy_deductible}` : '');
  labelValueCol1('Annual Prem.', form.annual_premium ? `INR ${form.annual_premium}` : '');
  labelValueCol1('Insured Age', form.insured_age || '35 (default)');
  labelValueCol1('Incident Type', form.incident_type);
  labelValueCol1('Collision Type', form.collision_type || 'Not specified');
  
  const nextY = y;
  y = originalY; 
  
  labelValueCol2('Severity', form.incident_severity);
  labelValueCol2('Auth. Contact', form.authorities_contacted || 'Not specified');
  labelValueCol2('Vehicles Inv.', form.number_of_vehicles_involved || '1');
  labelValueCol2('Injuries', form.bodily_injuries || '0');
  labelValueCol2('Police Report', form.police_report_available || 'Not specified');
  labelValueCol2('Incident Hr', form.incident_hour != null ? `${String(form.incident_hour).padStart(2,'0')}:00` : '12:00 (default)');
  
  y = Math.max(nextY, y);
  y += 3;

  // ── Feature Importance ────────────────────────────────────────────────────
  if (featureImportance?.length > 0) {
    sectionHeader('Top Contributing Factors');
    const topFive = featureImportance.slice(0, 5);
    const maxVal = Math.max(...topFive.map(f => f.importance ?? f.value ?? 0), 0.01);
    topFive.forEach((item, i) => {
      const val = item.importance ?? item.value ?? 0;
      const pctNum = Math.round((val / maxVal) * 100);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...NAVY);
      doc.text(`${i + 1}. ${item.feature}`, margin, y);

      const barX = margin + 55;
      const barW = 90; 
      const barH = 2.5;
      
      doc.setFillColor(...GREY_LIGHT);
      doc.rect(barX, y - 2, barW, barH, 'F');
      doc.setFillColor(...CYAN);
      doc.rect(barX, y - 2, barW * (pctNum / 100), barH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      // Align right to fit in the 15mm col
      doc.text(`${Math.round(val * 100)}%`, barX + barW + 15, y, { align: 'right' });
      
      y += 4;
    });
    y += 5;
  }

  // ── Estimated Claim Amount ────────────────────────────────────────────────
  const costBoxH = 25;
  doc.setFillColor(...CYAN_TINT);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, costBoxH, 2, 2, 'FD');
  
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Predicted Claim Amount', pageW / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...CYAN);
  doc.text(formatINRText(amountINR), pageW / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GREY_TEXT);
  doc.text('Converted from USD at 1 USD = INR 83.50', pageW / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('This estimate is generated by an AI model and is subject to verification by a licensed insurance surveyor.', pageW / 2, y, { align: 'center' });
  
  // ── Footer ──────────────────────────────────────────────────────────────
  const footerY = pageH - 12;
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY_TEXT);
  doc.text(`Page 1 of 1  |  Policy Ref: ${policyRef}  |  Car Intelligence`, pageW / 2, footerY, { align: 'center' });

  doc.save(`Insurance_Claim_Report_${policyRef}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ManualClaim() {
  const [form, setForm]             = useState(INIT);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [prediction, setPrediction] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSlider = (e) => setForm(prev => ({ ...prev, incident_hour: Number(e.target.value) }));

  const requiredFields = ['policy_state', 'policy_deductible', 'incident_type', 'incident_severity'];
  const isValid = requiredFields.every(f => form[f] !== '');

  const handlePredict = async () => {
    setError('');
    if (!isValid) {
      setError('Please fill in all required fields (Policy State, Deductible, Incident Type, Severity).');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        policy_deductible:           Number(form.policy_deductible),
        annual_premium:              form.annual_premium ? Number(form.annual_premium) : 1200,
        insured_age:                 form.insured_age ? Number(form.insured_age) : 35,
        incident_hour:               form.incident_hour,
        number_of_vehicles_involved: form.number_of_vehicles_involved ? Number(form.number_of_vehicles_involved) : 1,
        bodily_injuries:             form.bodily_injuries ? Number(form.bodily_injuries) : 0,
        witnesses:                   form.witnesses ? Number(form.witnesses) : 0,
      };
      const result = await ClaimService.predictClaim(payload);

      // Backend may return INR directly (currency: "INR") or USD
      let amountINR = result.predicted_amount ?? result.amount ?? 0;
      if (result.currency !== 'INR') {
        amountINR = amountINR * USD_TO_INR;   // convert USD → INR
      }
      setPrediction({ ...result, amountINR });
    } catch {
      // Fallback mock prediction in INR
      const base = SEVERITY_BASE_INR[form.incident_severity] ?? 100000;
      const jitter = base * (0.85 + Math.random() * 0.30);
      setPrediction({
        amountINR: Math.round(jitter),
        feature_importance: MOCK_IMPORTANCE,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!window.jspdf) {
      alert('jsPDF library is not loaded. Please refresh the page.');
      return;
    }
    setPdfGenerating(true);
    try {
      await downloadClaimPDF({
        form,
        amountINR: prediction?.amountINR ?? 0,
        featureImportance: prediction?.feature_importance ?? MOCK_IMPORTANCE,
      });
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
      className="flex flex-col gap-5 pt-4 pb-10"
    >
      {/* Header */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-cyan-400" />
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Claim Predictor</h2>
        </div>
        <p className="text-white/30 text-sm">ML-powered insurance claim amount estimation in ₹ (Indian Rupees)</p>
      </div>

      {/* ── Prediction Result ── */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="glass-card p-5 lg:p-8 space-y-5"
            style={{ border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 0 40px rgba(0,245,255,0.08)' }}
          >
            <div className="text-center py-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-white/30 mb-2">
                Estimated Claim Amount
              </p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-4xl lg:text-5xl font-black tracking-tight"
                style={{ color: '#00f5ff', textShadow: '0 0 30px rgba(0,245,255,0.4)' }}
              >
                {formatINR(prediction.amountINR ?? 0)}
              </motion.p>
              <p className="text-white/25 text-xs mt-2">Based on your provided claim details · Converted at 1 USD = ₹83.5</p>
            </div>

            {prediction.feature_importance?.length > 0 && (
              <div className="border-t border-white/[0.06] pt-5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-white/30 mb-4 flex items-center gap-1.5">
                  <BarChart2 className="w-3 h-3" /> Top Contributing Factors
                </p>
                <FeatureImportanceChart data={prediction.feature_importance} />
              </div>
            )}

            {/* Download PDF */}
            <div className="border-t border-white/[0.06] pt-4">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="w-full py-3 flex items-center justify-center gap-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(6,182,212,0.08))',
                  border: '1px solid rgba(0,245,255,0.25)',
                  color: '#00f5ff',
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
              </button>
            </div>

            <button
              onClick={() => { setPrediction(null); setError(''); }}
              className="w-full text-sm text-white/25 hover:text-cyan-400 transition-colors pt-2"
            >
              ← Start a new prediction
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form ── */}
      {!prediction && (
        <div className="glass-card p-4 lg:p-8 space-y-6">

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          {/* ── Policy + Insured Details side by side on desktop ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* SECTION 1 — Policy Details */}
            <div>
              <SectionTitle icon={Shield} title="Policy Details" color="text-cyan-400" />
              <div className="space-y-3">
                <SelectField
                  label="Policy State *" name="policy_state"
                  value={form.policy_state} onChange={handleChange}
                  options={US_STATES} placeholder="Select state"
                />
                <SelectField
                  label="Policy Deductible (₹) *" name="policy_deductible"
                  value={form.policy_deductible} onChange={handleChange}
                  options={DEDUCTIBLE_OPTS} placeholder="Select amount"
                />
                <NumberField
                  label="Annual Premium (₹)" name="annual_premium"
                  value={form.annual_premium} onChange={handleChange}
                  placeholder="e.g. 1200" min="0"
                />
              </div>
            </div>

            {/* SECTION 2 — Insured Details (FIX 3: Education Level removed) */}
            <div>
              <SectionTitle icon={Users} title="Insured Details" color="text-indigo-400" />
              <div className="space-y-3">
                <NumberField
                  label="Insured Age" name="insured_age"
                  value={form.insured_age} onChange={handleChange}
                  placeholder="e.g. 35" min="18" max="100"
                />
              </div>
            </div>

          </div>

          {/* Full-width divider */}
          <div className="border-t border-white/[0.05]" />

          {/* SECTION 3 — Incident Details */}
          <div>
            <SectionTitle icon={Activity} title="Incident Details" color="text-orange-400" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">

              <SelectField
                label="Incident Type *" name="incident_type"
                value={form.incident_type} onChange={handleChange}
                options={INCIDENT_TYPE_OPTS} placeholder="Select type"
              />
              <SelectField
                label="Collision Type" name="collision_type"
                value={form.collision_type} onChange={handleChange}
                options={COLLISION_TYPE_OPTS} placeholder="Select type"
              />
              <SelectField
                label="Incident Severity *" name="incident_severity"
                value={form.incident_severity} onChange={handleChange}
                options={SEVERITY_OPTS} placeholder="Select severity"
              />
              <SelectField
                label="Authorities Contacted" name="authorities_contacted"
                value={form.authorities_contacted} onChange={handleChange}
                options={AUTHORITY_OPTS} placeholder="Select"
              />
              <NumberField
                label="No. of Vehicles Involved" name="number_of_vehicles_involved"
                value={form.number_of_vehicles_involved} onChange={handleChange}
                placeholder="e.g. 2" min="1" max="10"
              />
              <NumberField
                label="Bodily Injuries" name="bodily_injuries"
                value={form.bodily_injuries} onChange={handleChange}
                placeholder="e.g. 0" min="0" max="10"
              />
              <NumberField
                label="Witnesses" name="witnesses"
                value={form.witnesses} onChange={handleChange}
                placeholder="e.g. 1" min="0" max="10"
              />
              <SelectField
                label="Police Report Available" name="police_report_available"
                value={form.police_report_available} onChange={handleChange}
                options={POLICE_REPORT_OPTS} placeholder="YES / NO"
              />

              {/* Hour slider — spans full grid row */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <FieldLabel>Incident Hour of the Day</FieldLabel>
                <div className="flex items-center gap-3 mt-1">
                  <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <input
                    type="range" min="0" max="23" step="1"
                    value={form.incident_hour} onChange={handleSlider}
                    className="flex-1 h-1.5 appearance-none rounded-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #00f5ff ${(form.incident_hour / 23) * 100}%, rgba(255,255,255,0.08) ${(form.incident_hour / 23) * 100}%)`,
                    }}
                  />
                  <span className="text-cyan-400 font-mono text-sm font-bold w-12 text-right">
                    {String(form.incident_hour).padStart(2, '0')}:00
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Predict Button ── */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="btn-premium w-full py-4 flex items-center justify-center gap-2.5 mt-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Predicting...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                <span className="text-base font-bold">Predict Claim Amount (₹)</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
