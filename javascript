// ===== Dynamic Scooter Background Animation =====
(function() {
  'use strict';

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('scooterCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, dpr;
  let mouseX = 0, mouseY = 0;
  let scrollSpeed = 1;
  let scooters = [];
  const MAX_SCOOTERS = 14;
  const INITIAL_COUNT = 7;

  // Pre-render scooter SVG to offscreen canvas for performance
  const scooterImg = new Image();
  const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='140' viewBox='0 0 220 140'>
    <defs>
      <filter id='glow'><feGaussianBlur stdDeviation='2' result='blur'/><feMerge><feMergeNode in='blur'/><feMergeNode in='SourceGraphic'/></feMerge></filter>
    </defs>
    <g filter='url(%23glow)'>
      <circle cx='55' cy='112' r='16' fill='%23cbd5e1' fill-opacity='.35'/>
      <circle cx='165' cy='112' r='16' fill='%23cbd5e1' fill-opacity='.35'/>
      <circle cx='55' cy='112' r='10' fill='%23334155' fill-opacity='.5'/>
      <circle cx='165' cy='112' r='10' fill='%23334155' fill-opacity='.5'/>
      <rect x='68' y='97' width='82' height='9' rx='5' fill='%23cbd5e1' fill-opacity='.28'/>
      <rect x='140' y='52' width='9' height='55' rx='5' fill='%23cbd5e1' fill-opacity='.28'/>
      <rect x='140' y='45' width='40' height='9' rx='5' fill='%23cbd5e1' fill-opacity='.28'/>
      <circle cx='105' cy='38' r='12' fill='%23cbd5e1' fill-opacity='.30'/>
      <rect x='92' y='50' width='28' height='30' rx='12' fill='%23cbd5e1' fill-opacity='.28'/>
      <rect x='103' y='78' width='10' height='30' rx='6' fill='%23cbd5e1' fill-opacity='.28'/>
      <rect x='88' y='66' width='16' height='9' rx='5' fill='%23cbd5e1' fill-opacity='.28'/>
      <rect x='112' y='66' width='20' height='9' rx='5' fill='%23cbd5e1' fill-opacity='.28'/>
      <rect x='78' y='95' width='22' height='5' rx='3' fill='%23FFD500' fill-opacity='.45'/>
      <circle cx='55' cy='112' r='16' fill='none' stroke='%23FFD500' stroke-opacity='.08' stroke-width='2'/>
      <circle cx='165' cy='112' r='16' fill='none' stroke='%23FFD500' stroke-opacity='.08' stroke-width='2'/>
    </g>
  </svg>`;
  scooterImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Scooter factory
  function createScooter(opts) {
    const depth = opts && opts.depth != null ? opts.depth : 0.3 + Math.random() * 0.7;
    const goingRight = opts && opts.dir != null ? opts.dir : Math.random() > 0.5;
    const speed = (0.4 + depth * 1.2 + Math.random() * 0.5) * (goingRight ? 1 : -1);
    const scale = 0.3 + depth * 0.55;
    const y = opts && opts.y != null ? opts.y : Math.random() * H;
    const x = opts && opts.x != null ? opts.x : (goingRight ? -140 * scale : W + 140 * scale);

    return {
      x: x,
      y: y,
      speed: speed,
      scale: scale,
      depth: depth,
      opacity: 0.06 + depth * 0.14,
      bobPhase: Math.random() * Math.PI * 2,
      bobSpeed: 1.2 + Math.random() * 1.0,
      bobAmp: 2 + depth * 4,
      parallaxFactor: depth * 0.6,
      fadeIn: 0,
      isNew: !!(opts && opts.isNew)
    };
  }

  function initScooters() {
    scooters = [];
    for (let i = 0; i < INITIAL_COUNT; i++) {
      const s = createScooter({
        y: (H * (i + 0.5)) / INITIAL_COUNT + (Math.random() - 0.5) * (H / INITIAL_COUNT * 0.6),
        depth: 0.2 + (i / INITIAL_COUNT) * 0.6 + Math.random() * 0.2,
        x: Math.random() * W
      });
      s.fadeIn = 1;
      scooters.push(s);
    }
    // Sort by depth for proper layering
    scooters.sort(function(a, b) { return a.depth - b.depth; });
  }

  // Draw a single scooter
  function drawScooter(s, dt) {
    // Update position
    var effectiveSpeed = s.speed * scrollSpeed;
    s.x += effectiveSpeed * dt * 60;

    // Bob up/down
    s.bobPhase += s.bobSpeed * dt;
    var bobY = Math.sin(s.bobPhase) * s.bobAmp;

    // Parallax offset based on mouse
    var px = (mouseX - W / 2) * s.parallaxFactor * 0.03;
    var py = (mouseY - H / 2) * s.parallaxFactor * 0.02;

    // Fade in new scooters
    if (s.fadeIn < 1) {
      s.fadeIn = Math.min(1, s.fadeIn + dt * 1.5);
    }

    var drawX = s.x + px;
    var drawY = s.y + bobY + py;
    var drawW = 110 * s.scale;
    var drawH = 70 * s.scale;

    ctx.save();
    ctx.globalAlpha = s.opacity * s.fadeIn;

    // Motion blur effect via slight horizontal stretch
    var blurStretch = Math.abs(effectiveSpeed) * 0.02;
    ctx.translate(drawX, drawY);

    // Flip if going left
    if (s.speed < 0) {
      ctx.scale(-1 - blurStretch, 1);
    } else {
      ctx.scale(1 + blurStretch, 1);
    }

    // Shadow under scooter
    ctx.shadowColor = 'rgba(255, 213, 0, 0.12)';
    ctx.shadowBlur = 12 * s.scale;
    ctx.shadowOffsetY = 8 * s.scale;

    // Draw scooter image
    ctx.drawImage(scooterImg, -drawW / 2, -drawH / 2, drawW, drawH);

    // Subtle glow
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = s.opacity * s.fadeIn * 0.3;
    ctx.shadowColor = 'rgba(255, 213, 0, 0.2)';
    ctx.shadowBlur = 20 * s.scale;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(scooterImg, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // Check if out of bounds and reset
    var margin = 160 * s.scale;
    if (s.speed > 0 && s.x > W + margin) {
      s.x = -margin;
      s.y = Math.random() * H;
      s.fadeIn = 0;
    } else if (s.speed < 0 && s.x < -margin) {
      s.x = W + margin;
      s.y = Math.random() * H;
      s.fadeIn = 0;
    }
  }

  // Ground shadow (ellipse under each scooter)
  function drawGroundShadow(s) {
    if (s.fadeIn < 0.3) return;
    var bobY = Math.sin(s.bobPhase) * s.bobAmp;
    var px = (mouseX - W / 2) * s.parallaxFactor * 0.03;
    var py = (mouseY - H / 2) * s.parallaxFactor * 0.02;
    var drawX = s.x + px;
    var drawY = s.y + py + 35 * s.scale;

    ctx.save();
    ctx.globalAlpha = s.opacity * s.fadeIn * 0.25;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + bobY * 0.3, 30 * s.scale, 6 * s.scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 213, 0, 0.15)';
    ctx.fill();
    ctx.restore();
  }

  // Ambient particles (tiny dots floating for atmosphere)
  var particles = [];
  function initParticles() {
    for (var i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.1 + Math.random() * 0.3,
        opacity: 0.05 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawParticles(dt) {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.speed * dt * 60 * scrollSpeed;
      p.phase += dt * 0.5;
      p.y += Math.sin(p.phase) * 0.2;

      if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD500';
      ctx.fill();
      ctx.restore();
    }
  }

  // Animation loop
  var lastTime = 0;
  function animate(now) {
    if (!lastTime) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    ctx.clearRect(0, 0, W, H);

    // Draw ambient particles
    drawParticles(dt);

    // Draw ground shadows first (behind scooters)
    for (var i = 0; i < scooters.length; i++) {
      drawGroundShadow(scooters[i]);
    }

    // Draw scooters sorted by depth
    for (var j = 0; j < scooters.length; j++) {
      drawScooter(scooters[j], dt);
    }

    // Gradually ease scroll speed back to 1
    if (scrollSpeed > 1) {
      scrollSpeed = Math.max(1, scrollSpeed - dt * 0.4);
    }

    requestAnimationFrame(animate);
  }

  // ===== Interactivity =====

  // Mouse parallax
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Touch parallax for mobile
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  // Click to spawn scooter
  document.addEventListener('click', function(e) {
    // Only spawn if click is on the background area (not on interactive elements)
    if (e.target.closest('input, button, select, .card, a, .live-result-item, .recent-tag, .room-tag, video')) return;

    if (scooters.length < MAX_SCOOTERS) {
      var s = createScooter({
        x: e.clientX,
        y: e.clientY,
        depth: 0.4 + Math.random() * 0.5,
        isNew: true
      });
      scooters.push(s);
      scooters.sort(function(a, b) { return a.depth - b.depth; });
    }
  });

  // Scroll boosts speed
  var scrollTimeout;
  window.addEventListener('scroll', function() {
    scrollSpeed = Math.min(2.5, scrollSpeed + 0.15);
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      // scrollSpeed eases back in animate loop
    }, 200);
  }, { passive: true });

  // Handle resize
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      resize();
    }, 150);
  });

  // Init
  function init() {
    resize();
    initScooters();
    initParticles();
    requestAnimationFrame(animate);
  }

  if (scooterImg.complete) {
    init();
  } else {
    scooterImg.onload = init;
  }
})();

// ===== Application Logic =====
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzy7zzE7R8OUea8JOVKc4wekVhe0Q1gydNOiZiJpKtEK71bC3UFearJzjgtOYVCZQIhrA/exec";

let data = {};
let dataLoaded = false;

// DOM elements
const numberInput = document.getElementById('numberInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const liveResults = document.getElementById('liveResults');
const numberResult = document.getElementById
