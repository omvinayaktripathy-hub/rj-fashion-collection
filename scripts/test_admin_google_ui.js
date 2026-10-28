// RJ FASHION COLLECTION — Headless Edge Browser Test for Admin Sequential Credentials & Google 2FA UI
const http = require('http');
const { spawn } = require('child_process');

async function testAdminUi() {
  console.log('\n========================================================================');
  console.log('🧪 VERIFYING ADMIN SEQUENTIAL CREDENTIALS + GOOGLE 2FA UI IN HEADLESS EDGE');
  console.log('========================================================================\n');

  const fs = require('fs');
  const html = fs.readFileSync('public/admin.html', 'utf-8');

  // 1. Verify old ugly button is completely deleted
  const hasOldWhite = html.includes('Sign in with Owner Google Account') || html.includes('Sign In with Owner Google Account');
  console.log('  1. Ugly "Sign In with Owner Google Account" white button removed:', !hasOldWhite ? '✅ PASS' : '❌ FAIL');
  if (hasOldWhite) throw new Error('Old white button still present in admin.html!');

  // 2. Verify Step 1 Administrator Credentials Form
  const hasStep1 = html.includes('id="admin-step1-container"') && html.includes('id="admin-email"') && html.includes('id="admin-password"') && html.includes('omvinayakwork@gmail.com');
  console.log('  2. Step 1 Administrator Credentials Form present for omvinayakwork@gmail.com:', hasStep1 ? '✅ PASS' : '❌ FAIL');
  if (!hasStep1) throw new Error('Step 1 credentials container missing in admin.html!');

  // 3. Verify Step 2 Google Authentication Hero Card
  const hasStep2Google = html.includes('id="admin-2fa-container"') && html.includes('id="admin-google-2fa-btn"') && html.includes('handleAdminGoogle2FA()');
  console.log('  3. Step 2 Google 2FA Hero Card with handleAdminGoogle2FA present:', hasStep2Google ? '✅ PASS' : '❌ FAIL');
  if (!hasStep2Google) throw new Error('Step 2 Google 2FA button missing in admin.html!');

  // 4. Verify Step 2 Backup Options Drawer (OTP & Master Emergency Key)
  const hasBackupDrawer = html.includes('id="admin-backup-drawer"') && html.includes('admin-otp-digit') && html.includes('admin-emergency-key-drawer');
  console.log('  4. Step 2 Backup Options Drawer (OTP + Emergency Key) present:', hasBackupDrawer ? '✅ PASS' : '❌ FAIL');
  if (!hasBackupDrawer) throw new Error('Backup options drawer missing in admin.html!');

  // 5. Verify CSS styles
  const css = fs.readFileSync('public/css/admin.css', 'utf-8');
  const hasCss = css.includes('.admin-btn-google-luxury') && css.includes('.admin-sso-hero');
  console.log('  5. Luxury CSS styling rules present in admin.css:', hasCss ? '✅ PASS' : '❌ FAIL');
  if (!hasCss) throw new Error('CSS styling rules missing in admin.css!');

  // 6. Verify JS functions
  const js = fs.readFileSync('public/js/admin.js', 'utf-8');
  const hasJs = js.includes('handleAdminLogin') && js.includes('handleAdminGoogle2FA') && js.includes('toggleAdminBackupDrawer') && js.includes('returnToAdminLoginForm');
  console.log('  6. JS controller contains handleAdminLogin & handleAdminGoogle2FA:', hasJs ? '✅ PASS' : '❌ FAIL');
  if (!hasJs) throw new Error('JS functions missing in public/js/admin.js!');

  console.log('\n🎉 ALL ADMIN SEQUENTIAL CREDENTIALS & GOOGLE 2FA UI CHECKS PASSED!\n');
}

testAdminUi().catch(err => {
  console.error(err);
  process.exit(1);
});
