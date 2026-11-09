const baseUrl = 'https://rj-fashion-collection.web.app';

const routes = [
  '/',
  '/shop',
  '/categories',
  '/cart',
  '/delivery',
  '/checkout',
  '/orders',
  '/login',
  '/about',
  '/contact',
  '/faq',
  '/sale',
  '/size-guide',
  '/admin'
];

async function checkAllLive() {
  console.log(`Auditing live routes on ${baseUrl}...\n`);
  let allOk = true;

  for (const r of routes) {
    const url = baseUrl + r;
    const t0 = Date.now();
    try {
      const res = await fetch(url);
      const elapsed = Date.now() - t0;
      const html = await res.text();
      const hasTitle = html.includes('<title>') && !html.includes('<title></title>');
      const hasWaf = res.headers.get('x-waf-protection') === 'RJ-WAF/2.0-Active';
      const isOk = res.status === 200 && hasTitle;

      if (!isOk) allOk = false;

      console.log(`  ${isOk ? '✓' : '✗'} [${res.status}] ${r.padEnd(14)} (${elapsed}ms) Title:${hasTitle ? 'OK' : 'MISSING'} WAF:${hasWaf ? 'ACTIVE' : 'NO'}`);
    } catch (err) {
      allOk = false;
      console.log(`  ✗ [ERR] ${r.padEnd(14)} Error: ${err.message}`);
    }
  }

  // Specifically check /about#terms content
  console.log('\nChecking /about content & legal sections:');
  const aboutRes = await fetch(baseUrl + '/about.html');
  const aboutHtml = await aboutRes.text();
  console.log('  #terms section exists:', aboutHtml.includes('id="terms"'));
  console.log('  #privacy section exists:', aboutHtml.includes('id="privacy"'));
  console.log('  #shipping section exists:', aboutHtml.includes('id="shipping"'));
  console.log('  #grievance section exists:', aboutHtml.includes('id="grievance"'));
  console.log('  PhonePe Terminal reference in terms:', aboutHtml.includes('Terminal 1-Q070080131'));
  console.log('  Odisha address in terms:', aboutHtml.includes('Jharsuguda, Odisha'));

  // Specifically check /checkout
  console.log('\nChecking /checkout content:');
  const chkRes = await fetch(baseUrl + '/checkout.html');
  const chkHtml = await chkRes.text();
  console.log('  Confirmed address container:', chkHtml.includes('id="confirmed-address-content"'));
  console.log('  Checkout items container:', chkHtml.includes('id="checkout-cart-items"'));
  console.log('  PhonePe Terminal option:', chkHtml.includes('Q070080131@ybl'));
  console.log('  PhonePe QR preview toggle:', chkHtml.includes('phonepe-qr-preview-box'));

  console.log('\nVerification result:', allOk ? 'ALL LIVE ROUTES OPERATIONAL (100% HEALTH)' : 'ISSUES DETECTED');
}

checkAllLive().catch(console.error);
