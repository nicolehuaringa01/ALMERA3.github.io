
    const topBtn = document.getElementById("topBtn");
    if (topBtn) {
        window.onscroll = () => {
            topBtn.style.display = (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? "block" : "none";
        };
        topBtn.onclick = topFunction;
    }

    function topFunction() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }
