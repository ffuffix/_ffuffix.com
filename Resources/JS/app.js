// initialization and route setup
(async function() {
    const templates = {};

    try {
        // Load home template
        const homeResponse = await fetch('Resources/Templates/home.html');
        templates['/'] = await homeResponse.text();

        // Load art template
        const artResponse = await fetch('Resources/Templates/art.html');
        templates['/art'] = await artResponse.text();

        // Load contact template
        const contactResponse = await fetch('Resources/Templates/contact.html');
        templates['/contact'] = await contactResponse.text();

        // Load 404 template
        const notFoundResponse = await fetch('Resources/Templates/404.html');
        templates['404'] = await notFoundResponse.text();
    } catch (error) {
        console.error('Error loading templates:', error);
        return;
    }

    window.router.register('/', templates['/']);
    window.router.register('/art', templates['/art']);
    window.router.register('/contact', templates['/contact']);
    window.router.register('404', templates['404']);

    window.router.handleNavigation();
})();
