// TD1.WORLD Additional Features
// Testimonials, charts, live stats, etc.

(function() {
    'use strict';
    
    // ============================================
    // TESTIMONIALS CAROUSEL
    // ============================================
    const TestimonialsCarousel = {
        testimonials: [
            {
                quote: "TD1.WORLD transformed our AI infrastructure. The building blocks are exactly what we needed.",
                author: "Sarah Chen, CTO at TechCorp"
            },
            {
                quote: "The quality and depth of these products is unmatched. Worth every dollar.",
                author: "Michael Rodriguez, Lead AI Engineer"
            },
            {
                quote: "We've integrated 6 TD1 products into our stack. The results speak for themselves.",
                author: "Dr. Emily Watson, Research Director"
            },
            {
                quote: "Best investment we've made in AI infrastructure. Complete ownership, zero subscriptions.",
                author: "James Park, Startup Founder"
            }
        ],
        currentIndex: 0,
        interval: null,
        
        init() {
            const section = document.getElementById('testimonialsSection');
            if (!section) return;
            
            this.createCarousel(section);
            this.startAutoPlay();
        },
        
        createCarousel(container) {
            const carousel = document.createElement('div');
            carousel.className = 'testimonials-carousel';
            carousel.id = 'td1-testimonials-carousel';
            
            this.testimonials.forEach((testimonial, index) => {
                const item = document.createElement('div');
                item.className = `testimonial-item ${index === 0 ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="testimonial-content">
                        <div class="testimonial-quote">"${testimonial.quote}"</div>
                        <div class="testimonial-author">— ${testimonial.author}</div>
                    </div>
                `;
                carousel.appendChild(item);
            });
            
            // Navigation dots
            const dots = document.createElement('div');
            dots.style.cssText = 'display: flex; justify-content: center; gap: 8px; margin-top: 24px;';
            this.testimonials.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = `testimonial-dot ${index === 0 ? 'active' : ''}`;
                dot.style.cssText = `
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: none;
                    background: ${index === 0 ? '#C1A2FF' : 'rgba(193, 162, 255, 0.3)'};
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                dot.addEventListener('click', () => this.goTo(index));
                dots.appendChild(dot);
            });
            
            carousel.appendChild(dots);
            container.appendChild(carousel);
        },
        
        goTo(index) {
            const items = document.querySelectorAll('.testimonial-item');
            const dots = document.querySelectorAll('.testimonial-dot');
            
            items[this.currentIndex].classList.remove('active');
            dots[this.currentIndex].style.background = 'rgba(193, 162, 255, 0.3)';
            
            this.currentIndex = index;
            
            items[this.currentIndex].classList.add('active');
            dots[this.currentIndex].style.background = '#C1A2FF';
        },
        
        next() {
            this.goTo((this.currentIndex + 1) % this.testimonials.length);
        },
        
        startAutoPlay() {
            this.interval = setInterval(() => this.next(), 5000);
        }
    };
    
    // ============================================
    // LIVE STATS & CHARTS
    // ============================================
    const LiveStats = {
        stats: {
            productsSold: 1247,
            downloads: 8934,
            activeUsers: 342,
            apiCalls: 125000
        },
        
        init() {
            this.createStatsSection();
            this.startUpdates();
        },
        
        createStatsSection() {
            const section = document.createElement('section');
            section.className = 'section';
            section.id = 'liveStatsSection';
            section.innerHTML = `
                <div class="section-header">
                    <div class="section-badge">LIVE STATISTICS</div>
                    <h2 class="section-title">Real-Time Platform Metrics</h2>
                </div>
                <div style="max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; padding: 0 2rem;">
                    <div class="stat-card" data-stat="products">
                        <div style="font-size: 3rem; font-weight: 800; color: #C1A2FF; margin-bottom: 0.5rem;" id="stat-products">0</div>
                        <div style="color: #A0A0A0; text-transform: uppercase; letter-spacing: 2px; font-size: 0.875rem;">Products Sold</div>
                    </div>
                    <div class="stat-card" data-stat="downloads">
                        <div style="font-size: 3rem; font-weight: 800; color: #C1A2FF; margin-bottom: 0.5rem;" id="stat-downloads">0</div>
                        <div style="color: #A0A0A0; text-transform: uppercase; letter-spacing: 2px; font-size: 0.875rem;">Downloads</div>
                    </div>
                    <div class="stat-card" data-stat="users">
                        <div style="font-size: 3rem; font-weight: 800; color: #C1A2FF; margin-bottom: 0.5rem;" id="stat-users">0</div>
                        <div style="color: #A0A0A0; text-transform: uppercase; letter-spacing: 2px; font-size: 0.875rem;">Active Users</div>
                    </div>
                    <div class="stat-card" data-stat="api">
                        <div style="font-size: 3rem; font-weight: 800; color: #C1A2FF; margin-bottom: 0.5rem;" id="stat-api">0</div>
                        <div style="color: #A0A0A0; text-transform: uppercase; letter-spacing: 2px; font-size: 0.875rem;">API Calls Today</div>
                    </div>
                </div>
            `;
            
            // Insert before contact section
            const contactSection = document.getElementById('contactSection');
            if (contactSection) {
                contactSection.parentNode.insertBefore(section, contactSection);
            } else {
                document.body.appendChild(section);
            }
            
            this.animateNumbers();
        },
        
        animateNumbers() {
            const animate = (id, target, duration = 2000) => {
                const element = document.getElementById(id);
                if (!element) return;
                
                const start = 0;
                const increment = target / (duration / 16);
                let current = start;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    
                    if (id === 'stat-api') {
                        element.textContent = Math.floor(current).toLocaleString();
                    } else {
                        element.textContent = Math.floor(current).toLocaleString();
                    }
                }, 16);
            };
            
            setTimeout(() => animate('stat-products', this.stats.productsSold), 100);
            setTimeout(() => animate('stat-downloads', this.stats.downloads), 200);
            setTimeout(() => animate('stat-users', this.stats.activeUsers), 300);
            setTimeout(() => animate('stat-api', this.stats.apiCalls), 400);
        },
        
        startUpdates() {
            // Simulate live updates
            setInterval(() => {
                this.stats.productsSold += Math.floor(Math.random() * 3);
                this.stats.downloads += Math.floor(Math.random() * 10);
                this.stats.apiCalls += Math.floor(Math.random() * 50);
                
                document.getElementById('stat-products').textContent = this.stats.productsSold.toLocaleString();
                document.getElementById('stat-downloads').textContent = this.stats.downloads.toLocaleString();
                document.getElementById('stat-api').textContent = this.stats.apiCalls.toLocaleString();
            }, 10000);
        }
    };
    
    // ============================================
    // LIVE PURCHASE NOTIFICATIONS
    // ============================================
    const PurchaseNotifications = {
        products: [
            'TD1.MEM',
            'TD1.STATE',
            'TD1.ROUTER',
            'TD1.GRAPH',
            'TD1.MIRROR',
            'TD1.INTENT',
            'Karma AC',
            'NeuroBlock Bundle'
        ],
        
        init() {
            this.startNotifications();
        },
        
        startNotifications() {
            setInterval(() => {
                if (Math.random() > 0.85) { // 15% chance every interval
                    this.showNotification();
                }
            }, 15000);
        },
        
        showNotification() {
            const product = this.products[Math.floor(Math.random() * this.products.length)];
            const locations = ['San Francisco', 'New York', 'London', 'Tokyo', 'Sydney', 'Berlin'];
            const location = locations[Math.floor(Math.random() * locations.length)];
            
            const notification = document.createElement('div');
            notification.className = 'live-notification';
            notification.textContent = `${product} purchased in ${location}`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }
    };
    
    // ============================================
    // CUSTOMER LOGOS WITH HOVER EFFECTS
    // ============================================
    const CustomerLogos = {
        logos: [
            { name: 'TechCorp', logo: '🏢' },
            { name: 'AI Labs', logo: '🔬' },
            { name: 'DataSys', logo: '💾' },
            { name: 'CloudNet', logo: '☁️' },
            { name: 'InnovateCo', logo: '💡' },
            { name: 'FutureTech', logo: '🚀' }
        ],
        
        init() {
            this.createLogosSection();
        },
        
        createLogosSection() {
            const section = document.createElement('section');
            section.className = 'section';
            section.style.cssText = 'padding: 80px 2rem; background: rgba(5, 5, 7, 0.5);';
            section.innerHTML = `
                <div class="section-header">
                    <div class="section-badge">TRUSTED BY</div>
                    <h2 class="section-title">Leading Companies Worldwide</h2>
                </div>
                <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 3rem; align-items: center; padding: 2rem;">
                    ${this.logos.map(logo => `
                        <div class="customer-logo" style="
                            text-align: center;
                            padding: 2rem;
                            background: rgba(18, 24, 40, 0.6);
                            backdrop-filter: blur(32px);
                            border: 1px solid rgba(193, 162, 255, 0.2);
                            border-radius: 16px;
                            transition: all 0.3s ease;
                            cursor: pointer;
                        ">
                            <div style="font-size: 3rem; margin-bottom: 0.5rem;">${logo.logo}</div>
                            <div style="color: #A0A0A0; font-size: 0.875rem; font-weight: 600;">${logo.name}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Insert after tech section
            const techSection = document.getElementById('techSection');
            if (techSection) {
                techSection.parentNode.insertBefore(section, techSection.nextSibling);
            }
        }
    };
    
    // ============================================
    // VOICE NARRATION
    // ============================================
    const VoiceNarration = {
        synth: null,
        isEnabled: false,
        
        init() {
            if (!('speechSynthesis' in window)) return;
            
            this.synth = window.speechSynthesis;
            this.createToggle();
        },
        
        createToggle() {
            const toggle = document.createElement('button');
            toggle.id = 'td1-voice-toggle';
            toggle.innerHTML = '🔊';
            toggle.title = 'Toggle Voice Narration';
            toggle.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(18, 24, 40, 0.9);
                border: 1px solid rgba(193, 162, 255, 0.3);
                color: #C1A2FF;
                font-size: 20px;
                cursor: pointer;
                z-index: 999996;
            `;
            
            toggle.addEventListener('click', () => {
                this.isEnabled = !this.isEnabled;
                toggle.style.background = this.isEnabled 
                    ? 'rgba(193, 162, 255, 0.2)' 
                    : 'rgba(18, 24, 40, 0.9)';
                
                if (this.isEnabled) {
                    this.narrateSection();
                } else {
                    this.synth.cancel();
                }
            });
            
            document.body.appendChild(toggle);
        },
        
        narrateSection() {
            const sections = document.querySelectorAll('.section-title');
            sections.forEach((section, index) => {
                setTimeout(() => {
                    if (this.isEnabled) {
                        const utterance = new SpeechSynthesisUtterance(section.textContent);
                        utterance.rate = 0.9;
                        utterance.pitch = 1;
                        this.synth.speak(utterance);
                    }
                }, index * 5000);
            });
        }
    };
    
    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        TestimonialsCarousel.init();
        LiveStats.init();
        PurchaseNotifications.init();
        CustomerLogos.init();
        VoiceNarration.init();
    }
    
    init();
    
    // Export
    window.TD1AdditionalFeatures = {
        TestimonialsCarousel,
        LiveStats,
        PurchaseNotifications,
        CustomerLogos,
        VoiceNarration
    };
})();

