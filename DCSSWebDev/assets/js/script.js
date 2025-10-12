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
			"full-name",
			"email-address",
			"detailed-description",
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
		if (!emailRegex.test(data["email-address"])) {
			this.showError(
				"Please enter a valid email address. " + data["email-address"]
			);
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

function setCookie(name, value, days) {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie =
		name +
		"=" +
		encodeURIComponent(value) +
		"; expires=" +
		expires +
		"; path=/";
}

// Frontend JavaScript code for interacting with the Cloudflare AI proxy
// Initialize chat
/* const chatClient = new ChatClient();
  const messages = [];

  const responseOutput = document.getElementById("response-output");
  const chatbotResponse = document.getElementById("chatbot-response");
  constructor(baseUrl = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  async sendMessage(messages, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Chat request failed:", error);
      throw error;
    }
  }
}

function updateResponse(content, isError = false, isLoading = false) {
  chatbotResponse.textContent = content;

  // Remove all status classes
  chatbotResponse.classList.remove("error", "loading", "success");

  // Add appropriate class
  if (isError) {
    chatbotResponse.classList.add("error");
  } else if (isLoading) {
    chatbotResponse.classList.add("loading");
  } else {
    chatbotResponse.classList.add("success");
  }

  // Scroll to bottom of response area
  responseOutput.scrollTop = responseOutput.scrollHeight;
}

function addConversationHistory(userMessage, aiResponse) {
  // Create conversation history above the response output
  const conversationDiv = document.createElement("div");
  conversationDiv.innerHTML = `
                <div class="conversation-item user-message">
                    <div class="message-label user-label">You:</div>
                    <div>${userMessage}</div>
                </div>
                <div class="conversation-item ai-message">
                    <div class="message-label ai-label">DCSS LLC AI:</div>
                    <div>${aiResponse}</div>
                </div>
            `;

  // Insert before the response-output div
  responseOutput.parentNode.insertBefore(conversationDiv, responseOutput);
}*/

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

async function sendMessage() {
	const userMessage = messageInput.value.trim();
	if (!userMessage) {
		updateResponse("Please enter a message before sending.", true);
		return;
	}

	// Add user message to conversation
	messages.push({ role: "user", content: userMessage });

	// Show loading state
	sendButton.disabled = true;
	updateResponse("AI is thinking...", false, true);

	try {
		const response = await chatClient.sendMessage(messages, {
			temperature: 0.7,
			max_tokens: 512,
		});

		// Extract the AI response - adjust based on actual Cloudflare response structure
		let aiResponse = "";
		if (response.result && response.result.response) {
			aiResponse = response.result.response;
		} else if (response.response) {
			aiResponse = response.response;
		} else if (
			response.choices &&
			response.choices[0] &&
			response.choices[0].message
		) {
			aiResponse = response.choices[0].message.content;
		} else {
			// Fallback - show the whole response
			aiResponse = JSON.stringify(response, null, 2);
		}

		// Update the main response area
		updateResponse(aiResponse);

		// Add to conversation history (optional - shows previous exchanges)
		//addConversationHistory(userMessage, aiResponse);

		// Add AI response to messages array
		messages.push({ role: "assistant", content: aiResponse });

		// Clear the input
		messageInput.value = "";
	} catch (error) {
		updateResponse(
			`Error: ${error.message}\n\nPlease check that your server is running on port 3001 and your Cloudflare API credentials are correct.`,
			true
		);
		console.error("Detailed error:", error);
	} finally {
		sendButton.disabled = false;
		messageInput.focus();
	}
}

// Test server connection on load
fetch("http://localhost:3001/health")
	.then((response) => response.json())
	.then((data) => {
		console.log("Server connection successful:", data);
		updateResponse("Ready to chat! Type your message above and click Send.");
	})
	.catch((error) => {
		console.error("Server connection failed:", error);
		updateResponse(
			"Warning: Cannot connect to server. Make sure your backend is running on port 3001.",
			true
		);
	});

// Focus input on load
messageInput.focus();

function hideConsent() {
	document.getElementById("cookie-consent").style.display = "none";
}

function acceptCookies() {
	setCookie("cookieConsent", "accepted", 365);
	hideConsent();
}

function rejectCookies() {
	setCookie("cookieConsent", "rejected", 365);
	hideConsent();
}

function customizeCookies() {
	alert("Customize options coming soon...");
	// Replace this with a modal or redirect to a settings page
}

window.onload = function () {
	if (document.cookie.indexOf("cookieConsent") === -1) {
		document.getElementById("cookie-consent").style.display = "block";
	} else {
		hideConsent();
	}
};

class DiamondSky extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		alert("DiamondSky component initialized");
		const style = document.createElement("style");
		style.textContent = `
      .diamond {
        position: absolute;
        width: 8px;
        height: 8px;
        background: linear-gradient(45deg, #ff007f, #800080);
        transform: rotate(45deg);
        opacity: 0.2;
        animation: twinkle1 2s infinite ease-in-out;
		animation: twinkle2 1s infinite ease-in-out;
        filter: drop-shadow(0 0 1px #ffffff);
      }

      @keyframes twinkle1 {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }

	   @keyframes twinkle2 {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `;
		this.shadowRoot.appendChild(style);

		const container = document.createElement("div");
		container.style.position = "absolute";
		container.style.width = "100%";
		container.style.height = "100%";
		this.shadowRoot.appendChild(container);

		const spacing = 8;
		const numRows = Math.floor(window.innerHeight / spacing);
		const numCols = Math.floor(window.innerWidth / spacing);
		this.diamonds = [];

		for (let row = 0; row < numRows; row++) {
			for (let col = 0; col < numCols; col++) {
				if (Math.random() < 0.05) {
					const diamond = document.createElement("div");
					diamond.className = "diamond";
					diamond.style.top = `${row * spacing}px`;
					diamond.style.left = `${col * spacing}px`;
					diamond.style.animationDelay = `${Math.random() * 2}s`;
					container.appendChild(diamond);
					this.diamonds.push({
						el: diamond,
						dx: (Math.random() - 0.5) * 0.5,
						dy: (Math.random() - 0.5) * 0.5,
					});
				}
			}
		}

		this.animate();
	}

	animate() {
		this.diamonds.forEach((d) => {
			let top = parseFloat(d.el.style.top);
			let left = parseFloat(d.el.style.left);

			top += d.dy;
			left += d.dx;

			if (top > window.innerHeight || top < 0) d.dy *= -1;
			if (left > window.innerWidth || left < 0) d.dx *= -1;

			d.el.style.top = `${top}px`;
			d.el.style.left = `${left}px`;
		});
		requestAnimationFrame(() => this.animate());
	}
}

customElements.define("diamond-sky", DiamondSky);

document.addEventListener("DOMContentLoaded", () => {
	// Event listeners
	sendButton.addEventListener("click", sendMessage);
	messageInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault(); // Prevent new line
			sendMessage();
		}
	});
});

//for schematic.jsximport React from 'react';
// Then add this at the bottom:
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(OptocouplerSchematic));
