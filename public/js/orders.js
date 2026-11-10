var escapeHtml = window.escapeHtml || (str => String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
// RJ FASHION COLLECTION - ORDERS CONTROLLER (WITH LOCALSTORAGE PERSISTENCE)

let activeCancelOrderNumber = null;

async function loadMyOrders() {
  const container = document.getElementById('orders-list-container');
  const emptyState = document.getElementById('orders-empty-state');

  if (!container) return;

  let orders = [];

  // 1. Try server API
  if (!window.isStaticHosting) {
    try {
      const res = await fetch(`${API_BASE}/orders`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        orders = data.orders;
      }
    }
    } catch (_) {}
  }

  // 2. Fallback to localStorage saved orders
  if (orders.length === 0) {
    try {
      const localOrders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
      if (Array.isArray(localOrders) && localOrders.length > 0) {
        orders = localOrders;
      }
    } catch (_) {}
  }

  // If no orders found
  if (orders.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Render Luxury Orders List
  container.innerHTML = orders.map(order => {
    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const orderNum = escapeHtml(order.order_number || ('RJFC-' + (order.id || '1001')));
    const rawOrderNum = String(order.order_number || ('RJFC-' + (order.id || '1001')));
    const status = String(order.status || 'Confirmed');
    const isCancelled = status.toLowerCase() === 'cancelled';
    const isDelivered = status.toLowerCase() === 'delivered';

    const items = Array.isArray(order.items) ? order.items : [];
    const shippingAddr = escapeHtml(order.shipping_address || order.delivery_address || 'Delivery Address on file');
    const payMethod = String(order.payment_method || 'Cash on Delivery');
    const payStatus = String(order.payment_status || (payMethod === 'Cash on Delivery' ? 'Pay on Delivery' : 'Paid'));
    const isUnpaidOnline = payMethod !== 'Cash on Delivery' && (payStatus === 'Pending' || payStatus === 'Failed');
    const canCancel = !isCancelled && !isDelivered;
    const orderTotal = Number(order.total) || items.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);

    return `
      <div class="order-luxury-card" id="order-card-${orderNum}">
        <!-- Order Header Strip -->
        <div class="order-header-strip">
          <div>
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--deliv-text-muted); font-weight: 800; letter-spacing: 0.5px;">Order Reference</span>
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--primary); font-family: monospace; letter-spacing: 0.5px;">
              ${orderNum}
            </div>
            <div style="font-size: 0.84rem; color: var(--deliv-text-muted); margin-top: 3px;">
              Placed on ${orderDate} • Express Insured Air Shipping
            </div>
          </div>

          <div style="text-align: right;">
            <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--deliv-text-muted); font-weight: 800; letter-spacing: 0.5px;">Status</span>
            <div>
              <span class="status-pill status-${escapeHtml(status.toLowerCase().replace(/\s+/g, '-'))}" id="order-status-badge-${orderNum}">
                ● ${escapeHtml(status)}
              </span>
            </div>
            <div style="font-weight: 800; font-size: 1.25rem; margin-top: 4px; color: var(--deliv-text-primary);">
              ${formatPrice(orderTotal)}
            </div>
          </div>
        </div>

        <!-- Order Live Progress Stepper Timeline -->
        <div class="order-timeline-wrap">
          <div class="timeline-step ${isUnpaidOnline || isCancelled ? '' : 'completed'}">
            <div class="timeline-dot">${isUnpaidOnline ? '⏳' : (isCancelled ? '✕' : '✓')}</div>
            <div class="timeline-label">${isUnpaidOnline ? 'Awaiting Payment' : 'Order Confirmed'}</div>
          </div>
          <div class="timeline-line ${!isCancelled && !isUnpaidOnline ? 'active' : ''}"></div>
          <div class="timeline-step ${!isCancelled && !isUnpaidOnline ? 'active' : ''}">
            <div class="timeline-dot">${isCancelled ? '✕' : (isUnpaidOnline ? '💳' : '⚡')}</div>
            <div class="timeline-label">${isCancelled ? 'Cancelled' : (isUnpaidOnline ? 'Pay to Dispatch' : 'Preparing Dispatch')}</div>
          </div>
          <div class="timeline-line ${isDelivered ? 'completed' : ''}"></div>
          <div class="timeline-step ${isDelivered ? 'completed' : ''}">
            <div class="timeline-dot">🚚</div>
            <div class="timeline-label">Blue Dart Air</div>
          </div>
          <div class="timeline-line ${isDelivered ? 'completed' : ''}"></div>
          <div class="timeline-step ${isDelivered ? 'completed' : ''}">
            <div class="timeline-dot">📦</div>
            <div class="timeline-label">Delivered</div>
          </div>
        </div>

        <!-- Items in Order -->
        <div class="order-items-container">
          ${items.map(item => {
            const name = escapeHtml(item.name || item.product_name || 'Designer Ethnic Wear');
            const img = escapeHtml(item.image || item.product_image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80');
            const size = escapeHtml(item.size || 'Free Size');
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;

            return `
              <div class="order-item-row">
                <img src="${img}" alt="${name}" class="order-item-thumb" onerror="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'">
                <div style="flex: 1; min-width: 0;">
                  <h4 class="order-item-title">${name}</h4>
                  <div style="font-size: 0.85rem; color: var(--deliv-text-muted); margin-bottom: 4px;">
                    Size: <strong>${size}</strong> • Qty: <strong>${qty}</strong>
                  </div>
                  <div style="font-size: 0.95rem; font-weight: 800; color: var(--deliv-text-primary);">
                    ${formatPrice(price)} each
                  </div>
                </div>
                <div style="font-weight: 800; font-size: 1.05rem; color: var(--deliv-text-primary); text-align: right;">
                  ${formatPrice(price * qty)}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Order Footer Details & Actions -->
        <div class="order-footer-strip">
          <div style="flex: 1; min-width: 260px;">
            <div style="font-size: 0.88rem; color: var(--deliv-text-secondary); line-height: 1.5;">
              <span style="font-weight: 700; color: var(--deliv-text-primary);">📍 Delivery Address:</span> ${shippingAddr}
            </div>
            <div style="font-size: 0.85rem; color: var(--deliv-text-muted); margin-top: 4px;">
              <span style="font-weight: 700; color: var(--deliv-text-primary);">💳 Payment:</span> ${escapeHtml(payMethod)} (${escapeHtml(payStatus)})
            </div>
          </div>

          <div class="order-action-buttons" id="order-actions-${orderNum}">
            ${isUnpaidOnline && !isCancelled ? `
              <a href="/payment.html?order_number=${encodeURIComponent(rawOrderNum)}&amount=${encodeURIComponent(orderTotal)}" class="order-support-btn" style="background: #5f259f; color: #ffffff; border-color: #5f259f;">
                ⚡ Retry / Complete Payment
              </a>
            ` : ''}
            <a href="https://wa.me/917894093586?text=Hello%20RJ%20Fashion%20Collection!%20I%20need%20an%20update%20on%20my%20order%20${encodeURIComponent(rawOrderNum)}" target="_blank" rel="noopener noreferrer" class="order-support-btn">
              💬 WhatsApp Concierge
            </a>
            ${canCancel ? `
              <button class="order-cancel-btn" onclick="openCancelModal('${orderNum}')">
                ✕ Cancel Order
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Cancel Order Modal Handlers
function openCancelModal(orderNumber) {
  activeCancelOrderNumber = orderNumber;
  const modal = document.getElementById('cancel-order-modal');
  const numDisplay = document.getElementById('cancel-modal-order-num');
  if (numDisplay) numDisplay.textContent = orderNumber;
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeCancelModal() {
  activeCancelOrderNumber = null;
  const modal = document.getElementById('cancel-order-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

async function submitOrderCancellation() {
  if (!activeCancelOrderNumber) return;

  const reasonSelect = document.getElementById('cancel-reason-select');
  const reason = reasonSelect ? reasonSelect.value : 'Cancelled by customer';
  const confirmBtn = document.getElementById('confirm-cancel-order-btn');

  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Cancelling...';

  // 1. Try server API
  try {
    await fetch(`${API_BASE}/orders/${activeCancelOrderNumber}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
  } catch (_) {}

  // 2. Persist cancellation in localStorage
  try {
    const localOrders = JSON.parse(localStorage.getItem('rj_orders') || '[]');
    const target = localOrders.find(o => (o.order_number === activeCancelOrderNumber) || String(o.id) === String(activeCancelOrderNumber));
    if (target) {
      target.status = 'Cancelled';
      target.cancel_reason = reason;
      localStorage.setItem('rj_orders', JSON.stringify(localOrders));
    }
  } catch (_) {}

  showToast('Order cancelled successfully.', 'success');
  closeCancelModal();

  // Reload orders view
  await loadMyOrders();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMyOrders);
} else {
  loadMyOrders();
}
