// JavaScript for Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const mobileMenuNav = mobileMenuOverlay.querySelector('nav');
        const closeMobileMenuButton = document.getElementById('close-mobile-menu');

        mobileMenuButton.addEventListener('click', () => {
            mobileMenuOverlay.classList.remove('hidden');
            setTimeout(() => {
                mobileMenuNav.classList.remove('translate-x-full');
            }, 10); // Small delay for transition to work
        });

        closeMobileMenuButton.addEventListener('click', () => {
            mobileMenuNav.classList.add('translate-x-full');
            setTimeout(() => {
                mobileMenuOverlay.classList.add('hidden');
            }, 300); // Match transition duration
        });

        // Close mobile menu when a link is clicked
        mobileMenuNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuNav.classList.add('translate-x-full');
                setTimeout(() => {
                    mobileMenuOverlay.classList.add('hidden');
                }, 300);
            });
        });

        // JavaScript for Scroll-Reveal Animation
        const scrollRevealElements = document.querySelectorAll('.scroll-reveal');

        const observerOptions = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // element is 10% visible
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once visible
                }
            });
        }, observerOptions);

        scrollRevealElements.forEach(el => {
            observer.observe(el);
        });

        // JavaScript for active navigation link highlighting (for desktop nav)
        document.addEventListener('DOMContentLoaded', () => {
            const desktopNavLinks = document.querySelectorAll('header nav a');
            const sections = document.querySelectorAll('main section[id]');

            const highlightNavLink = () => {
                let currentActive = null;
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - document.querySelector('header').offsetHeight; // Account for fixed header
                    const sectionBottom = sectionTop + section.offsetHeight;

                    if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                        currentActive = section.getAttribute('id');
                    }
                });

                desktopNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentActive}`) {
                        link.classList.add('active');
                    }
                });
            };

            window.addEventListener('scroll', highlightNavLink);
            highlightNavLink(); // Initial call to set active link on load
        });
