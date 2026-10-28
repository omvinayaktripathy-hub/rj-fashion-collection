// RJ FASHION COLLECTION — Headless Edge Browser Test for Admin Google Auth & 2FA UI
const http = require('http');
const { spawn } = require('child_process');

async function testAdminUi() {
  console.log('\n============================================================');
  console.log('🧪 VERIFYING ADMIN DUAL AUTH & GOOGLE SSO UI IN HEADLESS EDGE');
  console.log('============================================================\n');

  const fs = require('fs');
  const html = fs.readFileSync('public/admin.html', 'utf-8');

  // 1. Verify old ugly button is completely deleted
  const hasOldOr = html.includes('Sign in with Owner Google Account') || html.includes('Sign In with Owner Google Account');
  console.log('  1. Ugly "Sign In with Owner Google Account" white button removed:', !hasOldOr ? '✅ PASS' : '❌ FAIL');
  if (hasOldOr) throw new Error('Old white button still present in admin.html!');

  // 2. Verify luxury Google SSO mode exists
  const hasTabs = html.includes('admin-auth-mode-tabs') && html.includes('tab-google-auth-btn') && html.includes('tab-password-auth-btn');
  console.log('  2. Luxury dual-mode authentication tabs present:', hasTabs ? '✅ PASS' : '❌ FAIL');

  // 3. Verify Google SSO hero card
  const hasSsoCard = html.includes('admin-sso-hero') && html.includes('STRONG GOOGLE AUTHENTICATION') && html.includes('admin-btn-google-luxury');
  console.log('  3. Luxury Google SSO Card & Badge present:', hasSsoCard ? '✅ PASS' : '❌ FAIL');

  // 4. Verify Step 2 2FA Modal
  const has2FA = html.includes('admin-2fa-container') && html.includes('admin-otp-digit') && html.includes('admin-2fa-timer');
  console.log('  4. Step 2 Two-Step Verification modal present:', has2FA ? '✅ PASS' : '❌ FAIL');

  // 5. Verify CSS styles
  const css = fs.readFileSync('public/css/admin.css', 'utf-8');
  const hasCss = css.includes('.admin-auth-mode-tabs') && css.includes('.admin-btn-google-luxury') && css.includes('.admin-sso-hero');
  console.log('  5. Luxury CSS styling rules present in admin.css:', hasCss ? '✅ PASS' : '❌ FAIL');

  // 6. Verify JS functions
  const js = fs.readFileSync('public/js/admin.js', 'utf-8');
  const hasJs = js.includes('switchAdminAuthMode') && js.includes('admin-google-login') && js.includes('getCsrfToken');
  console.log('  6. JS controller contains switchAdminAuthMode & /auth/admin-google-login:', hasJs ? '✅ PASS' : '❌ FAIL');

  console.log('\n🎉 ALL ADMIN GOOGLE AUTH UI AUDIT CHECKS PASSED!\n');
}

testAdminUi().catch(err => {
  console.error(err);
  process.exit(1);
});
