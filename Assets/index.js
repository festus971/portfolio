/* ── Medium RSS loader ─────────────────────────────────────────── */
(async function loadMediumPosts() {
	const grid = document.getElementById('blogs-grid');
	if (!grid) return;

	const MEDIUM_USER = 'KipropEgo';
	const RSS_URL = `https://medium.com/feed/@${MEDIUM_USER}`;
	const API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}&count=6`;

	const FALLBACK_CARDS = `
		<article class="blog-card">
			<h3>Deploying a Highly Available Web App on AWS Using Terraform</h3>
			<p>In this blog post, we will explore the journey of deploying a highly available web application on AWS using Terraform.</p>
			<a href="https://medium.com/@KipropEgo/deploying-a-highly-available-web-app-on-aws-using-terraform-bd326423b772" target="_blank" rel="noopener noreferrer">Read on Medium</a>
		</article>
		<article class="blog-card">
			<h3>What is Infrastructure as Code and Why It’s Transforming DevOps</h3>
			<p>In this blog we explores what IaC is, the problems it solves, the differences between declarative and imperative approaches, the significance of learning Terraform.</p>
			<a href="https://medium.com/@KipropEgo/what-is-infrastructure-as-code-and-why-its-transforming-devops-29426cb5e40e" target="_blank" rel="noopener noreferrer">Read on Medium</a>
		</article>
		<article class="blog-card">
			<h3>Step-by-Step Guide to Setting Up Terraform, AWS CLI, and Your AWS Environment</h3>
			<p>Terraform can provision infrastructure across public cloud providers such as AWS, Azure, Google Cloud, and DigitalOcean, as well as private cloud and virtualization platforms such as OpenStack and VMware.</p>
			<a href="https://medium.com/@KipropEgo/step-by-step-guide-to-setting-up-terraform-aws-cli-and-your-aws-environment-43da8b848925" target="_blank" rel="noopener noreferrer">Read on Medium</a>
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

// ⚠️ CHANGE THIS to your deployed backend URL on Render
const API_BASE = 'https://your-backend.onrender.com';

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

/* ── Theme Toggle ────────────────────────────────────────────── */
(function themeToggle() {
	const toggle = document.getElementById('theme-toggle');
	if (!toggle) return;
	const icon = toggle.querySelector('i');
	const stored = localStorage.getItem('theme');

	function applyTheme(theme) {
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
		if (icon) {
			icon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
		}
	}

	// Apply saved preference, default to light
	if (stored) {
		applyTheme(stored);
	} else {
		applyTheme('light');
	}

	toggle.addEventListener('click', () => {
		const current = document.documentElement.getAttribute('data-theme');
		applyTheme(current === 'light' ? 'dark' : 'light');
	});
})();


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

/* ── Interactive Terminal Animation ─────────────────────────────── */
(function terminalAnimation() {
	const terminal = document.getElementById('terminal-body');
	if (!terminal) return;

	const PROMPT = 'festus@sre~$';

	// Each block: a command string + its output lines
	const sequence = [
		{
			cmd: 'kubectl get pods --namespace production',
			output: [
				'NAME                READY  STATUS   RESTARTS',
				'api-server-7d4b8   1/1    Running  0',
				'monitoring-5f6a2   1/1    Running  0',
			]
		},
		{
			cmd: 'terraform apply -auto-approve',
			output: [
				'Apply complete! Resources: 3 added, 0 changed, 0 destroyed.',
			]
		},
		{
			cmd: 'ansible-playbook deploy.yml --limit prod',
			output: [
				'PLAY [production] ****************************',
				'TASK [Deploy Application] ********************',
				'changed: [prod-server-1]',
				'PLAY RECAP ************************************',
				'prod-1 : ok=5 changed=2 unreachable=0 failed=0',
			]
		},
		{
			cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}"',
			output: [
				'NAMES               STATUS',
				'nginx-proxy         Up 12 hours',
				'grafana-dashboard   Up 12 hours',
				'prometheus-server   Up 12 hours',
			]
		},
		{
			cmd: 'k6 run --vus 50 --duration 30s load-test.js',
			output: [
				'          /\\      |‾‾| /‾‾/   /‾‾/',
				'     /\\  /  \\     |  |/  /   /  /',
				'    /  \\/    \\    |     (   /   ‾‾\\',
				'   /          \\   |  |\\  \\ |  (‾)  |',
				'  /   ________\\  |__| \\__\\ \\_____/',
				'  running (0m30s), 50/50 VUs, 12847 complete',
				'  ✓ http_req_duration...: avg=42ms  p(95)=89ms',
				'  ✓ http_req_failed.....: 0.00%',
			]
		},
	];

	let blockIndex = 0;

	function scrollToBottom() {
		terminal.scrollTop = terminal.scrollHeight;
	}

	function sleep(ms) {
		return new Promise(r => setTimeout(r, ms));
	}

	// Create a prompt + blinking cursor line
	function createPromptLine() {
		const p = document.createElement('p');
		const promptSpan = document.createElement('span');
		promptSpan.className = 'prompt';
		promptSpan.textContent = PROMPT;
		p.appendChild(promptSpan);
		const textNode = document.createTextNode(' ');
		p.appendChild(textNode);
		const cursorSpan = document.createElement('span');
		cursorSpan.className = 'terminal-cursor';
		cursorSpan.textContent = '█';
		p.appendChild(cursorSpan);
		terminal.appendChild(p);
		scrollToBottom();
		return { p, textNode, cursorSpan };
	}

	// Type command character by character
	async function typeCommand(text) {
		const { p, textNode, cursorSpan } = createPromptLine();
		await sleep(400);
		for (let i = 0; i < text.length; i++) {
			textNode.textContent += text[i];
			scrollToBottom();
			// Random speed for realistic typing
			await sleep(30 + Math.random() * 50);
		}
		// Remove cursor after command is typed
		cursorSpan.remove();
		return p;
	}

	// Show output lines one by one
	async function showOutput(lines) {
		for (const line of lines) {
			await sleep(80 + Math.random() * 120);
			const p = document.createElement('p');
			p.className = 'output';
			p.textContent = line;
			p.style.opacity = '0';
			terminal.appendChild(p);
			scrollToBottom();
			// Fade in
			requestAnimationFrame(() => {
				p.style.transition = 'opacity 0.15s ease';
				p.style.opacity = '1';
			});
		}
	}

	async function runSequence() {
		// Clear terminal on restart
		terminal.innerHTML = '';
		blockIndex = 0;

		for (const block of sequence) {
			await typeCommand(block.cmd);
			await sleep(300);
			await showOutput(block.output);
			await sleep(800);
		}

		// Show a final blinking prompt
		createPromptLine();

		// Wait then restart the loop
		await sleep(3000);
		runSequence();
	}

	// Start when terminal comes into view
	const observer = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting) {
			observer.disconnect();
			runSequence();
		}
	}, { threshold: 0.3 });

	observer.observe(terminal);
}());

