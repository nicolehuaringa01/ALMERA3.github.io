// Main/components/Navigation/load_mobile_navigation.js
document.addEventListener('DOMContentLoaded', function() {
    const mobileNavPlaceholder = document.getElementById('mobile-nav-placeholder');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    if (mobileNavPlaceholder && mobileMenuButton && mobileMenuOverlay) {
        fetch('../js/Update_Shortcuts/mobile_navigation.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load mobile navigation: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                mobileNavPlaceholder.innerHTML = data;

                // --- START: Moved code from Welcome_Page_Style.js ---
                const mobileMenuNav = mobileMenuOverlay.querySelector('nav');
                const closeMobileMenuButton = document.getElementById('close-mobile-menu'); // This element should now exist

                // Ensure elements exist before adding listeners
                if (mobileMenuNav && closeMobileMenuButton) {
                    mobileMenuButton.addEventListener('click', () => {
                        mobileMenuOverlay.classList.remove('hidden');
                        // Add Tailwind classes for the slide-in effect
                        mobileMenuOverlay.classList.add('flex', 'justify-end'); // Or 'items-center' if your overlay is full height and needs content centered
                        mobileMenuNav.classList.remove('translate-x-full'); // Remove the initial hidden state
                        mobileMenuNav.classList.add('translate-x-0'); // Slide in
                    });

                    closeMobileMenuButton.addEventListener('click', () => {
                        mobileMenuNav.classList.remove('translate-x-0'); // Slide out
                        mobileMenuNav.classList.add('translate-x-full');
                        setTimeout(() => {
                            mobileMenuOverlay.classList.add('hidden');
                            mobileMenuOverlay.classList.remove('flex', 'justify-end'); // Clean up display properties
                        }, 300); // Match transition duration
                    });

                    // Close mobile menu when a link is clicked
                    mobileMenuNav.querySelectorAll('a').forEach(link => {
                        link.addEventListener('click', () => {
                            mobileMenuNav.classList.remove('translate-x-0'); // Slide out
                            mobileMenuNav.classList.add('translate-x-full');
                            setTimeout(() => {
                                mobileMenuOverlay.classList.add('hidden');
                                mobileMenuOverlay.classList.remove('flex', 'justify-end'); // Clean up display properties
                            }, 300);
                        });
                    });
                } else {
                    console.warn("Mobile navigation elements not found after loading mobile_navigation.html.");
                }
                // --- END: Moved code from Welcome_Page_Style.js ---

            })
            .catch(error => console.error('Error loading mobile navigation:', error));
    }
});
