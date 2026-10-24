import os

resp_path = r'public\css\responsive.css'
with open(resp_path, 'r', encoding='utf-8') as f:
    resp = f.read()

final_css = """
/* Mobile Coupon Input Group & Footer Word Break Containment */
.coupon-card-section {
  padding: 14px 12px !important;
  box-sizing: border-box !important;
  max-width: 100% !important;
}

.coupon-input-group {
  display: flex !important;
  gap: 8px !important;
  max-width: 100% !important;
}

.coupon-input-group input {
  min-width: 0 !important;
  flex: 1 !important;
  padding: 10px 12px !important;
  font-size: 16px !important;
  box-sizing: border-box !important;
}

.coupon-apply-btn {
  padding: 10px 16px !important;
  font-size: 0.82rem !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.coupon-chips {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 6px !important;
  margin-top: 8px !important;
}

.coupon-chip {
  font-size: 0.72rem !important;
  padding: 4px 8px !important;
  white-space: normal !important;
}

.footer-grid,
.footer-col,
.footer-col p,
.footer-col a {
  min-width: 0 !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  box-sizing: border-box !important;
}
"""

with open(resp_path, 'a', encoding='utf-8') as f:
    f.write('\n' + final_css)

print('Appended coupon input group and footer word-break fixes.')
