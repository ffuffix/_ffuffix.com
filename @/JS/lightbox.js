(function () {
        const Items = Array.from(document.querySelectorAll('.gallery-item'));
        if (!Items.length) return;

        const LightBox = document.getElementById('lightbox');
        const LightBoxImage = document.getElementById('lb-img');
        const LightBoxCaption = document.getElementById('lb-caption');
        const ButtonClose = document.getElementById('lb-close');
        const ButtonNext = document.getElementById('lb-next');
        const ButtonPrev = document.getElementById('lb-prev');

        let Current = 0;

        function Open(index) {
            const Item = Items[index];
            const src = Item.getAttribute('href') || Item.querySelector('img').src;
            const alt = Item.querySelector('img').alt || '';
            const Caption = Item.querySelector('.gallery-caption')?.textContent || '';

            LightBoxImage.src = src;
            LightBoxImage.alt = alt;
            LightBoxCaption.textContent = Caption;
            LightBox.setAttribute('aria-hidden', 'false');
            LightBox.classList.add('open');
            LightBox.focus();
            Current = index;
        }

        function Close() {
            LightBox.classList.remove('open');
            LightBox.setAttribute('aria-hidden', 'true');
            LightBoxImage.src = '';
            // focus to clicked item
            const anchor = Items[Current];
            if (anchor) anchor.focus();
        }

        function Next() {
            Open((Current + 1) % Items.length);
        }

        function Prev() {
            Open((Current - 1 + Items.length) % Items.length);
        }

        Items.forEach((a, i) => {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                Open(i);
            });
            // keyboard-focusable as interactive element
            a.setAttribute('tabindex', '0');
            a.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    Open(i);
                }
            });
        });

        ButtonClose.addEventListener('click', Close);
        ButtonNext.addEventListener('click', Next);
        ButtonPrev.addEventListener('click', Prev);

        // when clicking outside the content
        LightBox.addEventListener('click', function (e) {
            if (e.target === LightBox) Close();
        });

        document.addEventListener('keydown', function (e) {
            if (LightBox.classList.contains('open')) {
                if (e.key === 'Escape') Close();
                else if (e.key === 'ArrowRight') Next();
                else if (e.key === 'ArrowLeft') Prev();
            }
        });
    })();