document.addEventListener('DOMContentLoaded', function() {
    const topbar = document.querySelector('.topbar');
    const sidebar = document.querySelector('.sidebar');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        const currentScrollY = window.scrollY;

        if (sidebar.classList.contains('open')) {
            topbar.classList.remove('hidden');
        } else {
            if (currentScrollY > lastScrollY + 10) {
                topbar.classList.add('hidden');
            } else if (currentScrollY < lastScrollY - 10) {
                topbar.classList.remove('hidden');
            }
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    });
});