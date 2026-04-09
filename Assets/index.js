/* ── Medium RSS loader ─────────────────────────────────────────── */
(async function loadMediumPosts() {
	const grid = document.getElementById('blogs-grid');
	if (!grid) return;

	const MEDIUM_USER = 'KipropEgo';
	const RSS_URL = `https://medium.com/feed/@${MEDIUM_USER}`;
	const API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}&count=6`;

	const FALLBACK_CARDS = `
		<article class="blog-card">
			<h3>Site Reliability Engineering</h3>
			<p>Lessons from production reliability, SLO thinking, incident learning, and operational excellence.</p>
			<a href="https://medium.com/@KipropEgo" target="_blank" rel="noopener noreferrer">Read on Medium</a>
		</article>
		<article class="blog-card">
			<h3>Observability in Practice</h3>
			<p>Practical guides on ELK, Prometheus, Grafana, and OpenTelemetry to improve system visibility.</p>
			<a href="https://medium.com/@KipropEgo" target="_blank" rel="noopener noreferrer">Read on Medium</a>
		</article>
		<article class="blog-card">
			<h3>Automation and Performance</h3>
			<p>Content on CI/CD quality gates, Selenium automation, k6 load testing, and resilient delivery.</p>
			<a href="https://medium.com/@KipropEgo" target="_blank" rel="noopener noreferrer">Read on Medium</a>
		</article>`;

	try {
		const res = await fetch(API);
		if (!res.ok) throw new Error('fetch failed');
		const data = await res.json();
		if (data.status !== 'ok' || !Array.isArray(data.items) || data.items.length === 0) {
			throw new Error('no posts');
		}

		const tmp = document.createElement('div');
		grid.innerHTML = data.items.slice(0, 6).map(post => {
			const dateStr = new Date(post.pubDate).toLocaleDateString('en-US', {
				year: 'numeric', month: 'short', day: 'numeric'
			});
			tmp.innerHTML = post.description || '';
			const plainText = tmp.textContent || '';
			const excerpt = plainText.trim().slice(0, 150).trimEnd() + (plainText.length > 150 ? '…' : '');
			const thumb = post.thumbnail
				? `<img src="${post.thumbnail}" alt="" class="blog-thumb" loading="lazy">`
				: '';
			return `<article class="blog-card">
				${thumb}
				<p class="blog-date">${dateStr}</p>
				<h3>${post.title}</h3>
				<p>${excerpt}</p>
				<a href="${post.link}" target="_blank" rel="noopener noreferrer">Read on Medium</a>
			</article>`;
		}).join('');
	} catch {
		grid.innerHTML = FALLBACK_CARDS;
	}
}());

/* ── UI ─────────────────────────────────────────────────────────── */
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');
const year = document.getElementById('year');
const scrollTopBtn = document.getElementById('scroll-top');

if (year) {
	year.textContent = new Date().getFullYear();
}

/* Mobile menu toggle */
if (menuToggle && navLinks) {
	menuToggle.addEventListener('click', () => {
		const isOpen = navLinks.classList.toggle('open');
		menuToggle.setAttribute('aria-expanded', isOpen);
	});

	navLinks.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => {
			navLinks.classList.remove('open');
			menuToggle.setAttribute('aria-expanded', 'false');
		});
	});
}

/* Active nav link on scroll */
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');

function updateActiveNav() {
	const scrollY = window.scrollY + 120;
	sections.forEach(section => {
		const top = section.offsetTop;
		const height = section.offsetHeight;
		const id = section.getAttribute('id');
		if (scrollY >= top && scrollY < top + height) {
			navLinksAll.forEach(link => {
				link.classList.remove('active');
				if (link.getAttribute('href') === `#${id}`) {
					link.classList.add('active');
				}
			});
		}
	});
}

window.addEventListener('scroll', updateActiveNav);

/* Scroll to top button */
if (scrollTopBtn) {
	window.addEventListener('scroll', () => {
		if (window.scrollY > 400) {
			scrollTopBtn.classList.add('visible');
		} else {
			scrollTopBtn.classList.remove('visible');
		}
	});

	scrollTopBtn.addEventListener('click', () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
}

/* Reveal on scroll animation */
const revealElements = document.querySelectorAll('.section, .stat-card, .about-card, .tech-section, .education-card, .cert-card, .project-card, .blog-card, .timeline-item, .skills-section');

const revealObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add('reveal', 'visible');
			revealObserver.unobserve(entry.target);
		}
	});
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

revealElements.forEach(el => {
	el.classList.add('reveal');
	revealObserver.observe(el);
});

/* Typewriter effect */
const typewriterEl = document.getElementById('typewriter');
if (typewriterEl) {
	const titles = [
		'SRE & Software Engineer in Test',
		'Observability & Monitoring Expert',
		'CI/CD Pipeline Architect',
		'Performance Engineering',
		'Infrastructure as Code'
	];
	let titleIndex = 0;
	let charIndex = 0;
	let isDeleting = false;
	let typeSpeed = 80;

	function typeWrite() {
		const current = titles[titleIndex];

		if (isDeleting) {
			typewriterEl.textContent = current.substring(0, charIndex - 1);
			charIndex--;
			typeSpeed = 40;
		} else {
			typewriterEl.textContent = current.substring(0, charIndex + 1);
			charIndex++;
			typeSpeed = 80;
		}

		if (!isDeleting && charIndex === current.length) {
			typeSpeed = 2000;
			isDeleting = true;
		} else if (isDeleting && charIndex === 0) {
			isDeleting = false;
			titleIndex = (titleIndex + 1) % titles.length;
			typeSpeed = 500;
		}

		setTimeout(typeWrite, typeSpeed);
	}

	setTimeout(typeWrite, 1000);
}

/* Navbar background on scroll */
const navbar = document.getElementById('navbar');
if (navbar) {
	window.addEventListener('scroll', () => {
		if (window.scrollY > 50) {
			navbar.style.borderBottomColor = 'rgba(74, 222, 128, 0.1)';
		} else {
			navbar.style.borderBottomColor = 'rgba(255, 255, 255, 0.06)';
		}
	});
}