// Comprueba las reglas de componentes de la skill clean-code (§2.1 y §2.2) en todos los .tsx y .astro de src/.
// Uso: pnpm audit:components   (sale con código 1 si hay hallazgos)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const MAX_LINES = 150;
const STATE_HOOKS = /\b(useState|useReducer|useEffect|useLayoutEffect|useMemo|useCallback)\b/g;
const DATA_METHODS = /\.(filter|reduce|sort|find|findIndex|some|every)\(/g;
const VALUE_COMPARISON = /[!=]==?\s*['"][^'"]*['"]|['"][^'"]*['"]\s*[!=]==?/g;
const TYPE_DECLARATION = /^\s*(export\s+)?(declare\s+)?(interface|type)\s+\w+\s*[=<{]/gm;
const INLINE_PROP_TYPE = /\}:\s*(Readonly<)?\{|Readonly<\{/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|astro)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const matches = (text, re) => text.match(re) ?? [];

/** Quita comentarios y textos de plantilla para no contar lo que no es código. */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '');

function componentNames(code) {
  const re = /^(?:export\s+)?(?:default\s+)?(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*=\s*(?:React\.)?(?:forwardRef|memo)\b)/gm;
  return [...code.matchAll(re)].map((m) => m[1] ?? m[2]);
}

function helperNames(code) {
  const re = /^(?:export\s+)?(?:async\s+)?function\s+([a-z]\w*)|^(?:export\s+)?const\s+([a-z]\w*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>/gm;
  return [...code.matchAll(re)].map((m) => m[1] ?? m[2]);
}

function auditTsx(rel, code, findings) {
  const isUiKit = /^src\/shared\/ui\/[^/]+\/index\.tsx$/.test(rel);
  const components = componentNames(code);
  if (components.length > 1 && !isUiKit) findings.push(`${components.length} componentes en un archivo (${components.join(', ')})`);
  const helpers = helperNames(code);
  if (helpers.length) findings.push(`funciones o hooks declarados en el componente: ${helpers.join(', ')}`);
  const hooks = matches(code, STATE_HOOKS);
  if (hooks.length) findings.push(`estado/efectos en el componente: ${[...new Set(hooks)].join(', ')}`);
  if (/\bfetch\(|\bapi\(|\bapi\.\w+\(/.test(code)) findings.push('llamadas a la API en el componente');
  const data = matches(code, DATA_METHODS);
  if (data.length) findings.push(`operaciones de datos en el componente: ${[...new Set(data)].join(' ')}`);
}

function auditAstro(code, findings) {
  const frontmatter = code.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const logic = frontmatter
    .split('\n')
    .filter((line) => line.trim() && !/^\s*import\b/.test(line))
    .join('\n');
  const signals = [
    ...matches(logic, /\.(map|filter|reduce|find|some|every|sort|flatMap)\(/g),
    ...matches(logic, /\s\?\s|\s\?\?\s/g),
    ...matches(logic, /&&|\|\|/g),
    ...matches(logic, /\b(if|for|switch|while)\s*\(/g),
    ...matches(logic, /\bfunction\b|=>/g),
  ];
  if (signals.length) findings.push(`lógica en el frontmatter (${signals.length}): ${[...new Set(signals.map((s) => s.trim()))].join(' ')}`);
  const body = code.slice(frontmatter.length);
  const data = matches(body, DATA_METHODS);
  if (data.length) findings.push(`operaciones de datos en el marcado: ${[...new Set(data)].join(' ')}`);
}

const files = walk(SRC);
const report = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  const code = stripComments(raw);
  const findings = [];

  const lines = raw.split('\n').length;
  if (lines > MAX_LINES) findings.push(`${lines} líneas (máximo ${MAX_LINES})`);
  if (matches(code, TYPE_DECLARATION).length || matches(code, INLINE_PROP_TYPE).length) findings.push('declara tipos (van en .types.ts)');
  const comparisons = matches(code, VALUE_COMPARISON);
  if (comparisons.length) findings.push(`decisiones con valores concretos (${comparisons.length}): ${[...new Set(comparisons)].slice(0, 4).join('  ')}`);

  if (file.endsWith('.tsx')) auditTsx(rel, code, findings);
  else auditAstro(code, findings);

  if (findings.length) report.push({ rel, findings });
}

if (!report.length) {
  console.log(`audit:components ✓ ${files.length} componentes, 0 hallazgos`);
  process.exit(0);
}
for (const { rel, findings } of report) {
  console.log(`\n${rel}`);
  for (const f of findings) console.log(`  - ${f}`);
}
console.log(`\naudit:components ✗ ${report.length} de ${files.length} componentes con hallazgos (reglas: .claude/skills/clean-code §2.2)`);
process.exit(1);
