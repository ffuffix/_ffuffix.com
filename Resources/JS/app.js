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
    window.router.register('404', templates['404']);

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
    const panels = document.querySelectorAll('.skill-panel, .feature-item, .contact-card');
    
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

// Scroll indicator + topbar scroll state
function initScrollIndicator() {
    const scrollOverlay = document.getElementById('scroll-overlay');
    const topbar = document.querySelector('.topbar');
    const currentPath = window.location.pathname;
    const isHome = currentPath === '/' || currentPath === '/home';
    
    // Only show scroll indicator on home page
    if (scrollOverlay) {
        if (isHome) {
            scrollOverlay.style.display = '';
            scrollOverlay.classList.remove('hidden');
            // Fade in after a short delay (gives hero time to appear)
            setTimeout(() => {
                if (window.scrollY <= 100) {
                    scrollOverlay.classList.add('visible');
                }
            }, 1500);
        } else {
            scrollOverlay.classList.remove('visible');
            scrollOverlay.style.display = 'none';
        }
    }
    
    let ticking = false;
    
    function updateScrollState() {
        const scrollY = window.scrollY;
        
        // Scroll indicator - fade on scroll (home only)
        if (scrollOverlay && isHome) {
            if (scrollY > 100) {
                scrollOverlay.classList.add('hidden');
            } else {
                scrollOverlay.classList.remove('hidden');
            }
        }
        
        // Topbar scroll style
        if (topbar) {
            topbar.classList.toggle('scrolled', scrollY > 20);
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollState);
            ticking = true;
        }
    }, { passive: true });
    
    // Run immediately
    updateScrollState();
}

// Re-initialize animations after route change
document.addEventListener('routeChange', (e) => {
    setTimeout(() => {
        initScrollReveal();
        initSmoothScroll();
        initParallax();
        initScrollIndicator();
        initSkillPanelEffects();
        initCounterAnimation();
        initMagneticButtons();
        updateActiveNav(e.detail.path);
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
        updateActiveNav(window.location.pathname);
    }, 100);
});

// Active nav link highlighting
function updateActiveNav(path) {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        const href = new URL(link.href, window.location.origin).pathname;
        link.classList.toggle('active', href === path || (href === '/' && path === '/'));
    });
}

// Canvas Manager - handles canvas initialization per route
function initCanvas(path) {
    // Safety check - force visible if no shader loads within 1s
    setTimeout(() => {
        document.body.classList.add('shader-ready');
    }, 1000);

    const isHome = path === '/' || path === '/home';
    const isStaircase = path === '/staircase';
    const isContact = path === '/contact';

    // Home Shader (Singularity)
    const homeCanvas = document.getElementById('singularity-canvas');
    if (homeCanvas && window.SingularityShader && isHome) {
        if (!window.homeShaderInstance) {
            window.homeShaderInstance = new SingularityShader(homeCanvas);
        }
    } 
    
    // Staircase Shader
    const staircaseCanvas = document.getElementById('staircase-canvas');
    if (staircaseCanvas && window.SingularityShader && isStaircase) {
         new SingularityShader(staircaseCanvas);
    }
    
    // Contact Shader
    const contactCanvas = document.getElementById('contact-canvas');
    if (contactCanvas && window.ContactShader && isContact) {
        new ContactShader(contactCanvas);
    }

    // fallback for pages without shaders (like 404 or others)
    if (!isHome && !isStaircase && !isContact) {
        document.body.classList.add('shader-ready');
    }
}

// Hook into route change
document.addEventListener('routeChange', (e) => {
    initCanvas(e.detail.path);
});

// Also run on load
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    initCanvas(path);
});
