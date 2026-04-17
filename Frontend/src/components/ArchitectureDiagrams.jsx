import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, MonitorPlay } from 'lucide-react';

const DIAGRAMS = [
  {
    id: 'sys-arch',
    title: '1. System Architecture',
    code: `flowchart TD
    UI["Frontend Application - React/Vite"]
    API["Backend API Server - FastAPI"]
    ResNet["ResNet-50 PyTorch Engine"]
    YOLO["YOLOv8 Ultralytics Engine"]
    ClaimML["XGBoost Predictor Engine"]
    PDF["jsPDF Report Generator"]
    Maps["OpenStreetMap API"]
    DB[("Firebase Auth Service")]
    Models[("Model Artifacts: .pth .pt .pkl")]
    
    UI <--> API
    UI <--> DB
    UI <--> Maps
    API --> ResNet
    API --> YOLO
    API --> ClaimML
    ResNet -.-> Models
    YOLO -.-> Models
    ClaimML -.-> Models
    UI --> PDF`
  },
  {
    id: 'use-case',
    title: '2. Use Case Diagram',
    code: `flowchart LR
    Guest("Guest User")
    AuthUser("Authenticated Car Owner")
    System("AI Inference System")
    
    Guest --- ViewHome((View Landing Page))
    Guest --- Sign((Sign In / Register))
    AuthUser --- ViewHome
    AuthUser --- ScanDamage((Upload Damage Image))
    AuthUser --- PredictClaim((Fill Claim Form))
    AuthUser --- PDF((Download Report))
    AuthUser --- Garage((Find Nearby Garages))
    
    ScanDamage --- System
    PredictClaim --- System`
  },
  {
    id: 'dfd-0',
    title: '3. Data Flow Diagram Level 0',
    code: `flowchart LR
    User["Web User"]
    System(("Car Insurance Automation System"))
    Firebase["Firebase Auth API"]
    Maps["OpenStreetMap API"]
    
    User --"Auth / Image / Details"--> System
    System --"Predictions / PDFs"--> User
    System <-->|"Auth Tokens"| Firebase
    System <-->|"Map Tiles"| Maps`
  },
  {
    id: 'dfd-1',
    title: '4. Data Flow Diagram Level 1',
    code: `flowchart TD
    User["Web User"]
    Auth(("1.0 Authentication"))
    Scan(("2.0 Damage Image Scan"))
    Claim(("3.0 Cost Prediction"))
    Garage(("4.0 Garage Locator"))
    Report(("5.0 PDF Export"))
    D1[("ML Models Store")]
    
    User --> Auth
    User --> Scan
    User --> Claim
    User --> Garage
    User --> Report
    Scan <--> D1
    Claim <--> D1
    Scan --> Report
    Claim --> Report`
  },
  {
    id: 'dfd-2',
    title: '5. Data Flow Diagram Level 2 (Damage Scan)',
    code: `flowchart LR
    P1(("2.1 Parse Upload"))
    P2(("2.2 ResNet-50 Flow"))
    P3(("2.3 YOLO Flow"))
    P4(("2.4 Severity Mapping"))
    P5(("2.5 Cost Estimation"))
    P6(("2.6 Format JSON"))
    
    P1 --> P2
    P1 --> P3
    P2 --> P4
    P4 --> P5
    P5 --> P6
    P3 --> P6`
  }
];

export default function ArchitectureDiagrams() {
  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: true, theme: 'dark' });
      window.mermaid.contentLoaded();
    }
  }, []);

  const handleDownload = async (diagramId) => {
    if (!window.html2canvas) {
      alert("html2canvas not loaded. Please wait.");
      return;
    }
    const element = document.getElementById(diagramId);
    if (!element) return;
    try {
      const canvas = await window.html2canvas(element, { backgroundColor: '#0e1322' });
      const link = document.createElement('a');
      link.download = `${diagramId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to capture diagram', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-6 pt-4 lg:pt-6 pb-12"
    >
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <MonitorPlay className="text-cyan-400 w-7 h-7" />
          Architecture Diagrams
        </h2>
        <p className="text-white/40">Visual representation of system architecture and data flows.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {DIAGRAMS.map((doc) => (
          <div key={doc.id} className="glass-card p-6 flex flex-col gap-4 border border-white/10" style={{ background: 'var(--surface-color, rgba(255,255,255,0.03))' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-cyan-400">{doc.title}</h3>
              <button 
                onClick={() => handleDownload(doc.id)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
            </div>
            
            <div id={doc.id} className="p-4 bg-slate-900/50 rounded-xl overflow-x-auto min-h-[200px] flex items-center justify-center border border-white/[0.05]">
              <div className="mermaid text-center">
                {doc.code}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
