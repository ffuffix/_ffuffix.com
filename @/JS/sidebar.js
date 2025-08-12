document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const navbarHiddenIcon = document.getElementById('navbar-hidden-icon');
    const navbarShownIcon = document.getElementById('navbar-shown-icon');
    const main = document.querySelector('main');

    function hideNavbar() {
        navbar.classList.add('hidden');
        navbarHiddenIcon.style.display = 'none';
        navbarShownIcon.style.display = 'inline';
        if (main) main.style.marginLeft = '0';
    }

    function showNavbar() {
        navbar.classList.remove('hidden');
        navbarHiddenIcon.style.display = 'inline';
        navbarShownIcon.style.display = 'none';
        if (main) main.style.marginLeft = '220px';
    }

    navbarHiddenIcon.addEventListener('click', hideNavbar);
    navbarShownIcon.addEventListener('click', showNavbar);
});
