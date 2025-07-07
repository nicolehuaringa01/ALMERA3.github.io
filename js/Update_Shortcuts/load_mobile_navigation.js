document.addEventListener('DOMContentLoaded', function() {
    const mobileNavPlaceholder = document.getElementById('mobile-nav-placeholder');

    if (mobileNavPlaceholder) {
        fetch('mobile_navbar.html') // Path to your mobile navigation HTML file
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                mobileNavPlaceholder.innerHTML = data;
                // Re-attach event listeners for mobile menu button after content is loaded
                const mobileMenuButton = document.getElementById('mobile-menu-button');
                const closeMobileMenuButton = document.getElementById('close-mobile-menu');
                const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

                if (mobileMenuButton && mobileMenuOverlay) {
                    mobileMenuButton.addEventListener('click', () => {
                        mobileMenuOverlay.classList.remove('hidden');
                        mobileMenuOverlay.querySelector('nav').classList.remove('translate-x-full');
                    });
                }

                if (closeMobileMenuButton && mobileMenuOverlay) {
                    closeMobileMenuButton.addEventListener('click', () => {
                        mobileMenuOverlay.querySelector('nav').classList.add('translate-x-full');
                        mobileMenuOverlay.classList.add('hidden');
                    });
                }
            })
            .catch(error => {
                console.error('Error loading mobile navigation:', error);
                mobileNavPlaceholder.innerHTML = '<p>Error loading mobile navigation.</p>';
            });
    }
});
