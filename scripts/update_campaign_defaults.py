import sqlite3

# 1. Update server.js
with open('server.js', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("'A New Era of Style Begins.'", "'STYLE, REDEFINED.'")
c = c.replace("'Discover your style. Elevate every moment.'", "'A considered collection. A contemporary point of view. Discover the signature style of RJ Fashion Collection.'")
c = c.replace("'GRAND OPENING'", "'RJ FASHION COLLECTION'")
c = c.replace("THE GRAND OPENING — COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ", "INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ")
c = c.replace("'Explore the Collection'", "'EXPLORE THE COLLECTION'")
c = c.replace("'Discover What\\'s New'", "'DISCOVER OUR STORY'")

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated server.js default campaign!")

# 2. Update database
conn = sqlite3.connect('database/database.sqlite')
cursor = conn.cursor()
cursor.execute('''
  UPDATE homepage_campaign SET
    announcement_text = 'INTRODUCING THE NEW RJ FASHION COLLECTION • COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | CODE: GRANDRJ',
    hero_headline = 'STYLE, REDEFINED.',
    hero_subtitle = 'A considered collection. A contemporary point of view. Discover the signature style of RJ Fashion Collection.',
    hero_badge = 'RJ FASHION COLLECTION',
    hero_cta_primary = 'EXPLORE THE COLLECTION',
    hero_cta_secondary = 'DISCOVER OUR STORY'
  WHERE id = 1
''')
conn.commit()
print("Updated homepage_campaign sqlite table rows:", cursor.rowcount)
conn.close()
