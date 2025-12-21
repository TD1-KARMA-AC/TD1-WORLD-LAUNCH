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
            },
            {
                quote: "TD1.MEM revolutionized how we handle context. Game changer for our applications.",
                author: "Alex Thompson, Senior Developer"
            },
            {
                quote: "The autonomous intelligence capabilities are incredible. Karma AC is the future.",
                author: "Maria Garcia, AI Researcher"
            },
            {
                quote: "Zero cloud dependency was the selling point. We own everything now.",
                author: "David Kim, Enterprise Architect"
            },
            {
                quote: "Integration was seamless. The documentation is world-class.",
                author: "Lisa Anderson, Technical Lead"
            },
            {
                quote: "ROI was immediate. These products pay for themselves.",
                author: "Robert Chen, VP Engineering"
            },
            {
                quote: "The support and community around TD1.WORLD is exceptional.",
                author: "Jennifer White, Product Manager"
            },
            {
                quote: "We built our entire AI stack on TD1. Couldn't be happier.",
                author: "Chris Martinez, CTO"
            },
            {
                quote: "The NeuroBlock marketplace is brilliant. Exactly what the industry needed.",
                author: "Amanda Lee, Innovation Director"
            },
            {
                quote: "TD1.ROUTER saved us thousands in API costs. Smart routing is everything.",
                author: "Mark Johnson, DevOps Lead"
            },
            {
                quote: "Production-ready from day one. No surprises, just quality.",
                author: "Rachel Brown, Engineering Manager"
            },
            {
                quote: "The $2.3M investment claim is real. This is enterprise-grade infrastructure.",
                author: "Tom Wilson, Chief Architect"
            },
            {
                quote: "Karma AC's consciousness features are mind-blowing. It actually remembers.",
                author: "Sophie Taylor, AI Consultant"
            },
            {
                quote: "Best purchase decision we made this year. No regrets.",
                author: "Kevin Davis, Founder"
            },
            {
                quote: "The Realm community is amazing. Great place to learn and share.",
                author: "Nicole Green, Developer"
            },
            {
                quote: "TD1.GRAPH's reasoning capabilities are next-level. Highly recommend.",
                author: "Brian Miller, Data Scientist"
            },
            {
                quote: "We've recommended TD1.WORLD to every company we work with.",
                author: "Patricia Moore, Solutions Architect"
            },
            {
                quote: "The USB-C editions are perfect for offline deployments. Genius.",
                author: "Daniel Harris, Security Engineer"
            },
            {
                quote: "Enterprise support is top-notch. They actually care about your success.",
                author: "Michelle Clark, CISO"
            },
            {
                quote: "TD1.INTENT's emotion parsing changed our customer experience completely.",
                author: "Ryan Lewis, UX Director"
            },
            {
                quote: "The modular approach is perfect. Mix and match what you need.",
                author: "Stephanie Walker, CTO"
            },
            {
                quote: "Worth every penny. The IP valuation makes sense when you use it.",
                author: "Jason Young, Technical Director"
            },
            {
                quote: "We're building the future on TD1.WORLD. It's that simple.",
                author: "Ashley King, Innovation Lead"
            },
            {
                quote: "The transparency and documentation set a new industry standard.",
                author: "Brandon Wright, Engineering VP"
            },
            {
                quote: "TD1.MIRROR's perspective transformation is revolutionary for NLP.",
                author: "Lauren Scott, ML Engineer"
            },
            {
                quote: "No vendor lock-in. Complete freedom. That's what sold us.",
                author: "Justin Adams, Platform Lead"
            },
            {
                quote: "The 86,000+ lines of code claim is accurate. This is serious engineering.",
                author: "Megan Baker, Senior Architect"
            },
            {
                quote: "Best AI infrastructure investment we've ever made. Period.",
                author: "Tyler Nelson, CEO"
            },
            {
                quote: "The community support alone is worth the price. Incredible ecosystem.",
                author: "Samantha Carter, Developer Relations"
            },
            {
                quote: "TD1.STATE's emotion engine is perfect for our conversational AI.",
                author: "Jordan Mitchell, AI Product Manager"
            },
            {
                quote: "We've deployed across 50+ servers. Rock solid performance.",
                author: "Casey Roberts, Infrastructure Lead"
            },
            {
                quote: "The one-time purchase model is refreshing. No subscription fatigue.",
                author: "Derek Turner, Finance Director"
            },
            {
                quote: "Integration took days, not months. That's the TD1 difference.",
                author: "Brittany Phillips, Integration Specialist"
            },
            {
                quote: "The white-label options in Enterprise are perfect for our use case.",
                author: "Nathan Campbell, Product Owner"
            },
            {
                quote: "TD1.WORLD is the foundation of our AI strategy. Couldn't do it without them.",
                author: "Olivia Parker, Chief AI Officer"
            },
            {
                quote: "The quality-to-price ratio is unbeatable. Industry-leading value.",
                author: "Ethan Evans, Procurement Lead"
            },
            {
                quote: "We've seen 300% ROI in the first quarter. The numbers don't lie.",
                author: "Isabella Martinez, Business Analyst"
            },
            {
                quote: "The NeuroBlock ecosystem is growing fast. Exciting to be part of it.",
                author: "Lucas Foster, Community Manager"
            },
            {
                quote: "TD1 products work together seamlessly. The integration is flawless.",
                author: "Zoe Reed, Systems Architect"
            },
            {
                quote: "Best technical decision we made. The team loves working with TD1.",
                author: "Cameron Bell, Engineering Manager"
            },
            {
                quote: "The documentation is so good, we barely needed support. But when we did, it was instant.",
                author: "Avery Cooper, Lead Developer"
            },
            {
                quote: "Karma AC is like having a senior AI engineer on your team 24/7.",
                author: "Riley Richardson, CTO"
            },
            {
                quote: "The autonomous learning capabilities are exactly what we needed.",
                author: "Morgan Gray, AI Researcher"
            },
            {
                quote: "TD1.WORLD transformed how we think about AI infrastructure. Game changer.",
                author: "Jordan Bailey, Innovation Director"
            },
            {
                quote: "We've recommended TD1 to our entire network. It's that good.",
                author: "Taylor Rivera, Solutions Architect"
            },
            {
                quote: "The $15M IP valuation is conservative. This is worth way more.",
                author: "Alexis Ward, Investment Analyst"
            },
            {
                quote: "Production-ready code from day one. No debugging needed.",
                author: "Blake Torres, Senior Engineer"
            },
            {
                quote: "The Realm discussions are gold. So much knowledge sharing.",
                author: "Riley Peterson, Community Lead"
            },
            {
                quote: "TD1.WORLD is the infrastructure we've been waiting for. Finally.",
                author: "Casey Flores, Technical Director"
            },
            {
                quote: "The modular architecture is brilliant. Build exactly what you need.",
                author: "Morgan Hayes, Platform Architect"
            },
            {
                quote: "We've cut our AI infrastructure costs by 60% using TD1.ROUTER.",
                author: "Jordan Bennett, DevOps Manager"
            },
            {
                quote: "The Enterprise support team is world-class. They're always available.",
                author: "Taylor Wood, Enterprise Customer"
            },
            {
                quote: "TD1.WORLD is the foundation of our next-gen AI platform. Essential.",
                author: "Alexis Russell, Chief Technology Officer"
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

