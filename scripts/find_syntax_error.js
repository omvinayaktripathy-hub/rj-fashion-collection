const fs = require('fs');
const path = require('path');
const vm = require('vm');

function checkJsSyntax(code, filename) {
  try {
    new vm.Script(code, { filename });
    return null;
  } catch (err) {
    return err.stack;
  }
}

// 1. Check all files in public/js
const jsDir = path.resolve('public/js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
console.log('--- Checking JS files in public/js ---');
for (const f of jsFiles) {
  const p = path.join(jsDir, f);
  const code = fs.readFileSync(p, 'utf8');
  const err = checkJsSyntax(code, f);
  if (err) {
    console.error(`SYNTAX ERROR in ${f}:\n${err}\n`);
  }
}

// 2. Check all html files in public
console.log('--- Checking inline scripts in HTML files ---');
const htmlFiles = fs.readdirSync('public').filter(f => f.endsWith('.html'));
for (const h of htmlFiles) {
  const content = fs.readFileSync(path.join('public', h), 'utf8');
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIdx = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIdx++;
    const attrs = match[1];
    const scriptBody = match[2];
    if (attrs.includes('type="application/ld+json"') || attrs.includes('src=')) continue;
    if (!scriptBody.trim()) continue;
    
    const err = checkJsSyntax(scriptBody, `${h}-script-${scriptIdx}`);
    if (err) {
      console.error(`SYNTAX ERROR in ${h} (script #${scriptIdx}):\n${err}\n`);
    }
  }
}

console.log('Syntax check complete!');
