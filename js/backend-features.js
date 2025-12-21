// TD1.WORLD Backend-Dependent Features
// Implementations that work with or without backend

(function() {
    'use strict';
    
    // ============================================
    // LIVE CODE PLAYGROUNDS
    // ============================================
    const CodePlayground = {
        init() {
            // Create playground container if products section exists
            const productsSection = document.getElementById('techSection');
            if (!productsSection) return;
            
            const playground = document.createElement('div');
            playground.id = 'td1-code-playground';
            playground.style.cssText = `
                max-width: 1400px;
                margin: 2rem auto;
                background: rgba(18, 24, 40, 0.8);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 20px;
                padding: 30px;
            `;
            
            playground.innerHTML = `
                <h3 style="color: #C1A2FF; margin-bottom: 20px; font-size: 24px;">Try TD1 APIs</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <label style="display: block; color: #A0A0A0; margin-bottom: 8px; font-size: 14px;">API Endpoint</label>
                        <select id="playground-endpoint" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(193, 162, 255, 0.3); border-radius: 8px; color: #EAEAEA; font-size: 14px;">
                            <option value="/api/v1/mem/remember">TD1.MEM - Remember</option>
                            <option value="/api/v1/state/emotion">TD1.STATE - Emotion</option>
                            <option value="/api/v1/router/route">TD1.ROUTER - Route</option>
                            <option value="/api/v1/graph/query">TD1.GRAPH - Query</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; color: #A0A0A0; margin-bottom: 8px; font-size: 14px;">Request Body (JSON)</label>
                        <textarea id="playground-body" style="width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(193, 162, 255, 0.3); border-radius: 8px; color: #EAEAEA; font-size: 14px; min-height: 100px; font-family: 'Courier New', monospace;" placeholder='{"key": "value"}'></textarea>
                    </div>
                </div>
                <button id="playground-submit" style="margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #C1A2FF, #B38DFF); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Test API</button>
                <div id="playground-result" style="margin-top: 20px; padding: 20px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; min-height: 100px; font-family: 'Courier New', monospace; font-size: 12px; color: #EAEAEA; display: none;">
                    <div style="color: #C1A2FF; margin-bottom: 8px;">Response:</div>
                    <pre id="playground-result-content" style="margin: 0; white-space: pre-wrap;"></pre>
                </div>
            `;
            
            productsSection.appendChild(playground);
            
            document.getElementById('playground-submit').addEventListener('click', () => {
                this.testAPI();
            });
        },
        
        async testAPI() {
            const endpoint = document.getElementById('playground-endpoint').value;
            const body = document.getElementById('playground-body').value;
            const resultDiv = document.getElementById('playground-result');
            const resultContent = document.getElementById('playground-result-content');
            
            resultDiv.style.display = 'block';
            resultContent.textContent = 'Testing API...';
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body || '{}'
                });
                
                const data = await response.json();
                resultContent.textContent = JSON.stringify(data, null, 2);
                resultContent.style.color = response.ok ? '#22c55e' : '#ef4444';
            } catch (error) {
                resultContent.textContent = `Error: ${error.message}\n\nNote: Backend API not available. This is a demo interface.`;
                resultContent.style.color = '#f59e0b';
            }
        }
    };
    
    // ============================================
    // REAL-TIME API STATUS
    // ============================================
    const APIStatus = {
        endpoints: [
            { name: 'TD1.MEM', url: '/api/v1/mem/health', status: 'unknown' },
            { name: 'TD1.STATE', url: '/api/v1/state/health', status: 'unknown' },
            { name: 'TD1.ROUTER', url: '/api/v1/router/health', status: 'unknown' },
            { name: 'TD1.GRAPH', url: '/api/v1/graph/health', status: 'unknown' },
            { name: 'TD1.MIRROR', url: '/api/v1/mirror/health', status: 'unknown' },
            { name: 'TD1.INTENT', url: '/api/v1/intent/health', status: 'unknown' }
        ],
        
        init() {
            this.createStatusPanel();
            this.checkStatus();
            setInterval(() => this.checkStatus(), 30000); // Check every 30 seconds
        },
        
        createStatusPanel() {
            const panel = document.createElement('div');
            panel.id = 'td1-api-status';
            panel.style.cssText = `
                position: fixed;
                top: 80px;
                left: 20px;
                width: 280px;
                background: rgba(18, 24, 40, 0.95);
                backdrop-filter: blur(32px);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 16px;
                padding: 20px;
                z-index: 999997;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;
            `;
            
            panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="color: #C1A2FF; font-size: 18px; margin: 0;">API Status</h3>
                    <button id="td1-api-status-close" style="background: none; border: none; color: #A0A0A0; cursor: pointer; font-size: 20px;">×</button>
                </div>
                <div id="td1-api-status-list"></div>
            `;
            
            document.body.appendChild(panel);
            document.getElementById('td1-api-status-close').addEventListener('click', () => this.toggle());
            
            // Toggle with Ctrl+Shift+A
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        },
        
        toggle() {
            const panel = document.getElementById('td1-api-status');
            const isVisible = panel.style.opacity === '1';
            panel.style.opacity = isVisible ? '0' : '1';
            panel.style.pointerEvents = isVisible ? 'none' : 'all';
        },
        
        async checkStatus() {
            const list = document.getElementById('td1-api-status-list');
            if (!list) return;
            
            list.innerHTML = '';
            
            for (const endpoint of this.endpoints) {
                const item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                `;
                
                const statusDot = document.createElement('div');
                statusDot.style.cssText = `
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #A0A0A0;
                    animation: pulse 2s infinite;
                `;
                
                try {
                    const response = await fetch(endpoint.url, { method: 'GET' });
                    endpoint.status = response.ok ? 'online' : 'error';
                    statusDot.style.background = response.ok ? '#22c55e' : '#ef4444';
                } catch (error) {
                    endpoint.status = 'offline';
                    statusDot.style.background = '#A0A0A0';
                }
                
                item.innerHTML = `
                    <span style="color: #EAEAEA; font-size: 14px;">${endpoint.name}</span>
                `;
                item.appendChild(statusDot);
                list.appendChild(item);
            }
        }
    };
    
    // ============================================
    // ANIMATED CHARTS/GRAPHS
    // ============================================
    const AnimatedCharts = {
        init() {
            this.createChartSection();
        },
        
        createChartSection() {
            const section = document.getElementById('liveStatsSection');
            if (!section) return;
            
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            chartContainer.style.marginTop = '3rem';
            
            chartContainer.innerHTML = `
                <h3 style="color: #C1A2FF; margin-bottom: 20px; font-size: 20px;">Usage Over Time</h3>
                <div style="display: flex; align-items: flex-end; gap: 8px; height: 200px; justify-content: space-around;">
                    ${Array.from({ length: 12 }, (_, i) => {
                        const height = 30 + Math.random() * 70;
                        return `<div class="chart-bar" style="flex: 1; height: ${height}%; background: linear-gradient(180deg, #C1A2FF, #B38DFF); border-radius: 4px 4px 0 0; animation: slideUp 0.5s ease ${i * 0.1}s both;"></div>`;
                    }).join('')}
                </div>
                <div style="display: flex; justify-content: space-around; margin-top: 12px; color: #A0A0A0; font-size: 12px;">
                    ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => `<span>${m}</span>`).join('')}
                </div>
            `;
            
            section.appendChild(chartContainer);
        }
    };
    
    // ============================================
    // SPATIAL NAVIGATION INTEGRATION
    // ============================================
    const SpatialNavigation = {
        init() {
            // Add spatial navigation hint
            const nav = document.querySelector('.nav');
            if (!nav) return;
            
            // Add spatial mode toggle
            const spatialBtn = document.createElement('button');
            spatialBtn.textContent = '🗺️';
            spatialBtn.title = 'Spatial Navigation (Atlas)';
            spatialBtn.style.cssText = `
                padding: 6px 12px;
                background: rgba(193, 162, 255, 0.1);
                border: 1px solid rgba(193, 162, 255, 0.3);
                border-radius: 8px;
                color: #C1A2FF;
                cursor: pointer;
                font-size: 16px;
            `;
            
            spatialBtn.addEventListener('click', () => {
                window.location.href = '/atlas';
            });
            
            nav.appendChild(spatialBtn);
        }
    };
    
    // ============================================
    // SMART CONTENT RECOMMENDATIONS
    // ============================================
    const SmartRecommendations = {
        init() {
            // Analyze user behavior and recommend content
            const behavior = JSON.parse(localStorage.getItem('td1_user_behavior') || '{}');
            
            if (behavior.visitCount > 2) {
                this.showRecommendations();
            }
        },
        
        showRecommendations() {
            const recommendations = [
                { text: 'Explore NeuroBlock Marketplace', link: '/neuroblock' },
                { text: 'Try Karma AC Demo', link: '/karma-ac.html' },
                { text: 'View All Products', link: '/PRODUCTS_INDEX.html' }
            ];
            
            const rec = recommendations[Math.floor(Math.random() * recommendations.length)];
            
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = 'live-notification';
                notification.innerHTML = `
                    <div style="margin-bottom: 8px; font-weight: 600; color: #C1A2FF;">💡 Recommendation</div>
                    <a href="${rec.link}" style="color: #EAEAEA; text-decoration: none;">${rec.text} →</a>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }, 5000);
            }, 10000);
        }
    };
    
    // ============================================
    // PERSONALIZED EXPERIENCE
    // ============================================
    const PersonalizedExperience = {
        init() {
            const behavior = JSON.parse(localStorage.getItem('td1_user_behavior') || '{}');
            
            // Personalize based on behavior
            if (behavior.maxScrollDepth > 80) {
                // User scrolls deep - show advanced features
                document.body.classList.add('td1-power-user');
            }
            
            if (behavior.visitCount > 5) {
                // Returning user - show welcome back
                this.showWelcomeBack();
            }
        },
        
        showWelcomeBack() {
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = 'live-notification';
                notification.textContent = '👋 Welcome back!';
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }, 2000);
        }
    };
    
    // ============================================
    // NATURAL LANGUAGE SEARCH
    // ============================================
    const NaturalLanguageSearch = {
        init() {
            // Enhance command palette with natural language
            if (window.TD1Enhanced && window.TD1Enhanced.CommandPalette) {
                const originalFilter = window.TD1Enhanced.CommandPalette.filterCommands;
                
                window.TD1Enhanced.CommandPalette.filterCommands = function() {
                    const query = this.input.value.toLowerCase();
                    
                    // Natural language patterns
                    if (query.includes('product') || query.includes('buy') || query.includes('purchase')) {
                        this.commands.push({
                            key: 'products',
                            label: 'View Products',
                            action: () => window.location.href = 'PRODUCTS_INDEX.html'
                        });
                    }
                    
                    if (query.includes('help') || query.includes('support') || query.includes('contact')) {
                        this.commands.push({
                            key: 'contact',
                            label: 'Contact Support',
                            action: () => {
                                const contact = document.getElementById('contactSection');
                                if (contact) contact.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
                    }
                    
                    originalFilter.call(this);
                };
            }
        }
    };
    
    // ============================================
    // VOICE COMMANDS
    // ============================================
    const VoiceCommands = {
        recognition: null,
        isListening: false,
        
        init() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                this.processCommand(command);
            };
            
            this.createVoiceButton();
        },
        
        createVoiceButton() {
            const button = document.createElement('button');
            button.id = 'td1-voice-command';
            button.innerHTML = '🎤';
            button.title = 'Voice Commands (Click to activate)';
            button.style.cssText = `
                position: fixed;
                bottom: 180px;
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
            
            button.addEventListener('click', () => {
                if (this.isListening) {
                    this.stop();
                } else {
                    this.start();
                }
            });
            
            document.body.appendChild(button);
        },
        
        start() {
            this.isListening = true;
            this.recognition.start();
            document.getElementById('td1-voice-command').style.background = 'rgba(193, 162, 255, 0.2)';
        },
        
        stop() {
            this.isListening = false;
            this.recognition.stop();
            document.getElementById('td1-voice-command').style.background = 'rgba(18, 24, 40, 0.9)';
        },
        
        processCommand(command) {
            if (command.includes('home') || command.includes('main')) {
                window.location.href = 'index.html';
            } else if (command.includes('product')) {
                window.location.href = 'PRODUCTS_INDEX.html';
            } else if (command.includes('contact') || command.includes('help')) {
                const contact = document.getElementById('contactSection');
                if (contact) contact.scrollIntoView({ behavior: 'smooth' });
            } else if (command.includes('search') || command.includes('find')) {
                if (window.TD1Enhanced && window.TD1Enhanced.CommandPalette) {
                    window.TD1Enhanced.CommandPalette.open();
                }
            }
            
            this.stop();
        }
    };
    
    // ============================================
    // VIDEO BACKGROUNDS (Optional)
    // ============================================
    const VideoBackgrounds = {
        init() {
            // Can add video background if video file exists
            // For now, just add the structure
            const hero = document.querySelector('.hero');
            if (hero && false) { // Set to true if you have a video file
                const video = document.createElement('video');
                video.className = 'video-background';
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.src = '/videos/background.mp4';
                document.body.insertBefore(video, document.body.firstChild);
            }
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
        
        CodePlayground.init();
        APIStatus.init();
        AnimatedCharts.init();
        SpatialNavigation.init();
        SmartRecommendations.init();
        PersonalizedExperience.init();
        NaturalLanguageSearch.init();
        VoiceCommands.init();
        VideoBackgrounds.init();
    }
    
    init();
    
    // Export
    window.TD1BackendFeatures = {
        CodePlayground,
        APIStatus,
        AnimatedCharts,
        SpatialNavigation,
        SmartRecommendations,
        PersonalizedExperience,
        NaturalLanguageSearch,
        VoiceCommands
    };
})();

