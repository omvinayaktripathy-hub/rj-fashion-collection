const fs = require('fs');

const path = 'public/index.html';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('/firebase-config.js?v=20261025-01', '/firebase-config.js?v=20261107-console-fix');
content = content.replace('/js/app.js?v=20261025-01', '/js/app.js?v=20261107-console-fix');

fs.writeFileSync(path, content, 'utf8');
console.log('Cache busters updated in public/index.html!');
