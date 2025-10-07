// Simple script to group coverage by top-level folders under src
// Reads coverage/smartspace/coverage-summary.json and prints a grouped table
const fs = require('fs');
const path = require('path');

function pct(n) { return (Math.round((n || 0) * 100) / 100).toFixed(2); }

const summaryPath = path.join(__dirname, '..', 'coverage', 'smartspace', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error('coverage-summary.json not found. Run tests with coverage first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const files = data?.files || {};

const groups = {}; // key: src/<folder>
for (const filePath of Object.keys(files)) {
  const rel = filePath.replace(/\\/g, '/');
  const m = rel.match(/^.*?src\/([^/]+)\//);
  const key = m ? `src/${m[1]}` : 'src';
  const f = files[filePath];
  groups[key] = groups[key] || { lines: { total:0, covered:0 }, statements:{ total:0, covered:0 }, functions:{ total:0, covered:0 }, branches:{ total:0, covered:0 } };
  for (const k of ['lines','statements','functions','branches']) {
    groups[key][k].total += f[k].total;
    groups[key][k].covered += f[k].covered;
  }
}

const rows = Object.entries(groups)
  .sort((a,b) => a[0].localeCompare(b[0]))
  .map(([k, g]) => {
    const l = (g.lines.covered / Math.max(1, g.lines.total)) * 100;
    const s = (g.statements.covered / Math.max(1, g.statements.total)) * 100;
    const f = (g.functions.covered / Math.max(1, g.functions.total)) * 100;
    const b = (g.branches.covered / Math.max(1, g.branches.total)) * 100;
    return { folder: k, lines: pct(l), statements: pct(s), functions: pct(f), branches: pct(b) };
  });

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('Folder', 24), pad('Lines %', 10), pad('Stmts %', 10), pad('Funcs %', 10), pad('Branch %', 10));
for (const r of rows) {
  console.log(pad(r.folder, 24), pad(r.lines, 10), pad(r.statements, 10), pad(r.functions, 10), pad(r.branches, 10));
}


