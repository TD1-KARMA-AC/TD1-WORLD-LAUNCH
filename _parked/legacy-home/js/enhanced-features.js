// TD1.WORLD Enhanced Features System
// Comprehensive enhancement module - all features integrated

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURATION & STATE
    // ============================================
    const CONFIG = {
        soundEnabled: localStorage.getItem('td1_sound_enabled') !== 'false',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: localStorage.getItem('td1_high_contrast') === 'true',
        ambientAudioVolume: 0.15,
        hoverSoundVolume: 0.3,
        transitionSoundVolume: 0.4
    };
    
    const state = {
        currentPage: window.location.pathname,
        userBehavior: JSON.parse(localStorage.getItem('td1_user_behavior') || '{}'),
        metrics: {
            fps: 60,
            loadTime: performance.now(),
            memory: 0
        },
        ws: null,
        activeFeatures: new Set()
    };
    
    // ============================================
    // SOUND SYSTEM
    // ============================================
    const SoundSystem = {
        audioContext: null,
        sounds: {},
        
        init() {
            if (!CONFIG.soundEnabled) return;
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Audio context not available');
            }
        },
        
        playHover() {
            if (!this.audioContext || !CONFIG.soundEnabled) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(CONFIG.hoverSoundVolume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        },
        
        playClick() {
            if (!this.audioContext || !CONFIG.soundEnabled) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = 600;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(CONFIG.hoverSoundVolume * 0.15, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.05);
        },
        
        playTransition() {
            if (!this.audioContext || !CONFIG.soundEnabled) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(CONFIG.transitionSoundVolume * 0.2, this.audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        }
    };
    
    // ============================================
    // CURSOR MORPHING SYSTEM
    // ============================================
    const CursorSystem = {
        cursor: null,
        trail: [],
        maxTrailLength: 20,
        
        init() {
            if (CONFIG.reducedMotion) return;
            
            this.cursor = document.createElement('div');
            this.cursor.className = 'td1-custom-cursor';
            this.cursor.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                border: 2px solid #C1A2FF;
                border-radius: 50%;
                pointer-events: none;
                z-index: 999999;
                transform: translate(-50%, -50%);
                transition: width 0.2s, height 0.2s, border-color 0.2s;
                mix-blend-mode: difference;
            `;
            document.body.appendChild(this.cursor);
            
            // Create trail
            for (let i = 0; i < this.maxTrailLength; i++) {
                const dot = document.createElement('div');
                dot.className = 'td1-cursor-trail';
                dot.style.cssText = `
                    position: fixed;
                    width: ${4 - i * 0.15}px;
                    height: ${4 - i * 0.15}px;
                    background: #C1A2FF;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 999998;
                    opacity: ${1 - i / this.maxTrailLength};
                    transform: translate(-50%, -50%);
                `;
                document.body.appendChild(dot);
                this.trail.push({ element: dot, x: 0, y: 0 });
            }
            
            document.addEventListener('mousemove', (e) => this.update(e));
            document.addEventListener('mouseenter', () => this.cursor.style.opacity = '1');
            document.addEventListener('mouseleave', () => this.cursor.style.opacity = '0');
            
            // Hover effects
            document.querySelectorAll('a, button, .magnetic-btn, .feature-card').forEach(el => {
                el.addEventListener('mouseenter', () => {
                    this.cursor.style.width = '40px';
                    this.cursor.style.height = '40px';
                    this.cursor.style.borderColor = '#B38DFF';
                    SoundSystem.playHover();
                });
                el.addEventListener('mouseleave', () => {
                    this.cursor.style.width = '20px';
                    this.cursor.style.height = '20px';
                    this.cursor.style.borderColor = '#C1A2FF';
                });
            });
        },
        
        update(e) {
            if (!this.cursor) return;
            this.cursor.style.left = e.clientX + 'px';
            this.cursor.style.top = e.clientY + 'px';
            
            // Update trail
            this.trail.forEach((dot, i) => {
                if (i === 0) {
                    dot.x = e.clientX;
                    dot.y = e.clientY;
                } else {
                    const prev = this.trail[i - 1];
                    dot.x += (prev.x - dot.x) * 0.3;
                    dot.y += (prev.y - dot.y) * 0.3;
                }
                dot.element.style.left = dot.x + 'px';
                dot.element.style.top = dot.y + 'px';
            });
        }
    };
    
    // ============================================
    // TEXT REVEAL ANIMATIONS (Word-by-word)
    // ============================================
    const TextReveal = {
        init() {
            if (CONFIG.reducedMotion) return;
            
            const revealElements = document.querySelectorAll('.section-title, .hero-tagline, .section-subtitle');
            revealElements.forEach(el => {
                const words = el.textContent.split(' ');
                el.innerHTML = words.map((word, i) => 
                    `<span class="word-reveal" style="opacity: 0; display: inline-block; transition: opacity 0.3s ${i * 0.05}s;">${word}</span>`
                ).join(' ');
            });
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.word-reveal').forEach(word => {
                            word.style.opacity = '1';
                        });
                    }
                });
            }, { threshold: 0.1 });
            
            revealElements.forEach(el => observer.observe(el));
        }
    };
    
    // ============================================
    // 3D EFFECTS SYSTEM
    // ============================================
    const ThreeDEffects = {
        scene: null,
        camera: null,
        renderer: null,
        particles: null,
        mouseX: 0,
        mouseY: 0,
        
        init() {
            if (CONFIG.reducedMotion || !window.THREE) {
                // Load Three.js dynamically
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
                script.onload = () => this.setupScene();
                document.head.appendChild(script);
            } else {
                this.setupScene();
            }
        },
        
        setupScene() {
            if (!window.THREE) return;
            
            const container = document.createElement('div');
            container.id = 'td1-3d-background';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
                opacity: 0.3;
            `;
            document.body.insertBefore(container, document.body.firstChild);
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.z = 5;
            
            this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(this.renderer.domElement);
            
            // Create particle system
            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            for (let i = 0; i < 1000; i++) {
                vertices.push(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                );
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            
            const material = new THREE.PointsMaterial({
                color: 0xC1A2FF,
                size: 0.1,
                transparent: true,
                opacity: 0.6
            });
            
            this.particles = new THREE.Points(geometry, material);
            this.scene.add(this.particles);
            
            document.addEventListener('mousemove', (e) => {
                this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            });
            
            this.animate();
            window.addEventListener('resize', () => this.onWindowResize());
        },
        
        animate() {
            requestAnimationFrame(() => this.animate());
            if (!this.particles) return;
            
            this.particles.rotation.x += 0.001;
            this.particles.rotation.y += 0.002;
            
            this.camera.position.x += (this.mouseX * 2 - this.camera.position.x) * 0.05;
            this.camera.position.y += (this.mouseY * 2 - this.camera.position.y) * 0.05;
            
            this.renderer.render(this.scene, this.camera);
        },
        
        onWindowResize() {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    };
    
    // ============================================
    // COMMAND PALETTE (Cmd+K)
    // ============================================
    const CommandPalette = {
        palette: null,
        input: null,
        isOpen: false,
        commands: [
            { key: 'home', label: 'Go to Home', action: () => window.location.href = 'index.html' },
            { key: 'products', label: 'View Products', action: () => window.location.href = 'PRODUCTS_INDEX.html' },
            { key: 'neuroblock', label: 'NeuroBlock', action: () => window.location.href = '/neuroblock' },
            { key: 'realm', label: 'Enter Realm', action: () => window.location.href = '/realm' },
            { key: 'karma', label: 'Karma AC', action: () => window.location.href = 'karma-ac.html' },
            { key: 'about', label: 'About', action: () => window.location.href = 'ABOUT.html' },
            { key: 'contact', label: 'Contact', action: () => this.scrollToContact() },
            { key: 'search', label: 'Search Products', action: () => this.openSearch() }
        ],
        
        init() {
            this.createPalette();
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.toggle();
                }
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },
        
        createPalette() {
            this.palette = document.createElement('div');
            this.palette.id = 'td1-command-palette';
            this.palette.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                width: 600px;
                max-width: 90vw;
                background: rgba(18, 24, 40, 0.95);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 16px;
                padding: 20px;
                z-index: 999999;
                opacity: 0;
                pointer-events: none;
                transition: all 0.2s ease;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            `;
            
            this.input = document.createElement('input');
            this.input.type = 'text';
            this.input.placeholder = 'Type a command or search...';
            this.input.style.cssText = `
                width: 100%;
                padding: 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 8px;
                color: #EAEAEA;
                font-size: 16px;
                margin-bottom: 16px;
            `;
            
            const results = document.createElement('div');
            results.id = 'td1-command-results';
            results.style.cssText = `
                max-height: 300px;
                overflow-y: auto;
            `;
            
            this.palette.appendChild(this.input);
            this.palette.appendChild(results);
            document.body.appendChild(this.palette);
            
            this.input.addEventListener('input', () => this.filterCommands());
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const firstResult = results.querySelector('.command-item');
                    if (firstResult) firstResult.click();
                }
            });
        },
        
        toggle() {
            this.isOpen ? this.close() : this.open();
        },
        
        open() {
            this.isOpen = true;
            this.palette.style.opacity = '1';
            this.palette.style.pointerEvents = 'all';
            this.palette.style.transform = 'translate(-50%, -50%) scale(1)';
            this.input.focus();
            this.filterCommands();
            SoundSystem.playClick();
        },
        
        close() {
            this.isOpen = false;
            this.palette.style.opacity = '0';
            this.palette.style.pointerEvents = 'none';
            this.palette.style.transform = 'translate(-50%, -50%) scale(0.9)';
            this.input.value = '';
        },
        
        filterCommands() {
            const query = this.input.value.toLowerCase();
            const results = document.getElementById('td1-command-results');
            results.innerHTML = '';
            
            const filtered = this.commands.filter(cmd => 
                cmd.label.toLowerCase().includes(query) || cmd.key.includes(query)
            );
            
            filtered.forEach(cmd => {
                const item = document.createElement('div');
                item.className = 'command-item';
                item.textContent = cmd.label;
                item.style.cssText = `
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: rgba(255, 255, 255, 0.05);
                `;
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(193, 162, 255, 0.2)';
                    SoundSystem.playHover();
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'rgba(255, 255, 255, 0.05)';
                });
                item.addEventListener('click', () => {
                    cmd.action();
                    this.close();
                });
                results.appendChild(item);
            });
        },
        
        scrollToContact() {
            const contact = document.getElementById('contactSection');
            if (contact) contact.scrollIntoView({ behavior: 'smooth' });
            this.close();
        },
        
        openSearch() {
            // Implement search functionality
            this.close();
        }
    };
    
    // ============================================
    // LIVE METRICS DASHBOARD
    // ============================================
    const MetricsDashboard = {
        panel: null,
        isVisible: false,
        
        init() {
            this.createPanel();
            // Toggle with Ctrl+Shift+M
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
                    e.preventDefault();
                    this.toggle();
                }
            });
            
            this.updateMetrics();
            setInterval(() => this.updateMetrics(), 1000);
        },
        
        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'td1-metrics-panel';
            this.panel.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                width: 280px;
                background: rgba(18, 24, 40, 0.95);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 16px;
                padding: 20px;
                z-index: 999998;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            `;
            
            this.panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="color: #C1A2FF; font-size: 18px; margin: 0;">Live Metrics</h3>
                    <button id="td1-metrics-close" style="background: none; border: none; color: #A0A0A0; cursor: pointer; font-size: 20px;">×</button>
                </div>
                <div id="td1-metrics-content"></div>
            `;
            
            document.body.appendChild(this.panel);
            document.getElementById('td1-metrics-close').addEventListener('click', () => this.toggle());
        },
        
        toggle() {
            this.isVisible = !this.isVisible;
            this.panel.style.opacity = this.isVisible ? '1' : '0';
            this.panel.style.pointerEvents = this.isVisible ? 'all' : 'none';
        },
        
        updateMetrics() {
            const content = document.getElementById('td1-metrics-content');
            if (!content) return;
            
            // Calculate FPS
            const now = performance.now();
            const delta = now - (state.metrics.lastFrameTime || now);
            state.metrics.fps = Math.round(1000 / delta);
            state.metrics.lastFrameTime = now;
            
            // Get memory if available
            if (performance.memory) {
                state.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
            }
            
            content.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <div style="color: #A0A0A0; font-size: 12px; margin-bottom: 4px;">FPS</div>
                    <div style="color: #EAEAEA; font-size: 24px; font-weight: 600;">${state.metrics.fps}</div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="color: #A0A0A0; font-size: 12px; margin-bottom: 4px;">Memory</div>
                    <div style="color: #EAEAEA; font-size: 24px; font-weight: 600;">${state.metrics.memory} MB</div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="color: #A0A0A0; font-size: 12px; margin-bottom: 4px;">Load Time</div>
                    <div style="color: #EAEAEA; font-size: 24px; font-weight: 600;">${Math.round(state.metrics.loadTime)}ms</div>
                </div>
                <div>
                    <div style="color: #A0A0A0; font-size: 12px; margin-bottom: 4px;">Page</div>
                    <div style="color: #EAEAEA; font-size: 14px;">${state.currentPage}</div>
                </div>
            `;
        }
    };
    
    // ============================================
    // REAL-TIME ACTIVITY FEED
    // ============================================
    const ActivityFeed = {
        feed: null,
        activities: [],
        
        init() {
            this.createFeed();
            this.startSimulation();
        },
        
        createFeed() {
            this.feed = document.createElement('div');
            this.feed.id = 'td1-activity-feed';
            this.feed.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 320px;
                max-height: 400px;
                z-index: 999997;
                display: flex;
                flex-direction: column;
                gap: 8px;
            `;
            document.body.appendChild(this.feed);
        },
        
        addActivity(message) {
            const activity = document.createElement('div');
            activity.className = 'td1-activity-item';
            activity.style.cssText = `
                background: rgba(18, 24, 40, 0.95);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 12px;
                padding: 12px 16px;
                color: #EAEAEA;
                font-size: 14px;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            `;
            activity.textContent = message;
            this.feed.insertBefore(activity, this.feed.firstChild);
            
            // Remove after 5 seconds
            setTimeout(() => {
                activity.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => activity.remove(), 300);
            }, 5000);
            
            // Keep only last 5
            while (this.feed.children.length > 5) {
                this.feed.lastChild.remove();
            }
        },
        
        startSimulation() {
            const messages = [
                'New product demo viewed',
                'User exploring NeuroBlock',
                'Integration inquiry received',
                'Product download started',
                'Realm accessed',
                'Karma AC demo requested'
            ];
            
            setInterval(() => {
                if (Math.random() > 0.7) {
                    const message = messages[Math.floor(Math.random() * messages.length)];
                    this.addActivity(message);
                }
            }, 8000);
        }
    };
    
    // ============================================
    // GESTURE SUPPORT (Mobile)
    // ============================================
    const GestureSupport = {
        touchStartX: 0,
        touchStartY: 0,
        
        init() {
            if (!('ontouchstart' in window)) return;
            
            document.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            });
            
            document.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchEndX - this.touchStartX;
                const deltaY = touchEndY - this.touchStartY;
                
                // Swipe right (back)
                if (deltaX > 100 && Math.abs(deltaY) < 50) {
                    if (window.history.length > 1) {
                        window.history.back();
                    }
                }
                // Swipe left (forward)
                else if (deltaX < -100 && Math.abs(deltaY) < 50) {
                    window.history.forward();
                }
            });
        }
    };
    
    // ============================================
    // ACCESSIBILITY FEATURES
    // ============================================
    const Accessibility = {
        init() {
            this.createControls();
            this.setupKeyboardNavigation();
            this.setupScreenReader();
        },
        
        createControls() {
            const controls = document.createElement('div');
            controls.id = 'td1-accessibility-controls';
            controls.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 999996;
                display: flex;
                gap: 8px;
            `;
            
            const highContrastBtn = document.createElement('button');
            highContrastBtn.textContent = 'HC';
            highContrastBtn.title = 'Toggle High Contrast';
            highContrastBtn.style.cssText = `
                padding: 8px 12px;
                background: rgba(18, 24, 40, 0.9);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 8px;
                color: #EAEAEA;
                cursor: pointer;
            `;
            highContrastBtn.addEventListener('click', () => this.toggleHighContrast());
            
            const reducedMotionBtn = document.createElement('button');
            reducedMotionBtn.textContent = 'RM';
            reducedMotionBtn.title = 'Toggle Reduced Motion';
            reducedMotionBtn.style.cssText = `
                padding: 8px 12px;
                background: rgba(18, 24, 40, 0.9);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 8px;
                color: #EAEAEA;
                cursor: pointer;
            `;
            reducedMotionBtn.addEventListener('click', () => this.toggleReducedMotion());
            
            controls.appendChild(highContrastBtn);
            controls.appendChild(reducedMotionBtn);
            document.body.appendChild(controls);
        },
        
        toggleHighContrast() {
            CONFIG.highContrast = !CONFIG.highContrast;
            localStorage.setItem('td1_high_contrast', CONFIG.highContrast);
            document.body.classList.toggle('td1-high-contrast', CONFIG.highContrast);
        },
        
        toggleReducedMotion() {
            CONFIG.reducedMotion = !CONFIG.reducedMotion;
            localStorage.setItem('td1_reduced_motion', CONFIG.reducedMotion);
            if (CONFIG.reducedMotion) {
                document.body.style.setProperty('--animation-duration', '0.01s');
            } else {
                document.body.style.removeProperty('--animation-duration');
            }
        },
        
        setupKeyboardNavigation() {
            // Add keyboard navigation indicators
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('td1-keyboard-nav');
                }
            });
            
            document.addEventListener('mousedown', () => {
                document.body.classList.remove('td1-keyboard-nav');
            });
        },
        
        setupScreenReader() {
            // Add ARIA labels and roles
            document.querySelectorAll('button, a').forEach(el => {
                if (!el.getAttribute('aria-label') && el.textContent.trim()) {
                    el.setAttribute('aria-label', el.textContent.trim());
                }
            });
        }
    };
    
    // ============================================
    // SMOOTH PAGE TRANSITIONS
    // ============================================
    const PageTransitions = {
        init() {
            document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('#') && !link.hasAttribute('data-no-transition')) {
                        e.preventDefault();
                        this.transition(href);
                    }
                });
            });
        },
        
        transition(href) {
            SoundSystem.playTransition();
            
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #050507;
                z-index: 999999;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);
            
            setTimeout(() => {
                window.location.href = href;
            }, 300);
        }
    };
    
    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Initialize all systems
        SoundSystem.init();
        CursorSystem.init();
        TextReveal.init();
        ThreeDEffects.init();
        CommandPalette.init();
        MetricsDashboard.init();
        ActivityFeed.init();
        GestureSupport.init();
        Accessibility.init();
        PageTransitions.init();
        
        // Track user behavior
        trackUserBehavior();
        
        // Prefetch likely next pages
        prefetchPages();
    }
    
    function trackUserBehavior() {
        let behavior = state.userBehavior;
        behavior.visitCount = (behavior.visitCount || 0) + 1;
        behavior.lastVisit = new Date().toISOString();
        behavior.currentPage = state.currentPage;
        
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            maxScroll = Math.max(maxScroll, scrollPercent);
        });
        
        window.addEventListener('beforeunload', () => {
            behavior.maxScrollDepth = Math.max(behavior.maxScrollDepth || 0, maxScroll);
            localStorage.setItem('td1_user_behavior', JSON.stringify(behavior));
        });
    }
    
    function prefetchPages() {
        // Prefetch likely next pages
        const links = document.querySelectorAll('a[href]');
        const prefetchLinks = Array.from(links)
            .slice(0, 3)
            .map(link => link.getAttribute('href'))
            .filter(href => href && !href.startsWith('#'));
        
        prefetchLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        });
    }
    
    // Start initialization
    init();
    
    // Export for external access
    window.TD1Enhanced = {
        SoundSystem,
        CursorSystem,
        CommandPalette,
        MetricsDashboard,
        CONFIG,
        state
    };
})();

