// RJ FASHION COLLECTION - CUSTOMER ACCOUNT CONTROLLER

async function initAccount() {
  try {
    const res = await fetch(`${API_BASE}/me`);
    const data = await res.json();

    if (!data.success || !data.user) {
      window.location.href = '/login.html?redirect=/account.html';
      return;
    }

    const user = data.user;
    document.getElementById('acc-user-name').textContent = user.name;
    document.getElementById('acc-user-email').textContent = user.email;

    // Profile form fields
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';

    // Load user addresses
    loadAccountAddresses();
  } catch (err) {
    console.error('Account init failed:', err);
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Profile updated successfully!', 'success');
      document.getElementById('acc-user-name').textContent = name;
    } else {
      showToast(data.message || 'Failed to update profile', 'error');
    }
  } catch (err) {
    showToast('Failed to update profile', 'error');
  }
}

async function changePassword(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('current-pwd').value;
  const newPassword = document.getElementById('new-pwd').value;
  const confirmNewPassword = document.getElementById('confirm-new-pwd').value;

  if (newPassword !== confirmNewPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Password changed successfully!', 'success');
      document.getElementById('change-pwd-form').reset();
    } else {
      showToast(data.message || 'Could not change password', 'error');
    }
  } catch (err) {
    showToast('Failed to change password', 'error');
  }
}

async function loadAccountAddresses() {
  const container = document.getElementById('account-addresses-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/addresses`);
    const data = await res.json();

    if (data.success && data.addresses && data.addresses.length > 0) {
      container.innerHTML = data.addresses.map(addr => `
        <div style="border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 700;">${addr.full_name} <span style="font-weight: 500; font-size: 0.85rem; color: var(--muted); margin-left: 8px;">${addr.phone}</span></div>
            <div style="font-size: 0.88rem; color: #4b5563; margin-top: 4px;">${addr.house_flat}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pin_code}</div>
          </div>
          <button onclick="deleteAccountAddress(${addr.id})" style="color: var(--danger); font-size: 0.82rem; font-weight: 600; cursor: pointer;">
            Delete
          </button>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p style="color: var(--muted); font-size: 0.88rem;">No saved addresses yet.</p>`;
    }
  } catch (err) {
    console.error('Error fetching addresses:', err);
  }
}

async function saveAccountNewAddress(e) {
  e.preventDefault();
  const fullName = document.getElementById('new-addr-name').value.trim();
  const phone = document.getElementById('new-addr-phone').value.trim();
  const houseFlat = document.getElementById('new-addr-house').value.trim();
  const street = document.getElementById('new-addr-street').value.trim();
  const city = document.getElementById('new-addr-city').value.trim();
  const state = document.getElementById('new-addr-state').value.trim();
  const pinCode = document.getElementById('new-addr-pincode').value.trim();

  try {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, houseFlat, street, city, state, pinCode })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Address added!', 'success');
      document.getElementById('new-account-address-form').reset();
      loadAccountAddresses();
    } else {
      showToast(data.message || 'Failed to add address', 'error');
    }
  } catch (err) {
    showToast('Failed to add address', 'error');
  }
}

async function deleteAccountAddress(id) {
  if (!confirm('Are you sure you want to delete this address?')) return;
  try {
    const res = await fetch(`${API_BASE}/addresses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Address deleted', 'info');
      loadAccountAddresses();
    }
  } catch (err) {
    showToast('Failed to delete address', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = '/';
    }, 600);
  } catch (err) {
    window.location.href = '/';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAccount();
  const profileForm = document.getElementById('profile-form');
  const pwdForm = document.getElementById('change-pwd-form');
  const addrForm = document.getElementById('new-account-address-form');

  if (profileForm) profileForm.addEventListener('submit', updateProfile);
  if (pwdForm) pwdForm.addEventListener('submit', changePassword);
  if (addrForm) addrForm.addEventListener('submit', saveAccountNewAddress);
});
