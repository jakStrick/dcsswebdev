async function loadNavbar() {
	try {
		const response = await fetch("./assets/banners/navbar.html");

		const html = await response.text();

		document.getElementById("navbar-placeholder").innerHTML = html;
	} catch (error) {
		console.error("Failed to load navbar:", error);
	}
}

async function loadBanner(pn) {
	try {
		var html;
		var response;

		if (pn === "index") {
			response = await fetch("./assets/banners/index-banner.html");
		} else {
			response = await fetch("./assets/banners/banner.html");
		}

		html = await response.text();

		// Get the page-data attribute from the current page's body tag
		const pageData = document.body.getAttribute("page-data");

		//add correct page title if not loading the index page
		if (pn != "index") {
			if (pageData) {
				html = html.replace("{{PAGE_TITLE}}", capitalize(pageData));

				// Or if you want to replace the text content of the <text> element
				html = html.replace(
					/(<text[^>]*>)[^<]*(<\/text>)/g,
					`$1${capitalize(pageData)}$2`
				);
			}
		}

		document.getElementById("banner-placeholder").innerHTML = html;
	} catch (error) {
		console.error("Failed to load banner:", error);
	}
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
	anchor.addEventListener("click", function (e) {
		e.preventDefault();
		document.querySelector(this.getAttribute("href")).scrollIntoView({
			behavior: "smooth",
		});
	});
});

// Add scroll animations
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

// Observe process steps for animation
document.querySelectorAll(".process-step").forEach((step, index) => {
	step.style.opacity = "0";
	step.style.transform = "translateY(50px)";
	step.style.transition = `all 0.6s ease ${index * 0.2}s`;
	observer.observe(step);
});

//document.addEventListener("DOMContentLoaded", () => {});

// get page and load nav and banners
document.addEventListener("DOMContentLoaded", () => {
	const pageName = document.body.getAttribute("page-data");
	loadNavbar();
	loadBanner(pageName);

	const hamburger = document.querySelector(".hamburger");
	const navMenu = document.querySelector(".nav-menu");

	if (hamburger && navMenu) {
		hamburger.addEventListener("click", () => {
			hamburger.classList.toggle("active");
			navMenu.classList.toggle("active");
		});
	}
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
	anchor.addEventListener("click", function (e) {
		e.preventDefault();
		document.querySelector(this.getAttribute("href")).scrollIntoView({
			behavior: "smooth",
		});
	});
});
