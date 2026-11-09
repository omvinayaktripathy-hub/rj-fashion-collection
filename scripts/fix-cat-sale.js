const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 1. categories.html
const catPath = path.join(root, 'public', 'categories.html');
let catHtml = fs.readFileSync(catPath, 'utf8').replace(/\r\n/g, '\n');

const catTarget = `      try {
        const res = await fetch(\`\${API_BASE}/categories\`);
        const data = await res.json();
        if (data.success && data.categories) {
          container.innerHTML = data.categories.map(c => \``;

const catReplacement = `      try {
        let categories = [];
        try {
          const res = await fetch('/data/categories.json');
          if (res.ok) {
            const data = await res.json();
            categories = Array.isArray(data) ? data : (data.categories || []);
          }
        } catch (_) {}

        if (categories.length > 0) {
          container.innerHTML = categories.map(c => \``;

if (catHtml.includes(catTarget)) {
  catHtml = catHtml.replace(catTarget, catReplacement);
  fs.writeFileSync(catPath, catHtml, 'utf8');
  console.log('categories.html updated successfully!');
} else {
  console.error('catTarget not found in categories.html');
}

// 2. sale.html
const salePath = path.join(root, 'public', 'sale.html');
let saleHtml = fs.readFileSync(salePath, 'utf8').replace(/\r\n/g, '\n');

const saleTarget = `        // Build query params
        let url = \`\${API_BASE}/products?offer=true&sort=discount&limit=50\`;
        if (minDiscount > 0) {
          url += \`&minDiscount=\${minDiscount}\`;
        }

        const res  = await fetch(url);
        const data = await res.json();

        spinner.style.display = 'none';

        if (!data.success || !data.products || data.products.length === 0) {
          empty.style.display = 'block';
          counter.innerHTML   = 'Showing <strong>0</strong> deals';
          return;
        }

        // Client-side discount range filtering for tab "40-50%" and "50-60%"
        let products = data.products;`;

const saleReplacement = `        let products = [];
        try {
          const res = await fetch('/data/products.json');
          if (res.ok) {
            const data = await res.json();
            const all = Array.isArray(data) ? data : (data.products || []);
            products = all.filter(p => (p.discount && p.discount > 0) || (p.original_price && p.original_price > p.price));
            products.forEach(p => {
              if (!p.discount && p.original_price && p.original_price > p.price) {
                p.discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
              }
            });
            products.sort((a, b) => (b.discount || 0) - (a.discount || 0));
          }
        } catch (_) {}

        spinner.style.display = 'none';`;

if (saleHtml.includes(saleTarget)) {
  saleHtml = saleHtml.replace(saleTarget, saleReplacement);
  fs.writeFileSync(salePath, saleHtml, 'utf8');
  console.log('sale.html updated successfully!');
} else {
  console.error('saleTarget not found in sale.html');
}
