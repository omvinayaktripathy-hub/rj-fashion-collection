// RJ FASHION COLLECTION - ORDERS CONTROLLER

let activeCancelOrderNumber = null;

async function loadMyOrders() {
  const container = document.getElementById('orders-list-container');
  const emptyState = document.getElementById('orders-empty-state');

  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/orders`);

    if (res.status === 401) {
      window.location.href = '/login.html?redirect=/orders.html';
      return;
    }

    const data = await res.json();
    if (!data.success || !data.orders || data.orders.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      container.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = data.orders.map(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const canCancel = order.status !== 'Cancelled' && order.status !== 'Delivered';

      return `
        <div class="cart-items-card" style="margin-bottom: 24px; padding: 20px;" id="order-card-${order.order_number}">
          <!-- Order Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 14px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--muted); font-weight: 700;">Order ID</span>
              <div style="font-weight: 700; font-size: 1.05rem; color: var(--primary);">${order.order_number}</div>
              <div style="font-size: 0.82rem; color: var(--muted); margin-top: 2px;">Placed on ${orderDate}</div>
            </div>

            <div style="text-align: right;">
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--muted); font-weight: 700;">Status</span>
              <div>
                <span class="status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}" id="order-status-badge-${order.order_number}">
                  ● ${order.status}
                </span>
              </div>
              <div style="font-weight: 700; font-size: 1.1rem; margin-top: 4px; color: var(--dark);">${formatPrice(order.total)}</div>
            </div>
          </div>

          <!-- Items in Order -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${(order.items || []).map(item => `
              <div style="display: flex; gap: 16px; align-items: center;">
                <img src="${item.product_image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'}"
                     alt="${item.product_name}"
                     style="width: 60px; height: 75px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border);">
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 0.95rem; color: var(--dark);">${item.product_name}</div>
                  <div style="font-size: 0.82rem; color: var(--muted); margin-top: 2px;">
                    Quantity: ${item.quantity} ${item.size ? `• Size: ${item.size}` : ''}
                  </div>
                  <div style="font-weight: 600; font-size: 0.9rem; color: var(--dark); margin-top: 2px;">${formatPrice(item.price)} each</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Order Footer / Details -->
          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #4b5563; flex-wrap: wrap; gap: 12px;">
            <div style="max-width: 65%;">
              <div><span style="font-weight: 600;">Delivery Address:</span> ${order.delivery_address}</div>
              <div style="margin-top: 4px;"><span style="font-weight: 600;">Payment:</span> ${order.payment_method} (${order.payment_status})</div>
            </div>

            <div id="order-actions-${order.order_number}">
              ${canCancel ? `
                <button class="fk-change-btn" style="color: #dc2626; border-color: #fca5a5; background: #fff5f5;" onclick="openCancelModal('${order.order_number}')">
                  ✕ Cancel Order
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading orders:', err);
    container.innerHTML = `<p style="padding: 20px; color: var(--danger);">Failed to load orders.</p>`;
  }
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

  try {
    const res = await fetch(`${API_BASE}/orders/${activeCancelOrderNumber}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Order cancelled successfully.', 'success');
      closeCancelModal();

      // Dynamically update status pill without full page reload
      const badge = document.getElementById(`order-status-badge-${activeCancelOrderNumber}`);
      if (badge) {
        badge.className = 'status-pill status-cancelled';
        badge.textContent = '● Cancelled';
      }

      // Hide the cancel button
      const actions = document.getElementById(`order-actions-${activeCancelOrderNumber}`);
      if (actions) actions.innerHTML = '<span style="color: #dc2626; font-weight: 600; font-size: 0.85rem;">Order Cancelled</span>';
    } else {
      showToast(data.message || 'Could not cancel order.', 'error');
    }
  } catch (err) {
    console.error('Cancellation error:', err);
    showToast('Failed to connect to server. Please try again.', 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'CONFIRM CANCELLATION';
  }
}

document.addEventListener('DOMContentLoaded', loadMyOrders);
