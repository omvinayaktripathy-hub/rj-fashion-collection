import os

path = 'C:/Users/omvin/.gemini/antigravity/scratch/RJ-Fashion-Collection/firebase.json'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://js.stripe.com https://*.firebaseio.com https://*.googleapis.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://api.stripe.com https://api.razorpay.com https://images.unsplash.com https://*.google-analytics.com https://analytics.google.com https://wa.me; frame-src 'self' https://checkout.razorpay.com https://js.stripe.com https://*.firebaseapp.com; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"

new_csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://js.stripe.com https://*.firebaseio.com https://*.googleapis.com https://www.gstatic.com https://apis.google.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://accounts.google.com https://api.stripe.com https://api.razorpay.com https://images.unsplash.com https://*.google-analytics.com https://analytics.google.com https://wa.me https://*.firebaseapp.com https://*.web.app; frame-src 'self' https://accounts.google.com https://*.google.com https://checkout.razorpay.com https://js.stripe.com https://*.firebaseapp.com https://*.web.app; frame-ancestors 'self'; object-src 'none'; base-uri 'self';"

if old_csp in content:
    content = content.replace(old_csp, new_csp)
    print("Replaced CSP successfully")
else:
    print("old_csp not found, checking if new_csp already present:", new_csp in content)

# Remove Cross-Origin-Resource-Policy same-origin
for sep in ['\r\n', '\n']:
    old_corp = f"          {{{sep}            \"key\": \"Cross-Origin-Resource-Policy\",{sep}            \"value\": \"same-origin\"{sep}          }},{sep}"
    if old_corp in content:
        content = content.replace(old_corp, '')
        print("Removed Cross-Origin-Resource-Policy same-origin")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished firebase.json updates.")
