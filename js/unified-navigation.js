// TD1.WORLD Unified Navigation with Atlas Integration
// Works on ALL pages - consistent navigation everywhere

(function() {
    'use strict';
    
    const UnifiedNav = {
        currentPage: window.location.pathname.split('/').pop() || 'index.html',
        
        // Helper to get relative path (same logic as createNav)
        getRelativePath(target) {
            const currentPath = window.location.pathname;
            const isRoot = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('index.html');
            const isWebsite = currentPath.includes('/website/') || currentPath.includes('website/');
            const isNeuroblock = currentPath.includes('/neuroblock') || currentPath.includes('Neuroblock') || currentPath.includes('neuroblock');
            const isRealm = currentPath.includes('/realm') || currentPath.includes('realm');
            
            if (isNeuroblock) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return '../website/ABOUT.html';
                if (target === 'karma-ac.html') return '../website/karma-ac.html';
                if (target === 'neuroblock') return 'index.html';
                if (target === 'realm') return '../realm/index.html';
                if (target === 'atlas') return '../atlas/index.html';
            } else if (isWebsite) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return 'PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return 'ABOUT.html';
                if (target === 'karma-ac.html') return 'karma-ac.html';
                if (target === 'neuroblock') return '../Neuroblock/index.html';
                if (target === 'realm') return '../realm/index.html';
                if (target === 'atlas') return '../atlas/index.html';
            } else if (isRealm) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return '../website/ABOUT.html';
                if (target === 'karma-ac.html') return '../website/karma-ac.html';
                if (target === 'neuroblock') return '../Neuroblock/index.html';
                if (target === 'realm') return 'index.html';
                if (target === 'atlas') return '../atlas/index.html';
            } else {
                if (target === 'index.html') return 'index.html';
                if (target === 'PRODUCTS_INDEX.html') return 'website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return 'website/ABOUT.html';
                if (target === 'karma-ac.html') return 'website/karma-ac.html';
                if (target === 'neuroblock') return 'Neuroblock/index.html';
                if (target === 'realm') return 'realm/index.html';
                if (target === 'atlas') return 'atlas/index.html';
            }
            return target;
        },
        
        init() {
            this.createNav();
            this.setupAtlasSearch();
            this.setActiveLink();
        },
        
        createNav() {
            // Remove old nav if exists
            const oldNav = document.querySelector('.nav, .unified-nav-bar');
            if (oldNav) oldNav.remove();
            
            // Detect current page location to fix paths
            const currentPath = window.location.pathname;
            const isRoot = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.endsWith('index.html');
            const isWebsite = currentPath.includes('/website/') || currentPath.includes('website/');
            const isNeuroblock = currentPath.includes('/neuroblock') || currentPath.includes('Neuroblock') || currentPath.includes('neuroblock');
            const isRealm = currentPath.includes('/realm') || currentPath.includes('realm');
            
            // Calculate correct paths based on current location
            const getPath = (target) => {
                if (isNeuroblock) {
                    // Inside Neuroblock folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return '../website/ABOUT.html';
                    if (target === 'karma-ac.html') return '../website/karma-ac.html';
                    if (target === 'neuroblock') return 'index.html';
                    if (target === 'realm') return '../realm/index.html';
                    if (target === 'atlas') return '../atlas/index.html';
                } else if (isWebsite) {
                    // Inside website folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return 'PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return 'ABOUT.html';
                    if (target === 'karma-ac.html') return 'karma-ac.html';
                    if (target === 'neuroblock') return '../Neuroblock/index.html';
                    if (target === 'realm') return '../realm/index.html';
                    if (target === 'atlas') return '../atlas/index.html';
                } else if (isRealm) {
                    // Inside realm folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return '../website/ABOUT.html';
                    if (target === 'karma-ac.html') return '../website/karma-ac.html';
                    if (target === 'neuroblock') return '../Neuroblock/index.html';
                    if (target === 'realm') return 'index.html';
                    if (target === 'atlas') return '../atlas/index.html';
                } else {
                    // Root level
                    if (target === 'index.html') return 'index.html';
                    if (target === 'PRODUCTS_INDEX.html') return 'website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return 'website/ABOUT.html';
                    if (target === 'karma-ac.html') return 'website/karma-ac.html';
                    if (target === 'neuroblock') return 'Neuroblock/index.html';
                    if (target === 'realm') return 'realm/index.html';
                    if (target === 'atlas') return 'atlas/index.html';
                }
                return target;
            };
            
            // Find or create nav container
            let navContainer = document.getElementById('unified-nav-container');
            if (!navContainer) {
                navContainer = document.createElement('div');
                navContainer.id = 'unified-nav-container';
                navContainer.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;';
                document.body.insertBefore(navContainer, document.body.firstChild);
            } else {
                // Clear existing content
                navContainer.innerHTML = '';
                navContainer.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000;';
            }
            
            // Create nav bar
            const nav = document.createElement('nav');
            nav.className = 'unified-nav-bar';
            nav.id = 'unified-nav-bar';
            
            nav.innerHTML = `
                <!-- Left: Navigation Links -->
                <div class="unified-nav-links">
                    <a href="${getPath('index.html')}" class="unified-nav-link" data-page="index.html">
                        <span class="unified-nav-icon">🏠</span>
                        <span class="unified-nav-text">Home</span>
                    </a>
                    <a href="${getPath('PRODUCTS_INDEX.html')}" class="unified-nav-link" data-page="PRODUCTS_INDEX.html">
                        <span class="unified-nav-icon">📦</span>
                        <span class="unified-nav-text">Products</span>
                    </a>
                    <a href="${getPath('neuroblock')}" class="unified-nav-link" data-page="neuroblock">
                        <span class="unified-nav-icon">🧩</span>
                        <span class="unified-nav-text">NeuroBlock</span>
                    </a>
                    <a href="${getPath('realm')}" class="unified-nav-link" data-page="realm">
                        <span class="unified-nav-icon">💬</span>
                        <span class="unified-nav-text">Realm</span>
                    </a>
                    <a href="${getPath('karma-ac.html')}" class="unified-nav-link" data-page="karma-ac.html">
                        <span class="unified-nav-icon">⚡</span>
                        <span class="unified-nav-text">Karma AC</span>
                    </a>
                    <a href="${getPath('atlas')}" class="unified-nav-link" data-page="atlas">
                        <span class="unified-nav-icon">🗺️</span>
                        <span class="unified-nav-text">Atlas</span>
                    </a>
                    <a href="${getPath('ABOUT.html')}" class="unified-nav-link" data-page="ABOUT.html">
                        <span class="unified-nav-icon">ℹ️</span>
                        <span class="unified-nav-text">About</span>
                    </a>
                </div>

                <!-- Center: Atlas Search -->
                <div class="unified-nav-search">
                    <div class="unified-search-bar">
                        <input 
                            type="text" 
                            id="unified-search-input" 
                            placeholder="Search products, blocks, or ask..." 
                            class="unified-search-input"
                            autocomplete="off"
                        >
                        <button class="unified-search-btn" id="unified-search-btn" aria-label="Search">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="unified-search-results" id="unified-search-results" style="display: none;"></div>
                </div>

                <!-- Right: Status Indicator -->
                <div class="unified-nav-status">
                    <div class="unified-status-dot"></div>
                    <span class="unified-status-text">Ready</span>
                </div>
            `;
            
            navContainer.appendChild(nav);
            
            // Add styles if not already loaded
            this.injectStyles();
        },
        
        injectStyles() {
            if (document.getElementById('unified-nav-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'unified-nav-styles';
            style.textContent = `
                .unified-nav-bar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: linear-gradient(135deg, rgba(15, 15, 20, 0.85), rgba(10, 10, 15, 0.9));
                    backdrop-filter: blur(50px) saturate(200%);
                    border: 1px solid rgba(193, 162, 255, 0.3);
                    border-radius: 32px;
                    padding: 10px 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(193, 162, 255, 0.2);
                    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                    min-width: 800px;
                    max-width: 1200px;
                }
                
                .unified-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex-shrink: 0;
                }
                
                .unified-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, rgba(193, 162, 255, 0.08), rgba(193, 162, 255, 0.04));
                    border: 1px solid rgba(193, 162, 255, 0.15);
                    text-decoration: none;
                    color: #EAEAEA;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    font-size: 13px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                
                .unified-nav-link:hover {
                    transform: translateY(-1px);
                    border-color: rgba(193, 162, 255, 0.35);
                    box-shadow: 0 4px 16px rgba(193, 162, 255, 0.25);
                    color: #F5F5F5;
                }
                
                .unified-nav-link.active {
                    background: linear-gradient(135deg, rgba(193, 162, 255, 0.2), rgba(193, 162, 255, 0.12));
                    border-color: rgba(193, 162, 255, 0.4);
                    color: #C1A2FF;
                    box-shadow: 0 4px 16px rgba(193, 162, 255, 0.3);
                }
                
                .unified-nav-icon {
                    font-size: 16px;
                    filter: drop-shadow(0 0 4px rgba(193, 162, 255, 0.4));
                }
                
                .unified-nav-search {
                    flex: 1;
                    position: relative;
                    min-width: 0;
                }
                
                .unified-search-bar {
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(193, 162, 255, 0.2);
                    border-radius: 20px;
                    padding: 8px 16px;
                    transition: all 0.3s ease;
                }
                
                .unified-search-bar:focus-within {
                    border-color: rgba(193, 162, 255, 0.5);
                    box-shadow: 0 0 20px rgba(193, 162, 255, 0.2);
                }
                
                .unified-search-input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: #EAEAEA;
                    font-size: 14px;
                    outline: none;
                    padding: 0 12px;
                }
                
                .unified-search-input::placeholder {
                    color: #A0A0A0;
                }
                
                .unified-search-btn {
                    background: none;
                    border: none;
                    color: #C1A2FF;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s ease;
                }
                
                .unified-search-btn:hover {
                    color: #B38DFF;
                    transform: scale(1.1);
                }
                
                .unified-search-btn svg {
                    width: 18px;
                    height: 18px;
                }
                
                .unified-nav-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    background: rgba(193, 162, 255, 0.1);
                    border: 1px solid rgba(193, 162, 255, 0.2);
                    border-radius: 16px;
                    font-size: 12px;
                    color: #C1A2FF;
                }
                
                .unified-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #22c55e;
                    animation: pulse 2s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .unified-search-results {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: rgba(18, 24, 40, 0.95);
                    backdrop-filter: blur(32px);
                    border: 1px solid rgba(193, 162, 255, 0.3);
                    border-radius: 16px;
                    padding: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }
                
                .unified-search-result-item {
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 4px;
                }
                
                .unified-search-result-item:hover {
                    background: rgba(193, 162, 255, 0.1);
                }
                
                @media (max-width: 968px) {
                    .unified-nav-bar {
                        min-width: auto;
                        max-width: calc(100vw - 40px);
                        padding: 8px 12px;
                        gap: 8px;
                    }
                    
                    .unified-nav-text {
                        display: none;
                    }
                    
                    .unified-nav-search {
                        min-width: 150px;
                    }
                }
            `;
            document.head.appendChild(style);
        },
        
        setActiveLink() {
            const links = document.querySelectorAll('.unified-nav-link');
            links.forEach(link => {
                const page = link.getAttribute('data-page');
                if (this.currentPage.includes(page) || page.includes(this.currentPage)) {
                    link.classList.add('active');
                }
            });
        },
        
        setupAtlasSearch() {
            const input = document.getElementById('unified-search-input');
            const btn = document.getElementById('unified-search-btn');
            const results = document.getElementById('unified-search-results');
            
            if (!input || !btn) return;
            
            // Cmd/Ctrl+K to focus
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    input.focus();
                }
            });
            
            // Search on Enter
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(input.value);
                }
            });
            
            // Search on button click
            btn.addEventListener('click', () => {
                this.performSearch(input.value);
            });
            
            // Show/hide results on focus
            input.addEventListener('focus', () => {
                if (results) results.style.display = 'block';
            });
            
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !results.contains(e.target)) {
                    if (results) results.style.display = 'none';
                }
            });
        },
        
        async performSearch(query) {
            if (!query.trim()) return;
            
            const results = document.getElementById('unified-search-results');
            if (!results) return;
            
            results.innerHTML = '<div style="padding: 20px; text-align: center; color: #A0A0A0;">Searching...</div>';
            results.style.display = 'block';
            
            // Simple search implementation
            const searchResults = this.searchProducts(query);
            
            if (searchResults.length === 0) {
                results.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <p style="color: #A0A0A0; margin-bottom: 12px;">No results found for "${query}"</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <a href="${this.getRelativePath('karma-ac.html')}" style="padding: 12px; background: rgba(193, 162, 255, 0.1); border-radius: 8px; color: #C1A2FF; text-decoration: none;">💬 Discuss with Karma AC</a>
                            <a href="${this.getRelativePath('realm')}" style="padding: 12px; background: rgba(193, 162, 255, 0.1); border-radius: 8px; color: #C1A2FF; text-decoration: none;">💬 Discuss on Realm</a>
                            <a href="${this.getRelativePath('neuroblock').replace('index.html', '')}submit.html" style="padding: 12px; background: rgba(193, 162, 255, 0.1); border-radius: 8px; color: #C1A2FF; text-decoration: none;">🧩 Submit as NeuroBlock</a>
                        </div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            searchResults.forEach(result => {
                html += `
                    <div class="unified-search-result-item" onclick="window.location.href='${result.url}'">
                        <div style="font-weight: 600; color: #EAEAEA; margin-bottom: 4px;">${result.title}</div>
                        <div style="font-size: 12px; color: #A0A0A0;">${result.description}</div>
                    </div>
                `;
            });
            
            results.innerHTML = html;
        },
        
        searchProducts(query) {
            const products = [
                { title: 'TD1.MEM', description: 'AI Memory-as-a-Service', url: 'PRODUCTS_INDEX.html#td1-mem' },
                { title: 'TD1.STATE', description: 'Emotional State Engine', url: 'PRODUCTS_INDEX.html#td1-state' },
                { title: 'TD1.ROUTER', description: 'Multi-Model Router', url: 'PRODUCTS_INDEX.html#td1-router' },
                { title: 'TD1.GRAPH', description: 'Graph Knowledge Engine', url: 'PRODUCTS_INDEX.html#td1-graph' },
                { title: 'TD1.MIRROR', description: 'Perspective Transformation', url: 'PRODUCTS_INDEX.html#td1-mirror' },
                { title: 'TD1.INTENT', description: 'Intent & Emotion Parser', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-intent' },
                { title: 'Karma AC', description: 'Autonomous AI Companion', url: this.getRelativePath('karma-ac.html') },
                { title: 'NeuroBlock', description: 'AI Block Marketplace', url: this.getRelativePath('neuroblock') },
                { title: 'Realm', description: 'Community Discussion', url: this.getRelativePath('realm') },
                { title: 'Atlas', description: 'Spatial Navigation', url: this.getRelativePath('atlas') }
            ];
            
            const q = query.toLowerCase();
            return products.filter(p => 
                p.title.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q)
            ).slice(0, 5);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UnifiedNav.init());
    } else {
        UnifiedNav.init();
    }
    
    // Export
    window.UnifiedNav = UnifiedNav;
})();

