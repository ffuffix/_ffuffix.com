
window.lightboxInit = function() {
    if (window.lightboxKeyHandler) {
        document.removeEventListener('keydown', window.lightboxKeyHandler);
        window.lightboxKeyHandler = null;
    }

    const Items = Array.from(document.querySelectorAll('.gallery-item'));

    if (!Items.length) return;

    const LightBox = document.getElementById('lightbox');
    const LightBoxImage = document.getElementById('lb-img');
    const LightBoxCaption = document.getElementById('lb-caption');
    const ButtonClose = document.getElementById('lb-close');
    const ButtonNext = document.getElementById('lb-next');
    const ButtonPrev = document.getElementById('lb-prev');

    let Current = 0;

    Items.forEach((item) => {
        const img = item.querySelector('img');
        
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;
            
            img.style.transition = 'none';
            img.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        item.addEventListener('mouseleave', () => {
            img.style.transition = 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)';
            img.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    function Open(index) {
        const Item = Items[index];
        const src = Item.getAttribute('href') || Item.querySelector('img').src;
        const Caption = Item.querySelector('.gallery-caption')?.textContent || '';

        LightBoxImage.src = src;
        LightBoxCaption.textContent = Caption;
        LightBox.setAttribute('aria-hidden', 'false');
        LightBox.classList.add('open');
        LightBox.focus();
        Current = index;
        document.body.style.overflow = 'hidden';
    }

    function Close() {
        LightBox.classList.remove('open');
        LightBox.setAttribute('aria-hidden', 'true');
        setTimeout(() => { LightBoxImage.src = ''; }, 200);
        
        const anchor = Items[Current];
        if (anchor) anchor.focus();
        document.body.style.overflow = '';
    }

    function Next() { Open((Current + 1) % Items.length); }
    function Prev() { Open((Current - 1 + Items.length) % Items.length); }

    Items.forEach((a, i) => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            Open(i);
        });
        a.setAttribute('tabindex', '0');
        a.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                Open(i);
            }
        });
    });


    if(ButtonClose) ButtonClose.addEventListener('click', Close);
    if(ButtonNext) ButtonNext.addEventListener('click', Next);
    if(ButtonPrev) ButtonPrev.addEventListener('click', Prev);


    if(LightBox) {
        LightBox.addEventListener('click', (e) => {
            if (e.target === LightBox) Close();
        });
    }

    window.lightboxKeyHandler = function (e) {
        if (LightBox && LightBox.classList.contains('open')) {
            if (e.key === 'Escape') Close();
            else if (e.key === 'ArrowRight') Next();
            else if (e.key === 'ArrowLeft') Prev();
        }
    };
    document.addEventListener('keydown', window.lightboxKeyHandler);
};


if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.lightboxInit();
} else {
    document.addEventListener('DOMContentLoaded', window.lightboxInit);
}