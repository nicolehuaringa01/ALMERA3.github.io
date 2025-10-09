// ALMERA_in_Data/components/navigation/load_navigation.js

// Function to load HTML content into a placeholder
function loadHTML(selector, filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            document.querySelector(selector).innerHTML = html;

            // Optional: Add logic to highlight the current page's nav link
            const currentPath = window.location.pathname.split('/').pop();
            const navLinks = document.querySelectorAll('#navigation-placeholder .nav-buttons a');
            navLinks.forEach(link => {
                if (link.getAttribute('href') === currentPath) {
                    link.classList.add('active-nav-link'); // Add a class for styling
                }
            });
        })
        .catch(e => console.error('Error loading HTML snippet:', e)); // More generic error message
}

// Load the navigation when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadHTML('#navigation-placeholder', '../components/navigation/navigation.html');
});
