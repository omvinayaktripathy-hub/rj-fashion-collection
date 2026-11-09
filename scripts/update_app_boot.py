path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/js/app.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Top cleanup
old_top = '''try {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.logo-subtitle').forEach(el => el.remove());
    const curYear = new Date().getFullYear();
    document.querySelectorAll('.current-year, #copyright-year').forEach(el => el.textContent = curYear);
  });
} catch (e) {}'''

new_top = '''function initAppHeaderClean() {
  document.querySelectorAll('.logo-subtitle').forEach(el => el.remove());
  const curYear = new Date().getFullYear();
  document.querySelectorAll('.current-year, #copyright-year').forEach(el => el.textContent = curYear);
}
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppHeaderClean);
  } else {
    initAppHeaderClean();
  }
} catch (e) {}'''

# 2. Main app boot
old_main = '''// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  AdaptiveDevice.detect();
  renderHeaderCategoryLinks();
  injectMobileBottomNav();
  initSearchAutocomplete();
  initMobileSearch();
  initMobileDrawer();
  checkAuth();
  updateCartCount();
  updateWishlistCount();
  initBackToTop();
  initNewsletterForm();
  trackPageView();
});'''

new_main = '''function startAppCore() {
  initTheme();
  AdaptiveDevice.detect();
  renderHeaderCategoryLinks();
  injectMobileBottomNav();
  initSearchAutocomplete();
  initMobileSearch();
  initMobileDrawer();
  checkAuth();
  updateCartCount();
  updateWishlistCount();
  initBackToTop();
  initNewsletterForm();
  trackPageView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAppCore);
} else {
  startAppCore();
}'''

# 3. Gift option UI
old_gift = "document.addEventListener('DOMContentLoaded', initGiftOptionUI);"
new_gift = '''if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGiftOptionUI);
} else {
  initGiftOptionUI();
}'''

for sep in ['\n', '\r\n']:
    t_top = old_top if sep == '\n' else old_top.replace('\n', '\r\n')
    r_top = new_top if sep == '\n' else new_top.replace('\n', '\r\n')
    if t_top in c:
        c = c.replace(t_top, r_top)
        print('Updated top in app.js')
        break

for sep in ['\n', '\r\n']:
    t_main = old_main if sep == '\n' else old_main.replace('\n', '\r\n')
    r_main = new_main if sep == '\n' else new_main.replace('\n', '\r\n')
    if t_main in c:
        c = c.replace(t_main, r_main)
        print('Updated main in app.js')
        break

if old_gift in c:
    c = c.replace(old_gift, new_gift)
    print('Updated gift in app.js')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Finished app.js updates')
