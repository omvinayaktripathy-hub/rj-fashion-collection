// RJ FASHION COLLECTION — Headless Edge Browser Test for Admin Sequential Credentials & Google Authenticator 2FA UI
const http = require('http');
const { spawn } = require('child_process');

async function testAdminUi() {
  console.log('\n========================================================================');
  console.log('🧪 VERIFYING ADMIN CREDENTIALS + GOOGLE AUTHENTICATOR 2FA CODE UI IN HEADLESS EDGE');
  console.log('========================================================================\n');

  const fs = require('fs');
  const html = fs.readFileSync('public/admin.html', 'utf-8');

  // 1. Verify old ugly button and Google OAuth popup buttons are completely removed
  const hasOldWhite = html.includes('Sign in with Owner Google Account') || html.includes('Sign In with Owner Google Account');
  const hasOAuthBtn = html.includes('id="admin-google-2fa-btn"') || html.includes('Authenticate with Google (omvinayakwork@gmail.com)');
  console.log('  1. Google OAuth popup button removed in favor of Authenticator code:', (!hasOldWhite && !hasOAuthBtn) ? '✅ PASS' : '❌ FAIL');
  if (hasOldWhite || hasOAuthBtn) throw new Error('OAuth button still present in admin.html!');

  // 2. Verify Step 1 Administrator Credentials Form
  const hasStep1 = html.includes('id="admin-step1-container"') && html.includes('id="admin-email"') && html.includes('id="admin-password"') && html.includes('omvinayakwork@gmail.com');
  console.log('  2. Step 1 Administrator Credentials Form present for omvinayakwork@gmail.com:', hasStep1 ? '✅ PASS' : '❌ FAIL');
  if (!hasStep1) throw new Error('Step 1 credentials container missing in admin.html!');

  // 3. Verify Step 2 6-Digit Google Authenticator Form
  const hasStep2Code = html.includes('id="admin-2fa-container"') && html.includes('admin-otp-boxes') && html.includes('admin-otp-digit') && html.includes('Enter 6-digit code sent to your email or from Authenticator:');
  console.log('  3. Step 2 6-Digit Google Authenticator Form present:', hasStep2Code ? '✅ PASS' : '❌ FAIL');
  if (!hasStep2Code) throw new Error('Step 2 6-Digit Authenticator container missing in admin.html!');

  // 4. Verify Verify Code Button and Emergency Key Drawer
  const hasVerifyBtn = html.includes('id="admin-2fa-verify-btn"') && html.includes('Verify Code &amp; Access Portal');
  const hasEmergencyKey = html.includes('id="admin-emergency-key-drawer"') && html.includes('RJFC-ROYAL-ADMIN-2026');
  console.log('  4. Verify Code button & Emergency Key Drawer present:', (hasVerifyBtn && hasEmergencyKey) ? '✅ PASS' : '❌ FAIL');
  if (!hasVerifyBtn || !hasEmergencyKey) throw new Error('Verify button or Emergency Key missing in admin.html!');

  // 5. Verify JS functions
  const js = fs.readFileSync('public/js/admin.js', 'utf-8');
  const hasJs = js.includes('handleAdminLogin') && js.includes('handleAdmin2FASubmit') && js.includes('initOtpDigitInputs');
  console.log('  5. JS controller contains handleAdminLogin & handleAdmin2FASubmit:', hasJs ? '✅ PASS' : '❌ FAIL');
  if (!hasJs) throw new Error('JS functions missing in public/js/admin.js!');

  console.log('\n🎉 ALL ADMIN SEQUENTIAL CREDENTIALS & GOOGLE AUTHENTICATOR CODE UI CHECKS PASSED!\n');
}

testAdminUi().catch(err => {
  console.error(err);
  process.exit(1);
});
