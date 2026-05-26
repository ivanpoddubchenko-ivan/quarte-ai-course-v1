/**
 * Extracts structured course data from the AI Course HTML file.
 * Run: node extract-course.js
 * Output: frontend/src/data/course.json
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(
  require('os').homedir(),
  'Downloads/Telegram Desktop/AI Course.html'
);
const html = fs.readFileSync(htmlPath, 'utf8');

// Pull out the <script> block
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('No <script> block found');
const script = scriptMatch[1];

// Safe sandbox — expose only what we need
function extractVar(name, src) {
  // Find "var NAME = <value>;" and eval the value part
  const re = new RegExp(`var\\s+${name}\\s*=\\s*`);
  const start = src.search(re);
  if (start === -1) throw new Error(`Cannot find var ${name}`);
  const afterEq = src.indexOf('=', start) + 1;

  // Walk forward to find the balancing bracket/brace/paren
  let depth = 0;
  let inStr = false;
  let strChar = '';
  let i = afterEq;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === strChar) inStr = false;
    } else {
      if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c; }
      else if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    i++;
  }
  const raw = src.slice(afterEq, i).trim();
  // eslint-disable-next-line no-eval
  return eval(`(${raw})`);
}

const MN = extractVar('MN', script);
const MW = extractVar('MW', script);
const MC = extractVar('MC', script);
const MB = extractVar('MB', script);
const MT = extractVar('MT', script);
const LS = extractVar('LS', script);
const QUIZ = extractVar('QUIZ', script);
const SPACES = extractVar('SPACES', script);
const LSP = extractVar('LSP', script);

// Lectures that require file submission (flagged by 🔴 CHALLENGE or key deliverables)
const SUBMITTABLE_LECTURES = new Set([
  // M2 — UX/UI
  14, 15, 16,
  // M3 — Figma MCP
  20,
  // M5 — Vibe Coding (final build steps)
  31,
  // M6 — Final Project (all)
  32, 33, 34, 35, 36,
  // M7 — Animation
  40, 41,
  // M9 — Business Analysis (challenge markers)
  47, 49, 51, 53, 54, 55, 56, 57, 58, 59,
]);

const modules = MN.map((name, idx) => ({
  id: idx,
  name,
  week: MW[idx],
  color: MC[idx],
  bgColor: MB[idx],
  textColor: MT[idx],
  quiz: QUIZ[idx] || null,
}));

const lectures = LS.map((l) => ({
  id: l.n,
  moduleId: l.m,
  title: l.t,
  subtitle: l.s,
  space: LSP[l.n] || 'chat',
  submittable: SUBMITTABLE_LECTURES.has(l.n),
  content: {
    intro: l.intro || null,
    concepts: l.th || null,
    badGood: l.bvg || null,
    tips: l.tips || null,
    promptLibrary: l.lib || null,
    codeBlock: l.pr || null,
    task: l.tk || null,
  },
}));

const output = { modules, lectures, spaces: SPACES };

const outPath = path.join(__dirname, 'frontend/src/data/course.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`✓ Extracted ${modules.length} modules, ${lectures.length} lectures → ${outPath}`);
