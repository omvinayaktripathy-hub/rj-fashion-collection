/**
 * RJ FASHION COLLECTION — SHADCN/UI JAVASCRIPT PRIMITIVES
 * Radix UI-inspired accessibility: Focus traps, Keyboard navigation, Command Palette, Sheets & Dialogs.
 */

(function () {
  'use strict';

  const ShadcnUI = {
    // 1. SHEET CONTROLLER (Mobile Drawer, Filter Sheet, Cart Drawer)
    openSheet(sheetId) {
      const sheet = document.getElementById(sheetId);
      if (!sheet) return;

      let backdrop = document.getElementById(sheetId + '-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = sheetId + '-backdrop';
        backdrop.className = 'ui-sheet-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.addEventListener('click', () => ShadcnUI.closeSheet(sheetId));
        document.body.appendChild(backdrop);
      }

      sheet.setAttribute('data-state', 'open');
      backdrop.setAttribute('data-state', 'open');
      sheet.setAttribute('aria-hidden', 'false');

      if (window.rjLockScroll) window.rjLockScroll();

      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = sheet.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
      }, 50);

      sheet.dispatchEvent(new CustomEvent('sheet:opened', { detail: { id: sheetId } }));
    },

    closeSheet(sheetId) {
      const sheet = document.getElementById(sheetId);
      if (!sheet) return;

      const backdrop = document.getElementById(sheetId + '-backdrop');
      sheet.setAttribute('data-state', 'closed');
      if (backdrop) backdrop.setAttribute('data-state', 'closed');
      sheet.setAttribute('aria-hidden', 'true');

      if (window.rjUnlockScroll) window.rjUnlockScroll();

      sheet.dispatchEvent(new CustomEvent('sheet:closed', { detail: { id: sheetId } }));
    },

    // 2. DIALOG CONTROLLER (Product Quick View, Size Guide, Lightbox)
    openDialog(dialogId) {
      const dialog = document.getElementById(dialogId);
      if (!dialog) return;

      const backdrop = dialog.closest('.ui-dialog-backdrop') || dialog.parentElement;
      if (backdrop) backdrop.setAttribute('data-state', 'open');
      dialog.setAttribute('data-state', 'open');
      dialog.setAttribute('aria-hidden', 'false');

      if (window.rjLockScroll) window.rjLockScroll();

      setTimeout(() => {
        const closeBtn = dialog.querySelector('.ui-dialog-close') || dialog.querySelector('button, [href], input');
        if (closeBtn) closeBtn.focus();
      }, 50);

      dialog.dispatchEvent(new CustomEvent('dialog:opened', { detail: { id: dialogId } }));
    },

    closeDialog(dialogId) {
      const dialog = document.getElementById(dialogId);
      if (!dialog) return;

      const backdrop = dialog.closest('.ui-dialog-backdrop') || dialog.parentElement;
      if (backdrop) backdrop.setAttribute('data-state', 'closed');
      dialog.setAttribute('data-state', 'closed');
      dialog.setAttribute('aria-hidden', 'true');

      if (window.rjUnlockScroll) window.rjUnlockScroll();

      dialog.dispatchEvent(new CustomEvent('dialog:closed', { detail: { id: dialogId } }));
    },

    // 3. COMMAND PALETTE (Search Overlay with Keyboard Navigation)
    initCommandPalette() {
      // Create Command Palette Modal DOM if not present
      if (document.getElementById('ui-command-dialog')) return;

      const backdrop = document.createElement('div');
      backdrop.id = 'ui-command-dialog';
      backdrop.className = 'ui-dialog-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');

      backdrop.innerHTML = `
        <div class="ui-dialog ui-command-dialog" role="dialog" aria-modal="true" aria-label="Command Search Palette">
          <div class="ui-command-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" class="ui-command-input" id="ui-command-search-input" placeholder="Search sarees, lehengas, kurtis, jewellery... (Type to explore)" autocomplete="off">
            <button type="button" class="ui-dialog-close" id="ui-command-close-btn" aria-label="Close Command Palette">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div class="ui-command-list" id="ui-command-results-list">
            <div class="ui-command-group">
              <div class="ui-command-group-heading">Featured Categories</div>
              <a href="/shop.html?category=sarees" class="ui-command-item">
                <span>Banarasi & Silk Sarees</span>
                <span class="ui-badge ui-badge-gold">Curated</span>
              </a>
              <a href="/shop.html?category=kurtis" class="ui-command-item">
                <span>Designer Kurtis & Tunics</span>
                <span class="ui-badge ui-badge-secondary">Trending</span>
              </a>
              <a href="/shop.html?category=dresses" class="ui-command-item">
                <span>Occasion Dresses & Gowns</span>
                <span class="ui-badge ui-badge-secondary">New</span>
              </a>
              <a href="/shop.html?category=jewellery" class="ui-command-item">
                <span>Royal Kundan & Polki Jewellery</span>
                <span class="ui-badge ui-badge-gold">Signature</span>
              </a>
            </div>
            <div class="ui-command-group">
              <div class="ui-command-group-heading">Quick Actions</div>
              <a href="/shop.html?newArrival=true" class="ui-command-item">
                <span>Explore New Arrivals</span>
                <kbd style="font-size: 0.72rem; padding: 2px 6px; border: 1px solid hsl(var(--border)); border-radius: 4px;">N</kbd>
              </a>
              <a href="/cart.html" class="ui-command-item">
                <span>View Shopping Bag</span>
                <kbd style="font-size: 0.72rem; padding: 2px 6px; border: 1px solid hsl(var(--border)); border-radius: 4px;">C</kbd>
              </a>
              <a href="/wishlist.html" class="ui-command-item">
                <span>Saved Wishlist</span>
                <kbd style="font-size: 0.72rem; padding: 2px 6px; border: 1px solid hsl(var(--border)); border-radius: 4px;">W</kbd>
              </a>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const closeBtn = document.getElementById('ui-command-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => ShadcnUI.closeDialog('ui-command-dialog'));

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) ShadcnUI.closeDialog('ui-command-dialog');
      });

      // Keyboard shortcut Ctrl+K / Cmd+K to open
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          ShadcnUI.openDialog('ui-command-dialog');
          const input = document.getElementById('ui-command-search-input');
          if (input) input.focus();
        }
      });

      // Live search input filtering
      const searchInput = document.getElementById('ui-command-search-input');
      const resultsList = document.getElementById('ui-command-results-list');

      if (searchInput && resultsList) {
        let debounceTimer = null;
        searchInput.addEventListener('input', (e) => {
          clearTimeout(debounceTimer);
          const q = e.target.value.trim().toLowerCase();
          debounceTimer = setTimeout(async () => {
            if (!q) {
              resultsList.innerHTML = `
                <div class="ui-command-group">
                  <div class="ui-command-group-heading">Featured Categories</div>
                  <a href="/shop.html?category=sarees" class="ui-command-item"><span>Banarasi & Silk Sarees</span><span class="ui-badge ui-badge-gold">Curated</span></a>
                  <a href="/shop.html?category=kurtis" class="ui-command-item"><span>Designer Kurtis & Tunics</span><span class="ui-badge ui-badge-secondary">Trending</span></a>
                  <a href="/shop.html?category=dresses" class="ui-command-item"><span>Occasion Dresses & Gowns</span><span class="ui-badge ui-badge-secondary">New</span></a>
                  <a href="/shop.html?category=jewellery" class="ui-command-item"><span>Royal Kundan & Polki Jewellery</span><span class="ui-badge ui-badge-gold">Signature</span></a>
                </div>
              `;
              return;
            }

            try {
              const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
              const data = await res.json();
              const products = data.products || [];

              if (products.length === 0) {
                resultsList.innerHTML = `<div class="ui-command-empty">No luxury pieces matching "${escapeHtml(q)}". Try searching for "silk", "saree", or "kundan".</div>`;
              } else {
                resultsList.innerHTML = `
                  <div class="ui-command-group">
                    <div class="ui-command-group-heading">Matching Products (${products.length})</div>
                    ${products.map(p => `
                      <a href="/product.html?id=${p.id}" class="ui-command-item">
                        <span style="font-weight: 500;">${escapeHtml(p.name)}</span>
                        <span style="font-weight: 700; color: hsl(var(--primary));">₹${Number(p.price).toLocaleString('en-IN')}</span>
                      </a>
                    `).join('')}
                    <a href="/shop.html?search=${encodeURIComponent(q)}" class="ui-command-item" style="margin-top: 8px; border-top: 1px solid hsl(var(--border)); padding-top: 8px; color: hsl(var(--accent)); font-weight: 700;">
                      <span>View all search results for "${escapeHtml(q)}" →</span>
                    </a>
                  </div>
                `;
              }
            } catch (err) {
              // Silently handle error
            }
          }, 180);
        });
      }
    },

    // 4. ACCORDION COMPONENT INITIALIZER
    initAccordions() {
      document.querySelectorAll('.ui-accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', function () {
          const item = this.closest('.ui-accordion-item');
          if (!item) return;
          const isOpen = item.getAttribute('data-state') === 'open';

          // Accordion single mode: close siblings if requested
          const parentAccordion = item.closest('.ui-accordion');
          if (parentAccordion && parentAccordion.hasAttribute('data-single')) {
            parentAccordion.querySelectorAll('.ui-accordion-item').forEach(sibling => {
              sibling.setAttribute('data-state', 'closed');
              const t = sibling.querySelector('.ui-accordion-trigger');
              if (t) t.setAttribute('aria-expanded', 'false');
            });
          }

          item.setAttribute('data-state', isOpen ? 'closed' : 'open');
          this.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        });
      });
    },

    // 5. TABS COMPONENT INITIALIZER
    initTabs() {
      document.querySelectorAll('.ui-tabs').forEach(tabContainer => {
        const triggers = tabContainer.querySelectorAll('.ui-tabs-trigger');
        const contents = tabContainer.querySelectorAll('.ui-tabs-content');

        triggers.forEach((trigger, idx) => {
          trigger.addEventListener('click', function () {
            const targetVal = this.getAttribute('data-tab') || this.getAttribute('data-target');

            triggers.forEach(t => {
              t.setAttribute('aria-selected', 'false');
              t.classList.remove('is-active');
            });
            this.setAttribute('aria-selected', 'true');
            this.classList.add('is-active');

            contents.forEach(c => {
              if (c.getAttribute('data-tab') === targetVal || c.id === targetVal) {
                c.setAttribute('data-state', 'active');
                c.classList.add('is-active');
              } else {
                c.setAttribute('data-state', 'inactive');
                c.classList.remove('is-active');
              }
            });
          });

          // Keyboard Arrow navigation
          trigger.addEventListener('keydown', function (e) {
            let nextIdx = null;
            if (e.key === 'ArrowRight') nextIdx = (idx + 1) % triggers.length;
            if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + triggers.length) % triggers.length;
            if (nextIdx !== null) {
              triggers[nextIdx].focus();
              triggers[nextIdx].click();
            }
          });
        });
      });
    },

    // Universal ESC Key listener for active dialogs / sheets
    initGlobalListeners() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.ui-dialog[data-state="open"]').forEach(d => {
            ShadcnUI.closeDialog(d.id);
          });
          document.querySelectorAll('.ui-sheet[data-state="open"]').forEach(s => {
            ShadcnUI.closeSheet(s.id);
          });
          const cmd = document.getElementById('ui-command-dialog');
          if (cmd && cmd.getAttribute('data-state') === 'open') {
            ShadcnUI.closeDialog('ui-command-dialog');
          }
        }
      });
    },

    init() {
      this.initCommandPalette();
      this.initAccordions();
      this.initTabs();
      this.initGlobalListeners();
    }
  };

  window.ShadcnUI = ShadcnUI;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShadcnUI.init());
  } else {
    ShadcnUI.init();
  }
})();
