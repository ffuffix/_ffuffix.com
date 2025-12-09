document.addEventListener('DOMContentLoaded', function () {
    const Sidebar = document.getElementById('sidebar');
    const ToggleButton = document.getElementById('sidebar-toggle-button');
    const OpenIcon = document.getElementById('sidebar-open-icon');
    const CloseIcon = document.getElementById('sidebar-close-icon');
    const MainContent = document.getElementById('main-content');
    const Overlay = document.getElementById('sidebar-overlay');

    function SET_SIDEBAR_STATE(Open) {
        localStorage.setItem('sidebar', Open ? 'true' : 'false');
    }

    function TOGGLE_SIDEBAR() {
        const Open = Sidebar.classList.contains('open');

        if (Open) {
            Sidebar.classList.remove('open');
            OpenIcon.style.display = 'inline-block';
            CloseIcon.style.display = 'none';
        } else {
            Sidebar.classList.add('open');
            OpenIcon.style.display = 'none';
            CloseIcon.style.display = 'inline-block';
        }

        SET_SIDEBAR_STATE(!Open);
    }

    ToggleButton.addEventListener('click', TOGGLE_SIDEBAR);
    Overlay.addEventListener('click', TOGGLE_SIDEBAR);

    const savedState = localStorage.getItem('sidebar');

    if (savedState !== null) {
        if (savedState === 'true') {
            TOGGLE_SIDEBAR();
        }
    }
});