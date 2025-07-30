document.addEventListener('DOMContentLoaded', function() {
    const topBtn = document.getElementById("topBtn");

    // Only proceed if the button exists on the page
    if (topBtn) {
        // Function to show/hide the button based on scroll position
        window.onscroll = () => {
            // Check both document.body.scrollTop (for Safari) and document.documentElement.scrollTop (for Chrome, Firefox, IE, Opera)
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                topBtn.style.display = "block";
            } else {
                topBtn.style.display = "none";
            }
        };

        // Function to scroll to the top of the document
        topBtn.onclick = function() {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        };
    }
});
