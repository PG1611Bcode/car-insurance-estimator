const fs = require('fs');
const path = require('path');

const aiFile = path.resolve(__dirname, 'Frontend/src/components/AiAnalysis.jsx');
let aiContent = fs.readFileSync(aiFile, 'utf8');

const scanPDFStart = aiContent.indexOf('async function downloadScanPDF');
const scanPDFEnd = aiContent.indexOf('// ── Main Component', scanPDFStart);

const newScanPDF = `async function downloadScanPDF({ previewUrl, resnetClass, resnetConf, detections, normScores }) {
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

  const formatINRText = (n) => \`INR \${(Math.round(n)).toLocaleString('en-IN')}\`;

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
  doc.text(\`Policy Ref: \${policyRef}   |   Generated: \${dateStr}\`, pageW / 2, y, { align: 'center' });
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
  doc.text(\`\${Math.round(resnetConf * 100)}%\`, confX + cWidth, y);
  
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
    doc.text(\`\${pctNum}%\`, barX + barW + 15, y, { align: 'right' });
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
      doc.text(\`\${i + 1}. \${det.label ?? \`Region \${i + 1}\`}\`, margin, y);

      const barX = margin + 55;
      const barW = 90; 
      const barH = 2.5;
      
      doc.setFillColor(...GREY_LIGHT);
      doc.rect(barX, y - 2, barW, barH, 'F');
      doc.setFillColor(...AMBER);
      doc.rect(barX, y - 2, barW * (pctNum / 100), barH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(\`\${pctNum}%\`, barX + barW + 15, y, { align: 'right' });
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
  const costStr = isNoDamage ? 'INR 0' : \`\${formatINRText(priceInfo.min)} – \${formatINRText(priceInfo.max)}\`;
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
  doc.text(\`Page 1 of 1  |  Policy Ref: \${policyRef}  |  Car Intelligence\`, pageW / 2, footerY, { align: 'center' });

  doc.save(\`Damage_Claim_Report_\${policyRef}.pdf\`);
}

`;
aiContent = aiContent.substring(0, scanPDFStart) + newScanPDF + aiContent.substring(scanPDFEnd);
fs.writeFileSync(aiFile, aiContent, 'utf8');
console.log('AiAnalysis PDF patched');

// ── ManualClaim ───────────────────────────────────────────────────────────

const mcFile = path.resolve(__dirname, 'Frontend/src/components/ManualClaim.jsx');
let mcContent = fs.readFileSync(mcFile, 'utf8');

const claimPDFStart = mcContent.indexOf('async function downloadClaimPDF');
const claimPDFEnd = mcContent.indexOf('// ── Main Component', claimPDFStart);

const newClaimPDF = `async function downloadClaimPDF({ form, amountINR, featureImportance }) {
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

  const formatINRText = (n) => \`INR \${(Math.round(n)).toLocaleString('en-IN')}\`;

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
  doc.text(\`Policy Ref: \${policyRef}   |   Generated: \${dateStr}\`, pageW / 2, y, { align: 'center' });
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
  labelValueCol1('Policy Deduct.', form.policy_deductible ? \`INR \${form.policy_deductible}\` : '');
  labelValueCol1('Annual Prem.', form.annual_premium ? \`INR \${form.annual_premium}\` : '');
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
  labelValueCol2('Incident Hr', form.incident_hour != null ? \`\${String(form.incident_hour).padStart(2,'0')}:00\` : '12:00 (default)');
  
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
      doc.text(\`\${i + 1}. \${item.feature}\`, margin, y);

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
      doc.text(\`\${Math.round(val * 100)}%\`, barX + barW + 15, y, { align: 'right' });
      
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
  doc.text(\`Page 1 of 1  |  Policy Ref: \${policyRef}  |  Car Intelligence\`, pageW / 2, footerY, { align: 'center' });

  doc.save(\`Insurance_Claim_Report_\${policyRef}.pdf\`);
}

`;

mcContent = mcContent.substring(0, claimPDFStart) + newClaimPDF + mcContent.substring(claimPDFEnd);
fs.writeFileSync(mcFile, mcContent, 'utf8');
console.log('ManualClaim PDF patched');
