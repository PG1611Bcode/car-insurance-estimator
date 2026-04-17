const fs = require('fs');
const path = require('path');

const aiFile = path.resolve(__dirname, 'Frontend/src/components/AiAnalysis.jsx');
let content = fs.readFileSync(aiFile, 'utf8');

// 1. Remove the Garage Locator section if it exists
const garageStart = content.indexOf('{/* ── GARAGE LOCATOR ── */}');
if (garageStart !== -1) {
  const garageEnd = content.indexOf('{/* ── Two-column results', garageStart);
  if (garageEnd !== -1) {
    content = content.substring(0, garageStart) + content.substring(garageEnd);
  }
}

// 2. Fix potential syntax errors from previous runs (dangling braces or fragments)
content = content.replace(/^[\s\S]*?import React/m, 'import React');

// 3. Light Mode CSS Fixes (Targeted)

// Text transformations
content = content.replace(/text-white(?![\/\-])/g, 'text-gray-900 dark:text-white');
content = content.replace(/text-white\/30/g, 'text-gray-600 dark:text-white/30');
content = content.replace(/text-white\/50/g, 'text-gray-500 dark:text-white/50');
content = content.replace(/text-white\/25/g, 'text-gray-400 dark:text-white/25');
content = content.replace(/text-white\/20/g, 'text-gray-400 dark:text-white/20');

// Background/Border transformations
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-gray-50 dark:bg-white/[0.03]');
content = content.replace(/border-white\/\[0\.05\]/g, 'border-gray-200 dark:border-white/[0.05]');
content = content.replace(/border-white\/\[0\.06\]/g, 'border-gray-200 dark:border-white/[0.06]');
content = content.replace(/bg-white\/\[0\.05\]/g, 'bg-gray-100 dark:bg-white/[0.05]');
content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-gray-50 dark:bg-white/[0.02]');

// Glass card light mode override (adding a shadow and base bg)
content = content.replace(/className="glass-card(.*?)"/g, 'className="glass-card$1 bg-white/90 dark:bg-transparent shadow-lg"');

// Fix specific icons/colors that might be too bright in light mode
content = content.replace(/color: '#00f5ff'/g, "color: theme === 'light' ? '#0891b2' : '#00f5ff'");

// Ensure we don't have duplicate imports from previous faulty runs
content = content.replace(/import \{ useLocation \} from 'react-router-dom';\n/g, '');

fs.writeFileSync(aiFile, content, 'utf8');
console.log('AiAnalysis.jsx final patch complete.');
