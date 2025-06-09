// fetches HTML components and injects them into the DOM

document.addEventListener('DOMContentLoaded', function() {
    const Components = document.querySelectorAll('[c]');
    
    Components.forEach(async Component => {
        const Name = Component.getAttribute('c');
        try {
            const Response = await fetch(`/Components/${Name}.html`);
            const HTML = await Response.text();
            Component.innerHTML = HTML;
        } catch (error) {
            console.error(`Couldn't load ${Name}:`, error);
        }
    });
});