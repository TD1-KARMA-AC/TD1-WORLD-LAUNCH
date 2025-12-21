// TD1.WORLD Advanced 3D Features
// 3D navigation, parallax, product showcases

(function() {
    'use strict';
    
    // ============================================
    // 3D NAVIGATION MENU
    // ============================================
    const Nav3D = {
        init() {
            const nav = document.querySelector('.nav');
            if (!nav) return;
            
            nav.classList.add('nav-3d');
            
            // Add 3D transform on hover
            nav.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateZ(20px) rotateY(5deg) scale(1.1)';
                });
                link.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateZ(0) rotateY(0) scale(1)';
                });
            });
        }
    };
    
    // ============================================
    // PARALLAX 3D LAYERS
    // ============================================
    const Parallax3D = {
        layers: [],
        
        init() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            
            this.createLayers();
            this.setupScroll();
        },
        
        createLayers() {
            const sections = document.querySelectorAll('.section');
            sections.forEach((section, index) => {
                if (index % 2 === 0) {
                    section.classList.add('parallax-layer');
                    section.style.transformStyle = 'preserve-3d';
                    this.layers.push(section);
                }
            });
        },
        
        setupScroll() {
            let ticking = false;
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        this.updateParallax();
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        },
        
        updateParallax() {
            const scrollY = window.scrollY;
            
            this.layers.forEach((layer, index) => {
                const speed = (index + 1) * 0.1;
                const yPos = -(scrollY * speed);
                layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        }
    };
    
    // ============================================
    // 3D PRODUCT SHOWCASES
    // ============================================
    const ProductShowcase3D = {
        init() {
            // Add 3D effect to product cards if they exist
            const productCards = document.querySelectorAll('.product-card, .feature-card');
            productCards.forEach((card, index) => {
                card.style.transformStyle = 'preserve-3d';
                card.style.transition = 'transform 0.3s ease';
                
                card.addEventListener('mouseenter', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
                });
            });
        }
    };
    
    // ============================================
    // 3D BREADCRUMB
    // ============================================
    const Breadcrumb3D = {
        init() {
            // Create breadcrumb if navigation exists
            const nav = document.querySelector('.nav');
            if (!nav) return;
            
            const breadcrumb = document.createElement('nav');
            breadcrumb.className = 'breadcrumb-3d';
            breadcrumb.setAttribute('aria-label', 'Breadcrumb');
            breadcrumb.style.cssText = `
                position: fixed;
                top: 80px;
                left: 20px;
                z-index: 999;
                background: rgba(18, 24, 40, 0.8);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 12px;
                padding: 12px 20px;
            `;
            
            const path = window.location.pathname;
            const parts = path.split('/').filter(p => p);
            
            let html = '<a href="/" style="color: #C1A2FF; text-decoration: none;">Home</a>';
            let currentPath = '';
            
            parts.forEach((part, index) => {
                currentPath += '/' + part;
                const name = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
                html += ` <span class="breadcrumb-separator" style="color: #A0A0A0; margin: 0 8px;">/</span> `;
                html += index === parts.length - 1 
                    ? `<span style="color: #EAEAEA;">${name}</span>`
                    : `<a href="${currentPath}" style="color: #C1A2FF; text-decoration: none;">${name}</a>`;
            });
            
            breadcrumb.innerHTML = html;
            document.body.appendChild(breadcrumb);
        }
    };
    
    // ============================================
    // ADVANCED PARTICLE SYSTEM (Mouse Reactive)
    // ============================================
    const AdvancedParticles = {
        particles: [],
        mouseX: 0,
        mouseY: 0,
        
        init() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            
            this.createParticles();
            this.setupMouseTracking();
            this.animate();
        },
        
        createParticles() {
            const container = document.getElementById('particles');
            if (!container) return;
            
            // Add more particles that react to mouse
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'advanced-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(193, 162, 255, 0.8), transparent);
                    pointer-events: none;
                    transition: transform 0.1s ease;
                `;
                
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                
                container.appendChild(particle);
                
                this.particles.push({
                    element: particle,
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }
        },
        
        setupMouseTracking() {
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
        },
        
        animate() {
            this.particles.forEach(particle => {
                // Move particle
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // React to mouse
                const dx = this.mouseX - particle.x;
                const dy = this.mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const force = (200 - distance) / 200;
                    particle.vx -= (dx / distance) * force * 0.1;
                    particle.vy -= (dy / distance) * force * 0.1;
                }
                
                // Bounce off edges
                if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
                if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;
                
                // Apply position
                particle.element.style.left = particle.x + 'px';
                particle.element.style.top = particle.y + 'px';
            });
            
            requestAnimationFrame(() => this.animate());
        }
    };
    
    // ============================================
    // LIQUID/MORPHING SHAPES
    // ============================================
    const LiquidShapes = {
        init() {
            // Add liquid effect to hero section
            const hero = document.querySelector('.hero');
            if (hero) {
                const liquidBg = document.createElement('div');
                liquidBg.className = 'liquid-shape';
                liquidBg.style.cssText = `
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(193, 162, 255, 0.05), transparent);
                    z-index: -1;
                    pointer-events: none;
                `;
                hero.style.position = 'relative';
                hero.appendChild(liquidBg);
            }
        }
    };
    
    // ============================================
    // WEBGL SHADER EFFECTS
    // ============================================
    const ShaderEffects = {
        init() {
            // Shader effects are handled by Three.js in enhanced-features.js
            // Additional custom shader can be added here if needed
            if (window.THREE) {
                this.createShaderBackground();
            }
        },
        
        createShaderBackground() {
            // Custom shader material for background effects
            const shaderMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0xC1A2FF) },
                    color2: { value: new THREE.Color(0xB38DFF) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    void main() {
                        vec2 uv = vUv;
                        float wave = sin(uv.x * 10.0 + time) * 0.5 + 0.5;
                        vec3 color = mix(color1, color2, wave);
                        gl_FragColor = vec4(color, 0.1);
                    }
                `
            });
            
            // This would be integrated with the Three.js scene if needed
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
        
        Nav3D.init();
        Parallax3D.init();
        ProductShowcase3D.init();
        Breadcrumb3D.init();
        AdvancedParticles.init();
        LiquidShapes.init();
        ShaderEffects.init();
    }
    
    init();
    
    // Export
    window.TD1Advanced3D = {
        Nav3D,
        Parallax3D,
        ProductShowcase3D,
        Breadcrumb3D,
        AdvancedParticles,
        LiquidShapes
    };
})();

