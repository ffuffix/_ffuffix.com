// initialization and route setup
(async function() {
    const templates = {};

    try {
        const homeResponse = await fetch('/Resources/Templates/home.html');
        templates['/'] = await homeResponse.text();

        const artResponse = await fetch('/Resources/Templates/art.html');
        templates['/art'] = await artResponse.text();

        const staircaseResponse = await fetch('/Resources/Templates/staircase.html');
        templates['/staircase'] = await staircaseResponse.text();

        const contactResponse = await fetch('/Resources/Templates/contact.html');
        templates['/contact'] = await contactResponse.text();

        const notFoundResponse = await fetch('/Resources/Templates/404.html');
        templates['404'] = await notFoundResponse.text();
    } catch (error) {
        console.error('Error loading templates:', error);
        return;
    }

    window.router.register('/', templates['/']);
    window.router.register('/staircase', templates['/staircase']);
    window.router.register('/art', templates['/art']);
    window.router.register('/contact', templates['/contact']);
    //window.router.register('404', templates['404']);

    window.router.handleNavigation();
})();

// Scroll Reveal Animation
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });
    
    reveals.forEach(el => observer.observe(el));
}

// Interactive skill panels - mouse tracking glow
function initSkillPanelEffects() {
    const panels = document.querySelectorAll('.skill-panel');
    
    panels.forEach(panel => {
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            panel.style.setProperty('--mouse-x', `${x}%`);
            panel.style.setProperty('--mouse-y', `${y}%`);
        });
    });
}

// Metric cards counter animation
function initCounterAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const text = entry.target.textContent;
                
                // Only animate if it's a number
                if (/^\d+\+?$/.test(text)) {
                    const target = parseInt(text);
                    const suffix = text.includes('+') ? '+' : '';
                    let current = 0;
                    const increment = target / 30;
                    const duration = 1500;
                    const stepTime = duration / 30;
                    
                    entry.target.textContent = '0' + suffix;
                    
                    const counter = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            entry.target.textContent = target + suffix;
                            clearInterval(counter);
                        } else {
                            entry.target.textContent = Math.floor(current) + suffix;
                        }
                    }, stepTime);
                }
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(el => observer.observe(el));
}

// Magnetic button effect
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.cta-button');
    
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translate(0, 0)';
        });
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Parallax effect for hero glows
function initParallax() {
    const glows = document.querySelectorAll('.hero-glow');
    
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        
        glows.forEach((glow, i) => {
            const speed = (i + 1) * 15;
            glow.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });
}

// Scroll indicator auto-hide
function initScrollIndicator() {
    const scrollOverlay = document.getElementById('scroll-overlay');
    if (!scrollOverlay) return;
    
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function updateScrollIndicator() {
        if (window.scrollY > 100) {
            scrollOverlay.classList.add('hidden');
        } else {
            scrollOverlay.classList.remove('hidden');
        }
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollIndicator);
            ticking = true;
        }
    }, { passive: true });
}

// Re-initialize animations after route change
document.addEventListener('routeChange', () => {
    setTimeout(() => {
        initScrollReveal();
        initSmoothScroll();
        initParallax();
        initScrollIndicator();
        initSkillPanelEffects();
        initCounterAnimation();
        initMagneticButtons();
    }, 100);
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initScrollReveal();
        initSmoothScroll();
        initParallax();
        initScrollIndicator();
        initSkillPanelEffects();
        initCounterAnimation();
        initMagneticButtons();
    }, 100);
});
