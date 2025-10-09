// ALMERA_in_Data/2020/components/utility.js

// Scroll to Top button logic
const topBtn = document.getElementById("topBtn");

// Check if the button exists before trying to add event listener
if (topBtn) {
    window.onscroll = () => {
        topBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none";
    };
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
