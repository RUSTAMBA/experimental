// --- КОНФИГУРАЦИЯ ---
const SHEET_URL = "ТВОЯ_ССЫЛКА_НА_GOOGLE_SCRIPT";
const canvas = document.getElementById('scooterCanvas');
const ctx = canvas.getContext('2d');

let scooters = [];
let mouseX = 0, mouseY = 0;

// --- АНИМАЦИЯ ФОНА ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Scooter {
    constructor() {
        this.init();
    }

    init() {
        this.z = Math.random(); // Глубина (0 - далеко, 1 - близко)
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 30 + this.z * 60;
        this.speed = (0.2 + this.z * 0.8) * (Math.random() > 0.5 ? 1 : -1);
        this.opacity = 0.1 + this.z * 0.2;
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.speed;
        this.angle += 0.02;
        
        if (this.x > canvas.width + 100) this.x = -100;
        if (this.x < -100) this.x = canvas.width + 100;
    }

    draw() {
        const bobbing = Math.sin(this.angle) * 10;
        const driftX = (mouseX - canvas.width / 2) * (this.z * 0.05);
        const driftY = (mouseY - canvas.height / 2) * (this.z * 0.05);

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = "#FFD500";
        ctx.shadowBlur = 15 * this.z;
        ctx.shadowColor = "#FFD500";
        
        // Рисуем упрощенный силуэт самоката
        ctx.translate(this.x + driftX, this.y + driftY + bobbing);
        ctx.fillRect(0, 0, this.size, this.size / 8); // Платформа
        ctx.fillRect(this.size * 0.8, -this.size / 2, this.size / 15, this.size / 2); // Руль
        
        ctx.restore();
    }
}

function setupAnimation() {
    resize();
    for (let i = 0; i < 15; i++) scooters.push(new Scooter());
    animate();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scooters.forEach(s => {
        s.update();
        s.draw();
    });
    requestAnimationFrame(animate);
}

// --- ИНТЕРФЕЙС ---
window.addEventListener('resize', resize);
window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Запуск при загрузке
setupAnimation();
