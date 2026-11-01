const fs = require('fs');

const path = 'public/css/responsive.css';
let content = fs.readFileSync(path, 'utf8');

// 1. Mobile brand logo fix
const target1 = `  .brand-logo {
    max-width: calc(100% - 130px);
    overflow: hidden;
  }

  .brand-logo .logo-title {
    font-size: 1.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brand-logo .logo-subtitle {
    font-size: 0.58rem;
    letter-spacing: 1.5px;
    white-space: nowrap;
  }`;

const replacement1 = `  .brand-logo {
    min-width: 0;
    max-width: calc(100% - 130px);
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand-logo-mark {
    flex-shrink: 0;
  }

  .brand-logo-text {
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .brand-logo .logo-title {
    font-size: 1.15rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 100%;
  }

  .brand-logo .logo-subtitle {
    font-size: 0.55rem;
    letter-spacing: 1.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 100%;
  }`;

// 2. Desktop vs mobile hamburger button fix
const target2 = `.rj-hamburger-btn {
  min-width: 44px !important;
  min-height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  touch-action: manipulation;
  -webkit-touch-callout: none;
}`;

const replacement2 = `@media (max-width: 991px) {
  .rj-hamburger-btn {
    min-width: 44px !important;
    min-height: 44px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    touch-action: manipulation;
    -webkit-touch-callout: none;
  }
}

@media (min-width: 992px) {
  .rj-hamburger-btn {
    display: none !important;
  }
}`;

// Normalize CRLF to LF for replacement, then replace
const isCRLF = content.includes('\r\n');
let normContent = content.replace(/\r\n/g, '\n');

if (!normContent.includes(target1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
if (!normContent.includes(target2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}

normContent = normContent.replace(target1, replacement1);
normContent = normContent.replace(target2, replacement2);

if (isCRLF) {
  normContent = normContent.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, normContent, 'utf8');
console.log('Successfully updated public/css/responsive.css!');
