// Floating points with connecting lines background
const POINTS = 40;
const MAX_DIST = 220;
const POINT_RADIUS = 2.5;
const SPEED = 0.25;
let points = [];
let canvas, ctx, width, height;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function createPoints() {
  points = [];
  for (let i = 0; i < POINTS; ++i) {
    points.push({
      x: randomBetween(0, width),
      y: randomBetween(0, height),
      vx: randomBetween(-SPEED, SPEED),
      vy: randomBetween(-SPEED, SPEED)
    });
  }
}

function animatePoints() {
  ctx.clearRect(0, 0, width, height);
  // Draw lines
  for (let i = 0; i < points.length; ++i) {
    for (let j = i + 1; j < points.length; ++j) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        ctx.save();
        ctx.globalAlpha = 1 - dist / MAX_DIST;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  // Draw points
  for (const p of points) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(p.x, p.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
  // Move points
  for (const p of points) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
  }
  requestAnimationFrame(animatePoints);
}

function setupBgPoints() {
  let bg = document.getElementById('bg-circles');
  if (bg) bg.remove();
  canvas = document.createElement('canvas');
  canvas.id = 'bg-points';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  document.body.prepend(canvas);
  ctx = canvas.getContext('2d');
  resizeCanvas();
  createPoints();
  window.addEventListener('resize', () => {
    resizeCanvas();
    createPoints();
  });
  animatePoints();
}

document.addEventListener('DOMContentLoaded', setupBgPoints);
