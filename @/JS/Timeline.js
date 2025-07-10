document.addEventListener('DOMContentLoaded', function() {
    const timeline = document.querySelector('.timeline');
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    if (timeline) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    timeline.classList.add('visible');
                }
            });
        }, options);

        timelineObserver.observe(timeline);
    }

    if (timelineItems.length) {
        const itemObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, options);

        timelineItems.forEach(item => {
            itemObserver.observe(item);
        });
    }
});
