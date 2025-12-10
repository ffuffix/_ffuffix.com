
class Router {
    constructor() {
        this.routes = {};
        this.currentPath = '';
        this.init();
    }

    register(path, template) {
        this.routes[path] = template;
    }

    async init() {
        this.handleNavigation();
        window.addEventListener('popstate', () => this.handleNavigation());

        // Intercept links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.hasAttribute('target')) {
                e.preventDefault();
                const path = new URL(link.href, window.location.origin).pathname;
                this.navigate(path);
            }
        });
    }

    navigate(path) {
        if (path === this.currentPath) return;

        // Close sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            const toggleButton = document.getElementById('sidebar-toggle-button');
            if (toggleButton) toggleButton.click();
        }

        this.currentPath = path;
        window.history.pushState({ path }, '', path);
        this.render();
    }

    handleNavigation() {
        let path = window.location.pathname;
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        this.currentPath = path;
        this.render();
    }

    render() {
        const path = this.currentPath === '/' ? '/' : this.currentPath;

        const template = this.routes[path] || this.routes['404'];

        if (!template) return;

        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = template;
            this.reinitializeScripts(path);
        }
    }

    reinitializeScripts(path) {
        // 1. Reinitialize Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // 2. Reinitialize Lightbox
        // We wait a tiny bit to ensure the DOM is ready
        requestAnimationFrame(() => {
            if (typeof window.lightboxInit === 'function') {
                window.lightboxInit();
            }
        });
    }
}

window.router = new Router();