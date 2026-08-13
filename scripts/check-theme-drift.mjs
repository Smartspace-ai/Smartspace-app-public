// Guards the one deliberate duplication in the theme system: the app's palette
// (`src/_theme.scss`) and the fallback palette the package ships
// (`packages/chat-ui/src/styles.css`, inside `@layer chat-ui-defaults`) are
// hand-synced copies. The layer makes disagreement harmless for white-label
// forks (their tokens always win), but inside this repo the two should say the
// same thing — this script fails when they drift.
//
// Usage: node scripts/check-theme-drift.mjs   (exit 1 on drift)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Tokens the app derives with SCSS from `$primary-hex` — the package mirrors
// them as literals, so values can't be string-compared; presence still can.
const COMPUTED = (value) => value.includes('#{');

// App-only tokens with no meaning inside the package build. Nothing under
// packages/chat-ui references any of these (verified by grep when added).
const APP_ONLY = new Set([
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--shadow-sm-brand',
  '--shadow-md-brand',
  '--shadow-lg-brand',
]);

/** Pull `--token: value;` pairs out of the first balanced block after `marker`. */
function block(css, marker) {
  const start = css.indexOf(marker);
  if (start === -1) return null;
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  return css.slice(open + 1, end);
}

function tokens(blockText) {
  const map = new Map();
  for (const m of blockText.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    // Collapse whitespace: multi-line values indent differently in scss vs css.
    map.set(m[1], m[2].replace(/\s+/g, ' ').trim());
  }
  return map;
}

const appScss = readFileSync(join(root, 'src/_theme.scss'), 'utf8');
const pkgCss = readFileSync(
  join(root, 'packages/chat-ui/src/styles.css'),
  'utf8'
);

// App: `:root` and `.dark` inside `@layer base`. Package: the same two blocks
// inside `@layer chat-ui-defaults`.
const pkgLayer = block(pkgCss, '@layer chat-ui-defaults');
if (!pkgLayer) {
  console.error(
    'check-theme-drift: no `@layer chat-ui-defaults` in the package stylesheet'
  );
  process.exit(1);
}

const sides = {
  light: { app: tokens(block(appScss, ':root')), pkg: tokens(block(pkgLayer, ':root')) },
  dark: { app: tokens(block(appScss, '.dark')), pkg: tokens(block(pkgLayer, '.dark')) },
};

let failed = false;
const report = (msg) => {
  failed = true;
  console.error(`  ${msg}`);
};

for (const [mode, { app, pkg }] of Object.entries(sides)) {
  console.error(`${mode}:`);
  for (const [name, value] of app) {
    if (APP_ONLY.has(name)) continue;
    if (!pkg.has(name)) {
      report(`${name} is in the app palette but missing from the package`);
    } else if (!COMPUTED(value) && pkg.get(name) !== value) {
      report(`${name} differs — app: ${value} | package: ${pkg.get(name)}`);
    }
  }
  for (const name of pkg.keys()) {
    if (!app.has(name)) {
      report(`${name} is in the package palette but missing from the app`);
    }
  }
}

if (failed) {
  console.error(
    '\nTheme palettes have drifted. Update src/_theme.scss and ' +
      'packages/chat-ui/src/styles.css together (or add an intentional ' +
      'app-only token to APP_ONLY in scripts/check-theme-drift.mjs).'
  );
  process.exit(1);
}
console.error('theme palettes in sync');
