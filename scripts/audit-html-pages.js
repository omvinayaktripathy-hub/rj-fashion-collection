const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log(`\n================ AUDITING ${htmlFiles.length} HTML PAGES ================\n`);

htmlFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Logo title
  const logoMatch = content.match(/class=["'][^"']*logo-title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  const logoText = logoMatch ? logoMatch[1].trim() : 'NONE';

  // Subtitle (check if old "Luxury Indian Ethnic Wear" is lingering under logo)
  const hasOldSubtitle = /Luxury Indian Ethnic Wear/i.test(content);

  // Top Bar text
  const topBarMatch = content.match(/<div class="top-bar"[^>]*>([\s\S]*?)<\/div>/i);
  const topBarText = topBarMatch ? topBarMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'NONE';

  // CSS Version tags
  const styleCssMatch = content.match(/href="\/css\/style\.css(\?[^"]*)?"/);
  const respCssMatch = content.match(/href="\/css\/responsive\.css(\?[^"]*)?"/);
  const styleVer = styleCssMatch ? (styleCssMatch[1] || 'NO_VER') : 'MISSING';
  const respVer = respCssMatch ? (respCssMatch[1] || 'NO_VER') : 'MISSING';

  // Check phone / email clickable links in footer
  const telMatches = content.match(/href=["']tel:[^"']+["']/gi) || [];
  const mailMatches = content.match(/href=["']mailto:[^"']+["']/gi) || [];

  console.log(`PAGE: ${file}`);
  console.log(`  Logo: [${logoText}] | Old Subtitle Found: ${hasOldSubtitle ? '⚠️ YES' : 'NO ✅'}`);
  console.log(`  TopBar: [${topBarText}]`);
  console.log(`  CSS: style.css (${styleVer}), responsive.css (${respVer})`);
  console.log(`  Contacts: tel=${telMatches.join(', ') || 'NONE'}, mailto=${mailMatches.length} links`);
  console.log('----------------------------------------------------');
});
