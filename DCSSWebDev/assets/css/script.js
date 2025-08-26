/*!! Template and interaction scripts for website !!*/
/*!! Developed by [David Strickland August 2025] !!*/

class WebsiteController {
  constructor() {
    this.initializeOnDOMContentLoaded();
  }

  // Initialize all functionality when DOM is ready
  initializeOnDOMContentLoaded() {
    document.addEventListener("DOMContentLoaded", () => {
      this.loadTemplates().then(() => {
        this.initializeNavigation();
        this.initializeScrollAnimations();
        this.initializeSmoothScrolling();
        this.initializeContactForm();
      });
    });
  }

  // Load navbar and banner templates
  async loadTemplates() {
    const pageName = document.body.getAttribute("page-data");

    try {
      await Promise.all([this.loadNavbar(), this.loadBanner(pageName)]);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  }

  async loadNavbar() {
    try {
      const response = await fetch("./assets/templates/navbar.html");
      const html = await response.text();

      const placeholder = document.getElementById("navbar-placeholder");
      if (placeholder) {
        placeholder.innerHTML = html;
      }
    } catch (error) {
      console.error("Failed to load navbar:", error);
    }
  }

  async loadBanner(pageName) {
    try {
      const templatePath =
        pageName === "index"
          ? "./assets/templates/index-banner.html"
          : "./assets/templates/banner.html";

      const response = await fetch(templatePath);
      let html = await response.text();

      // Add correct page title if not loading the index page
      if (pageName !== "index") {
        html = html.replace("{{PAGE_TITLE}}", this.capitalize(pageName));
      }

      const placeholder = document.getElementById("banner-placeholder");
      if (placeholder) {
        placeholder.innerHTML = html;
      }
    } catch (error) {
      console.error("Failed to load banner:", error);
    }
  }

  // Initialize mobile navigation hamburger menu
  initializeNavigation() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        //alert("Hamburger clicked");
        //console.log("Hamburger clicked");
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
      });
    }
  }

  // Initialize scroll animations for elements
  initializeScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    // Observe process steps for staggered animation
    document.querySelectorAll(".process-step").forEach((step, index) => {
      step.style.opacity = "0";
      step.style.transform = "translateY(50px)";
      step.style.transition = `all 0.6s ease ${index * 0.2}s`;
      observer.observe(step);
    });
  }

  // Initialize smooth scrolling for anchor links
  initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
          });
        }
      });
    });
  }

  // Initialize contact form handling
  initializeContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmission(contactForm, e);
    });
  }

  async handleFormSubmission(form, event) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate form data
    if (!this.validateForm(data)) {
      return;
    }

    const submitBtn =
      form.querySelector('button[type="submit"]') ||
      form.querySelector(".submit-btn");
    if (!submitBtn) return;

    // Update button state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      if (form.action) {
        // Submit to actual endpoint if action is specified
        await this.submitToEndpoint(form, formData);
      } else {
        // Simulate submission for demo purposes
        await this.simulateSubmission();
      }

      form.reset();
      this.showSuccess("Thank you! Your message has been sent.");
    } catch (error) {
      console.error("Form submission error:", error);
      this.showError("Oops! There was a problem submitting your form");
    } finally {
      // Reset button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async submitToEndpoint(form, formData) {
    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  simulateSubmission() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  validateForm(data) {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "subject",
      "message",
    ];

    // Check for empty required fields
    for (const field of requiredFields) {
      if (!data[field] || !data[field].trim()) {
        this.showError("Please fill in all required fields.");
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.showError("Please enter a valid email address.");
      return false;
    }

    return true;
  }

  showSuccess(message) {
    alert(message); // Could be replaced with a more elegant notification system
  }

  showError(message) {
    alert(message); // Could be replaced with a more elegant notification system
  }

  // Utility function to capitalize strings
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Initialize the website controller
new WebsiteController();
