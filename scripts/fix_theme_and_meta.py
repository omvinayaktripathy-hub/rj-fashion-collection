import os

theme_script = '''  <script>
    // Instant Theme Controller - zero delay, zero external dependencies
    window.applyTheme = function(theme) {
      var isDark = theme === 'dark';
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark-theme');
        if (document.body) document.body.classList.add('dark-theme');
        try { localStorage.setItem('rjfc_theme', 'dark'); } catch(e){}
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark-theme');
        if (document.body) document.body.classList.remove('dark-theme');
        try { localStorage.setItem('rjfc_theme', 'light'); } catch(e){}
      }
      window.updateAllThemeToggles(theme);
    };

    window.toggleTheme = function() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark-theme');
      window.applyTheme(isDark ? 'light' : 'dark');
    };

    window.updateAllThemeToggles = function(theme) {
      var isDark = theme === 'dark';
      var sunSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      var moonSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      
      document.querySelectorAll('.theme-mode-text').forEach(function(el) {
        el.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      });
      document.querySelectorAll('.theme-label-icon').forEach(function(el) {
        el.innerHTML = isDark ? sunSvg : moonSvg;
      });
      document.querySelectorAll('.theme-switch-container').forEach(function(el) {
        el.setAttribute('aria-checked', isDark ? 'true' : 'false');
        el.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      });
    };

    // Run immediately on parse to prevent flash
    try {
      var saved = localStorage.getItem('rjfc_theme');
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      var activeTheme = saved ? saved : (prefersDark ? 'dark' : 'light');
      if (activeTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark-theme');
      }
    } catch(e){}

    document.addEventListener('DOMContentLoaded', function() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('dark-theme');
      if (isDark && document.body) document.body.classList.add('dark-theme');
      window.updateAllThemeToggles(isDark ? 'dark' : 'light');
    });
  </script>'''

# 1. Update public/about.html
about_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/about.html'
with open(about_path, 'r', encoding='utf-8') as f:
    about_content = f.read()

if 'window.applyTheme' not in about_content:
    about_content = about_content.replace('</head>', f'{theme_script}\n</head>')
    with open(about_path, 'w', encoding='utf-8') as f:
        f.write(about_content)
    print("Added instant theme script to public/about.html")

# 2. Update public/500.html
err_path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/public/500.html'
if os.path.exists(err_path):
    with open(err_path, 'r', encoding='utf-8') as f:
        err_content = f.read()
    if 'window.applyTheme' not in err_content:
        err_content = err_content.replace('</head>', f'{theme_script}\n</head>')
        with open(err_path, 'w', encoding='utf-8') as f:
            f.write(err_content)
        print("Added instant theme script to public/500.html")
