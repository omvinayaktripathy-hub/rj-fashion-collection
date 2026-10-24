with open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div class="our-story-grid">',
    '<div class="our-story-grid motion-reveal">'
)
content = content.replace(
    '<div class="our-story-img-wrap">',
    '<div class="our-story-img-wrap motion-fade-left">'
)
content = content.replace(
    '<div class="our-story-text-wrap">',
    '<div class="our-story-text-wrap motion-fade-right">'
)
content = content.replace(
    '<div class="grand-campaign-strip">',
    '<div class="grand-campaign-strip motion-scale-in">'
)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated index.html with directional motion classes!')
