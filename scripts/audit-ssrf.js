const fs = require('fs');
['routes', 'services'].forEach(d => {
  fs.readdirSync(d).forEach(f => {
    const content = fs.readFileSync(d + '/' + f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (/fetch\(|http\.request|https\.request|axios|needle|got\(/i.test(l)) {
        console.log(`[${d}/${f}:${i+1}] ${l.trim()}`);
      }
    });
  });
});