/* ── Contact Modal ───────────────────────────────────────────────── */
(function contactModal() {
	const openBtns = document.querySelectorAll('.open-contact-modal');
	const modal = document.getElementById('contact-modal');
	const closeBtn = document.getElementById('modal-close');
	if (!openBtns.length || !modal) return;

	function openModal() {
		modal.classList.add('open');
		modal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
		// Focus first input after animation
		setTimeout(() => {
			const first = modal.querySelector('input');
			if (first) first.focus();
		}, 350);
	}

	function closeModal() {
		modal.classList.remove('open');
		modal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	}

	openBtns.forEach(btn => btn.addEventListener('click', openModal));
	if (closeBtn) closeBtn.addEventListener('click', closeModal);

	// Close on overlay click (outside modal card)
	modal.addEventListener('click', (e) => {
		if (e.target === modal) closeModal();
	});

	// Close on Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
	});
}());

/* ── Contact Form Submission ────────────────────────────────────── */
(function contactFormHandler() {
	const form = document.getElementById('contact-form');
	const statusEl = document.getElementById('form-status');
	const submitBtn = document.getElementById('submit-btn');
	if (!form) return;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();

		// Clear previous status
		if (statusEl) {
			statusEl.textContent = '';
			statusEl.className = 'form-status';
		}

		// Basic client-side validation
		const name = form.name.value.trim();
		const email = form.email.value.trim();
		const subject = form.subject.value.trim();
		const message = form.message.value.trim();

		if (!name || !email || !subject || !message) {
			if (statusEl) {
				statusEl.textContent = 'Please fill in all fields.';
				statusEl.className = 'form-status error';
			}
			return;
		}

		// Email format check
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			if (statusEl) {
				statusEl.textContent = 'Please enter a valid email address.';
				statusEl.className = 'form-status error';
			}
			return;
		}

		// Disable button
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
		}

		try {
			const res = await fetch(`${API_BASE}/api/contact`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, subject, message }),
			});

			const data = await res.json();

			if (res.ok && data.success) {
				form.reset();
				if (statusEl) {
					statusEl.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
					statusEl.className = 'form-status success';
				}
				// Close modal after a short delay
				const modal = document.getElementById('contact-modal');
				setTimeout(() => {
					if (modal) {
						modal.classList.remove('open');
						modal.setAttribute('aria-hidden', 'true');
						document.body.style.overflow = '';
					}
					if (statusEl) statusEl.textContent = '';
				}, 2500);
			} else {
				throw new Error(data.error || 'Failed to send');
			}
		} catch (err) {
			if (statusEl) {
				statusEl.textContent = err.message || 'Something went wrong. Please try again or email me directly.';
				statusEl.className = 'form-status error';
			}
		} finally {
			if (submitBtn) {
				submitBtn.disabled = false;
				submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
			}
		}
	});
}());

/* ── Interaction Logging ────────────────────────────────────────── */
(function interactionLogger() {
	function logEvent(event, meta) {
		// Fire and forget — don't block the UI
		fetch(`${API_BASE}/api/log`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				event,
				page: window.location.pathname,
				referrer: document.referrer || null,
				meta,
			}),
		}).catch(() => { /* silent fail */ });
	}

	// Log page visit
	logEvent('page_view', {
		url: window.location.href,
		screenWidth: window.innerWidth,
		screenHeight: window.innerHeight,
	});

	// Log resume download
	document.querySelectorAll('a[href*="FestusKiprop.pdf"], a[href*="festus.pdf"]').forEach(link => {
		link.addEventListener('click', () => logEvent('resume_download'));
	});

	// Log external link clicks (GitHub, LinkedIn, Medium)
	document.querySelectorAll('a[target="_blank"]').forEach(link => {
		link.addEventListener('click', () => {
			logEvent('external_link_click', { href: link.href });
		});
	});

	// Log section views
	document.querySelectorAll('section[id]').forEach(section => {
		const sectionObserver = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					logEvent('section_view', { section: section.id });
					sectionObserver.unobserve(section);
				}
			});
		}, { threshold: 0.3 });
		sectionObserver.observe(section);
	});

	// Log copy button clicks
	document.querySelectorAll('.copy-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			logEvent('copy_click', { text: btn.closest('.contact-info-card')?.querySelector('p')?.textContent });
		});
	});
}());