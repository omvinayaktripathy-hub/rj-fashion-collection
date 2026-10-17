const fs = require('fs');

['routes', 'services', 'database'].forEach(d => {
  fs.readdirSync(d).forEach(f => {
    const content = fs.readFileSync(d + '/' + f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
      if (/console\.(log|error|warn|info)\(.*(body|req|password|token|secret|key|card|headers)/i.test(l)) {
        console.log(`[LOGGING WARNING] ${d}/${f}:${i+1} -> ${l.trim()}`);
      }
    });
  });
});
