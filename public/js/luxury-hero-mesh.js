/**
 * RJ FASHION COLLECTION — LUXURY HERO AMBIENT MESH & PARALLAX ENGINE
 * Interactive ambient glowing fluid wave canvas, 3D mouse parallax & ripple physics.
 */

(function () {
  'use strict';

  function initLuxuryHeroMesh() {
    const canvas = document.getElementById('hero-fluid-mesh-canvas');
    const heroSection = document.getElementById('luxury-hero-section');
    if (!canvas || !heroSection) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let width = (canvas.width = heroSection.offsetWidth);
    let height = (canvas.height = heroSection.offsetHeight);

    function resize() {
      if (!canvas || !heroSection) return;
      width = canvas.width = heroSection.offsetWidth;
      height = canvas.height = heroSection.offsetHeight;
    }
    window.addEventListener('resize', resize, { passive: true });

    let step = 0;
    function render() {
      step += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Deep dark luxury background
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#0d0d0f');
      baseGrad.addColorStop(0.5, '#121217');
      baseGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Glowing Champagne & Gold Fluid Orbs
      const orb1X = width * 0.72 + Math.sin(step) * 50;
      const orb1Y = height * 0.42 + Math.cos(step * 0.8) * 40;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, Math.min(width * 0.45, 420));
      grad1.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
      grad1.addColorStop(0.5, 'rgba(197, 168, 128, 0.08)');
      grad1.addColorStop(1, 'rgba(13, 13, 15, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(orb1X, orb1Y, Math.min(width * 0.45, 420), 0, Math.PI * 2);
      ctx.fill();

      const orb2X = width * 0.22 + Math.cos(step * 0.7) * 55;
      const orb2Y = height * 0.68 + Math.sin(step * 0.9) * 45;
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, Math.min(width * 0.4, 360));
      grad2.addColorStop(0, 'rgba(189, 164, 119, 0.12)');
      grad2.addColorStop(0.6, 'rgba(112, 0, 55, 0.06)');
      grad2.addColorStop(1, 'rgba(13, 13, 15, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(orb2X, orb2Y, Math.min(width * 0.4, 360), 0, Math.PI * 2);
      ctx.fill();

      // Fluid Wave Ribbons
      ctx.beginPath();
      ctx.moveTo(0, height * 0.58);
      for (let x = 0; x <= width; x += 25) {
        const y = height * 0.58 + Math.sin(x * 0.0028 + step) * 26 + Math.cos(x * 0.0055 + step * 1.1) * 14;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    }
    render();

    // 3D Mouse Parallax Tracking
    const modelFrame = document.querySelector('.hero-model-arched-frame');
    const badgeKundan = document.querySelector('.card-kundan');
    const badgeHandloom = document.querySelector('.card-handloom');

    if (modelFrame && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let targetX = 0, targetY = 0;
      let curX = 0, curY = 0;

      heroSection.addEventListener('mousemove', function (e) {
        const rect = heroSection.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        targetX = (e.clientX - centerX) / (rect.width / 2);
        targetY = (e.clientY - centerY) / (rect.height / 2);
      }, { passive: true });

      heroSection.addEventListener('mouseleave', function () {
        targetX = 0;
        targetY = 0;
      });

      function updateParallax() {
        curX += (targetX - curX) * 0.08;
        curY += (targetY - curY) * 0.08;

        const rotX = -curY * 6;
        const rotY = curX * 6;
        modelFrame.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        if (badgeKundan) {
          badgeKundan.style.transform = `translate3d(${curX * 14}px, ${curY * 12}px, 20px)`;
        }
        if (badgeHandloom) {
          badgeHandloom.style.transform = `translate3d(${-curX * 16}px, ${-curY * 14}px, 20px)`;
        }

        requestAnimationFrame(updateParallax);
      }
      requestAnimationFrame(updateParallax);
    }

    // Ripple click interaction for CTA
    document.querySelectorAll('.hero-cta-gold, .ripple-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        ripple.className = 'hero-btn-ripple';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLuxuryHeroMesh);
  } else {
    initLuxuryHeroMesh();
  }
})();
