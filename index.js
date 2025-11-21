// Remove Loveable logo/watermark
function removeLoveableElements() {
    // Remove elements with loveable in class, id, or data attributes
    const selectors = [
        '[data-loveable]',
        '.loveable',
        '[class*="loveable"]',
        '[id*="loveable"]',
        'iframe[src*="loveable"]',
        'iframe[title*="loveable"]'
    ];
    
    selectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => {
                el.remove();
            });
        } catch (e) {
            // Ignore selector errors
        }
    });
    
    // Also check for elements containing "loveable" text
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.textContent && el.textContent.toLowerCase().includes('loveable') && 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            const parent = el.parentElement;
            if (parent && (parent.classList.contains('loveable') || 
                parent.id && parent.id.includes('loveable'))) {
                parent.remove();
            }
        }
    });
}

// Smooth scroll for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Remove loveable elements on load
    removeLoveableElements();
    
    // Also remove after a short delay in case they're injected later
    setTimeout(removeLoveableElements, 1000);
    
    // Use MutationObserver to catch dynamically added elements
    const observer = new MutationObserver(() => {
        removeLoveableElements();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Active navigation highlighting
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('nav a');

    function updateActiveNav() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();

    // Make hero section visible immediately
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = '1';
    }
    
    // Make content sections visible initially, then animate on scroll
    sections.forEach(section => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Handle contact list separately
                if (entry.target.classList.contains('contact-list')) {
                    entry.target.classList.add('animate');
                } else {
                    entry.target.classList.add('visible');
                    
                    // Animate feature cards with delay
                    if (entry.target.classList.contains('content-section')) {
                        const cards = entry.target.querySelectorAll('.feature-card');
                        cards.forEach((card, index) => {
                            const delay = card.dataset.delay || 0;
                            setTimeout(() => {
                                card.classList.add('animate');
                            }, index * 100 + parseInt(delay));
                        });
                    }
                }
            }
        });
    }, observerOptions);

    // Observe all content sections
    sections.forEach(section => {
        observer.observe(section);
        
        // Also handle contact list when section becomes visible
        if (section.id === 'contact') {
            const contactList = section.querySelector('.contact-list');
            if (contactList) {
                // Observe contact list separately for its own animation
                observer.observe(contactList);
            }
        }
    });

    // Logo click to scroll to top
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-ripple');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Parallax effect for hero section (removed opacity change to keep it visible)
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero && scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${scrolled * 0.3}px)`;
            // Keep opacity at 1 to ensure visibility
            hero.style.opacity = 1;
        }
    });

    // Ensure hero title is visible (typing effect removed to prevent empty page)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.style.opacity = '1';
    }

    // Add hover sound effect simulation (visual feedback)
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });
    });

    // Counter animation for statistics (if needed in future)
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }

    // Ensure body is visible on load
    window.addEventListener('load', () => {
        document.body.style.opacity = '1';
    });
});

// Email function (keeping original functionality)
function openEmail() {
    const recipients = "krrishbkothari@gmail.com,kynandsilva06@gmail.com,vedant.poman@gmail.com";
    const subject = "Inquiry";
    const body = "Hi Balance Buddies,";
    window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
