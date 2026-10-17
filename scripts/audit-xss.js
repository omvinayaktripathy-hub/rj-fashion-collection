const fs = require('fs');
const jsFiles = fs.readdirSync('public/js').filter(f => f.endsWith('.js'));

jsFiles.forEach(f => {
  const content = fs.readFileSync('public/js/' + f, 'utf8');
  // Check occurrences of escapeHtml or lack thereof
  const hasEscapeFn = content.includes('function escapeHtml') || content.includes('const escapeHtml');
  console.log(`[File: ${f}] Has escapeHtml helper: ${hasEscapeFn}`);

  // Look for ${r.comment}, ${user.name}, ${item.name}, etc.
  const dangerousVars = content.match(/\$\{(?:r|review|user|item|order|addr|p)\.(comment|user_name|name|address|street|city|state|notes)[^}]*\}/gi);
  if (dangerousVars) {
    console.log(`  Dangerous variables rendered:`, Array.from(new Set(dangerousVars)));
  }
});
