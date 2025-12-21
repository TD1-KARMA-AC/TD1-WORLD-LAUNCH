// TD1.WORLD Shared Features - Applied to ALL Pages
// Ensures all animations and effects continue across pages

(function() {
    'use strict';
    
    const SharedFeatures = {
        init() {
            this.addParticles();
            this.addMouseSpotlight();
            this.addPageTransitions();
            this.addScrollAnimations();
        },
        
        addParticles() {
            // Remove existing particles
            const existing = document.getElementById('particles');
            if (existing) existing.remove();
            
            // Create particles container
            const particles = document.createElement('div');
            particles.className = 'neural-particles';
            particles.id = 'particles';
            particles.style.cssText = `
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 1;
                overflow: hidden;
            `;
            document.body.insertBefore(particles, document.body.firstChild);
            
            // Create SPHERE particles (cells/worlds)
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                const size = 3 + Math.random() * 5;
                particle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, rgba(193, 162, 255, 1), rgba(193, 162, 255, 0.6), transparent);
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: float-particle ${10 + Math.random() * 10}s infinite ease-in-out;
                    animation-delay: ${Math.random() * 10}s;
                    box-shadow: 0 0 ${size * 2}px rgba(193, 162, 255, 0.6), inset 0 0 ${size}px rgba(193, 162, 255, 0.3);
                `;
                particles.appendChild(particle);
            }
            
            // Add animation keyframes if not exists
            if (!document.getElementById('particle-animations')) {
                const style = document.createElement('style');
                style.id = 'particle-animations';
                style.textContent = `
                    @keyframes float-particle {
                        0%, 100% { opacity: 0; transform: translateY(0) translateX(0); }
                        25% { opacity: 0.4; transform: translateY(-20px) translateX(10px); }
                        50% { opacity: 0.6; transform: translateY(-40px) translateX(-10px); }
                        75% { opacity: 0.4; transform: translateY(-20px) translateX(5px); }
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        addMouseSpotlight() {
            const existing = document.getElementById('spotlight');
            if (existing) existing.remove();
            
            const spotlight = document.createElement('div');
            spotlight.className = 'mouse-spotlight';
            spotlight.id = 'spotlight';
            spotlight.style.cssText = `
                position: fixed;
                inset: 0;
                background: radial-gradient(circle 600px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(193, 162, 255, 0.08), transparent 70%);
                z-index: 2;
                pointer-events: none;
                transition: background 0.1s ease;
            `;
            document.body.insertBefore(spotlight, document.body.firstChild);
            
            document.addEventListener('mousemove', (e) => {
                spotlight.style.setProperty('--mouse-x', `${e.clientX}px`);
                spotlight.style.setProperty('--mouse-y', `${e.clientY}px`);
            });
        },
        
        addPageTransitions() {
            // Smooth transitions between pages - but don't break navigation
            document.querySelectorAll('a[href]').forEach(link => {
                if (link.hasAttribute('data-no-transition')) return;
                if (link.getAttribute('href').startsWith('#')) return;
                if (link.getAttribute('href').startsWith('javascript:')) return;
                if (link.getAttribute('target') === '_blank') return;
                
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    // Only add transition for same-domain links
                    if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
                        // Let the link work normally - don't prevent default
                        // Just add a subtle fade
                        setTimeout(() => {
                            if (document.body) {
                                document.body.style.transition = 'opacity 0.2s ease';
                                document.body.style.opacity = '0.9';
                            }
                        }, 50);
                    }
                });
            });
        },
        
        addScrollAnimations() {
            // Add scroll-triggered animations to all sections
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });
            
            // Animate all sections
            document.querySelectorAll('section, .section, .card, .feature-card').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
    };
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SharedFeatures.init());
    } else {
        SharedFeatures.init();
    }
    
    window.SharedFeatures = SharedFeatures;
})();

