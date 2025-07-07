document.addEventListener('DOMContentLoaded', function() {
    const navPlaceholder = document.getElementById('main-nav-placeholder');

    if (navPlaceholder) {
        fetch('navbar.html') // Path to your navigation HTML file
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                navPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                navPlaceholder.innerHTML = '<p>Error loading navigation.</p>'; // Fallback content
            });
    }
});
