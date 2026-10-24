import os

BASE_DIR = r"C:\Users\omvin\.gemini\antigravity\scratch\RJ-Fashion-Collection"

def update_cart_js():
    path = os.path.join(BASE_DIR, "public", "js", "cart.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace(
        "const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');",
        "const local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');"
    )
    content = content.replace(
        "let local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');",
        "let local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');"
    )
    content = content.replace(
        "localStorage.setItem('rjfc_local_cart', JSON.stringify(local));",
        "if (typeof saveLocalCartSafe === 'function') { saveLocalCartSafe(local); } else { localStorage.setItem('rjfc_local_cart', JSON.stringify(local)); }"
    )

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated cart.js to use getLocalCartSafe & saveLocalCartSafe!")

def update_delivery_js():
    path = os.path.join(BASE_DIR, "public", "js", "delivery.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace(
        "const local = JSON.parse(localStorage.getItem('rjfc_local_cart') || '[]');",
        "const local = typeof getLocalCartSafe === 'function' ? getLocalCartSafe() : JSON.parse(localStorage.getItem('rjfc_local_cart') || sessionStorage.getItem('rjfc_local_cart') || '[]');"
    )

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    print("Updated delivery.js to use safe cart reader!")

if __name__ == '__main__':
    update_cart_js()
    update_delivery_js()
