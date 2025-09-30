(() => {
    function createHeader() {
        const header = document.createElement('header');
        header.className = 'site-header';
        header.innerHTML = `
      <div class="container">
        <nav class="nav" aria-label="Main">
          <a class="brand" href="index.html">
            <i class="fa-solid fa-building"></i> <span>BlueEstate</span>
          </a>
          <div class="nav-links" role="menubar">
            <a role="menuitem" href="index.html">Home</a>
            <a role="menuitem" href="listings.html">Listings</a>
            <a role="menuitem" href="ask-ai.html">Ask with AI</a>
          </div>
          <div class="nav-actions">
            <button class="hamburger" aria-label="Menu" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
          </div>
        </nav>
        <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
          <a href="index.html">Home</a>
          <a href="listings.html">Listings</a>
          <a href="ask-ai.html">Ask with AI</a>
        </div>
      </div>
    `;
        return header;
    }

    function createFooter() {
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="brand"><i class="fa-solid fa-building"></i> BlueEstate</div>
            <p class="muted">Find your next home with a modern, fast experience.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <div><a href="listings.html">All Listings</a></div>
            <div><a href="ask-ai.html">Ask with AI</a></div>
          </div>
          <div>
            <strong>Contact</strong>
            <div>Email: hello@blueestate.example</div>
          </div>
        </div>
        <div class="copyright">© <span id="year"></span> BlueEstate.</div>
      </div>
    `;
        return footer;
    }

    function createFab() {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.innerHTML = `<i class="fa-solid fa-robot"></i><span>Ask with AI</span>`;
        fab.addEventListener('click', () => {
            window.location.href = 'ask-ai.html';
        });
        return fab;
    }

    function mountLayout() {
        const headerMount = document.getElementById('header');
        const footerMount = document.getElementById('footer');
        const fabMount = document.getElementById('ask-ai-fab');
        if (headerMount) headerMount.replaceWith(createHeader());
        if (footerMount) footerMount.replaceWith(createFooter());
        if (fabMount) fabMount.replaceWith(createFab());
        const year = document.getElementById('year');
        if (year) year.textContent = new Date().getFullYear();

        const hamburger = document.querySelector('.hamburger');
        const mobile = document.getElementById('mobileMenu');
        if (hamburger && mobile) {
            hamburger.addEventListener('click', () => {
                const open = mobile.classList.toggle('open');
                hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
                mobile.setAttribute('aria-hidden', open ? 'false' : 'true');
            });
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        mountLayout();
    } else {
        document.addEventListener('DOMContentLoaded', mountLayout);
    }
})();



