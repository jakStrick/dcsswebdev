
//boiler plate header for all html pages.
const navTemplate = document.createElement('template');

navTemplate.innerHTML = `
    <link rel="stylesheet" href="assets/css/navigation-styles.css">
    <div class="ham-menu-grid">
        <div class="ham-label-wrapper hlw">
            <label class="ham-label hlw" for="nav-toggled">
                <span></span>
            </label>
        </div>
        <div class="ham-logo">
            <a href="index.html">
                <!-- insert Image here -->
            </a>
        </div>
    </div>
    <div>
        <input type="checkbox" name="checkbox" id="nav-toggled" class="nav-check">
        <nav class="nav-links-grid">
            <div class="logo-main">
                <a href="index.html">
                <!-- insert Image here -->
                </a>
            </div>
            <div class="nav-links">
                <a href="index.html">Home</a>
            </div>   
            <div class="nav-links">
                <a href="#">About</a>
                <div class="dropdown">
                    <ul>
                        <li class="dropdown-link">
                            <a href="about.html">About Me</a>
                        </li>
                        <li class="dropdown-link">
                            <a href="/files/software.pdf">Resume</a>
                        </li>
                        <li class="dropdown-link">
                            <a href="contact.html">Contact Me</a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="nav-links">
                <a href="projects.html">Projects</a>
            </div>
            <div class="nav-links">
                <a href="contact.html">Contact</a>
            </div>
        </nav>
    </div>
    `
class Nav extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        const shadowRoot = this.attachShadow({ mode: 'closed' });
    
        shadowRoot.appendChild(navTemplate.content);
    }
}
          
customElements.define('navigation-component', Nav);

//boiler plate footer for all html pages.
const footerTemplate = document.createElement('template');

footerTemplate.innerHTML = `
    <!-- Footer/Social Pages -->
    <link rel="stylesheet" href="assets/css/header-footer-styles.css">
    <div>
        <span class="separator-thin"></span>
    </div>
    <footer class="section-footer">
        
        <div class="logo-main">
            <a href="index.html">
            <!-- insert Image here -->
            </a>
        </div>
        <div class="footer-links">
            <ul class="quick-link">
                <h3 class="ft-header">Quick Links</h3>
                <li class="info-links">
                    <a href="#">Events</a>
                </li>
                <li class="quick-link">
                    <a href="#">Meeting Minutes</a>
                </li>
                <li class="quick-link">
                    <a href="#">Support</a>
                </li>
            </ul>
        </div>

        <div>
            <span class="footer-line-thin"></span>
        </div>

        <div class="social">
            <ul class="quick-link">
                <h3 class="ft-header">Follow Us</h3>
                <li class="social-link">
                    Facebook
                </li>
                <li class="social-link">
                    Instagram
                </li>
                <li class="social-link">
                    YouTube
                </li>
            </ul>
        </div>

        <div>
            <span class="footer-line-thin"></span>
        </div>

        <div class="contact">
            <ul class="contact-info">
                <h3 class="ft-header">Contact</h3>
                <li class="f-info f-1">
                    1201 Texas Avenue, Suite A <br> Vernonia, OR 97064
                </li>
                <li class="f-info f-2">
                    Phone: (503) 429-0869
                </li>
                <li class="f-info f-3">
                    Email: info@unwc.com
                </li>
            </ul>
        </div>
    </footer>
    <span class="horizontal-line-thin"></span>
    <div class="copywright">
        <h3>&copyUNWC 2022</h3>
    </div>
    <div class="developer">
        Developed by:<br>
        David Strickland - Mar 2022<br>
        Website: <a href="www.jakspage.com">www.jakspage.com</a>
    </div>
    `
class Footer extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        const shadowRoot = this.attachShadow({ mode: 'closed' });
    
        shadowRoot.appendChild(footerTemplate.content);
    }
}
                
customElements.define('footer-component', Footer);
        