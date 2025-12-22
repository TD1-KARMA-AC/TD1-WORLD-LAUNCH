// NeuroBlock Premium Navigation Bar with Atlas Search
(function() {
    'use strict';
    
    const NeuroblockNav = {
        init() {
            this.createNav();
            this.setupAtlasSearch();
            this.setupInteractions();
        },
        
        createNav() {
            const container = document.getElementById('neuroblock-nav-container');
            if (!container) return;
            
            // Remove any existing nav
            const existingNav = container.querySelector('.neuroblock-nav');
            if (existingNav) existingNav.remove();
            
            const currentPath = window.location.pathname;
            const currentPage = currentPath.split('/').pop() || 'index.html';
            
            const nav = document.createElement('nav');
            nav.className = 'neuroblock-nav';
            nav.innerHTML = `
                <!-- Left: NeuroBlock Brand & Quick Links -->
                <div class="neuroblock-nav-left">
                    <a href="index.html" class="neuroblock-brand">
                        <span class="neuroblock-brand-icon">🧩</span>
                        <span class="neuroblock-brand-text">NeuroBlock</span>
                    </a>
                    <div class="neuroblock-nav-links">
                        <a href="index.html" class="neuroblock-nav-link ${currentPage === 'index.html' ? 'active' : ''}" data-page="index">
                            <span>Marketplace</span>
                        </a>
                        <a href="explore.html" class="neuroblock-nav-link ${currentPage === 'explore.html' ? 'active' : ''}" data-page="explore">
                            <span>Explore</span>
                        </a>
                        <a href="submit.html" class="neuroblock-nav-link ${currentPage === 'submit.html' ? 'active' : ''}" data-page="submit">
                            <span>Submit</span>
                        </a>
                        <a href="account.html" class="neuroblock-nav-link ${currentPage === 'account.html' ? 'active' : ''}" data-page="account">
                            <span>Account</span>
                        </a>
                    </div>
                </div>
                
                <!-- Center: Atlas Search (Premium) -->
                <div class="neuroblock-nav-search">
                    <div class="neuroblock-search-bar">
                        <svg class="neuroblock-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input 
                            type="text" 
                            id="neuroblock-atlas-search-input" 
                            placeholder="Search blocks, creators, or ask Atlas..." 
                            class="neuroblock-search-input"
                            autocomplete="off"
                        >
                        <kbd class="neuroblock-search-shortcut">⌘K</kbd>
                    </div>
                    <div class="neuroblock-search-results" id="neuroblock-search-results" style="display: none;"></div>
                </div>
                
                <!-- Right: Actions & Status -->
                <div class="neuroblock-nav-right">
                    <a href="../index.html" class="neuroblock-nav-action" title="Back to TD1.WORLD">
                        <span>🏠</span>
                    </a>
                    <div class="neuroblock-status">
                        <div class="neuroblock-status-dot"></div>
                        <span class="neuroblock-status-text">Live</span>
                    </div>
                </div>
            `;
            
            container.appendChild(nav);
            this.injectStyles();
        },
        
        injectStyles() {
            if (document.getElementById('neuroblock-nav-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'neuroblock-nav-styles';
            style.textContent = `
                /* NeuroBlock Premium Navigation */
                .neuroblock-nav {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    padding: 12px 20px;
                    border-radius: 48px;
                    background: rgba(15, 15, 20, 0.75);
                    backdrop-filter: blur(32px) saturate(180%);
                    border: 1px solid rgba(193, 162, 255, 0.15);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    max-width: 95vw;
                    width: fit-content;
                }
                
                .neuroblock-nav:hover {
                    border-color: rgba(193, 162, 255, 0.35);
                    box-shadow: 0 12px 48px rgba(193, 162, 255, 0.25),
                                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                    transform: translateX(-50%) translateY(-2px);
                }
                
                /* Left: Brand & Links */
                .neuroblock-nav-left {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .neuroblock-brand {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 16px;
                    color: #C1A2FF;
                    padding: 6px 12px;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }
                
                .neuroblock-brand:hover {
                    background: rgba(193, 162, 255, 0.1);
                    transform: scale(1.05);
                }
                
                .neuroblock-brand-icon {
                    font-size: 20px;
                    filter: drop-shadow(0 0 8px rgba(193, 162, 255, 0.5));
                }
                
                .neuroblock-brand-text {
                    background: linear-gradient(135deg, #C1A2FF, #B38DFF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .neuroblock-nav-links {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .neuroblock-nav-link {
                    padding: 8px 16px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: #EAEAEA;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                
                .neuroblock-nav-link::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 12px;
                    background: rgba(193, 162, 255, 0.1);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .neuroblock-nav-link:hover::before {
                    opacity: 1;
                }
                
                .neuroblock-nav-link:hover {
                    color: #C1A2FF;
                    transform: translateY(-2px);
                }
                
                .neuroblock-nav-link.active {
                    background: rgba(193, 162, 255, 0.2);
                    color: #C1A2FF;
                    border: 1px solid rgba(193, 162, 255, 0.3);
                }
                
                /* Center: Atlas Search */
                .neuroblock-nav-search {
                    position: relative;
                    min-width: 400px;
                    max-width: 500px;
                }
                
                .neuroblock-search-bar {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .neuroblock-search-bar:focus-within {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(193, 162, 255, 0.4);
                    box-shadow: 0 0 0 4px rgba(193, 162, 255, 0.1),
                                0 4px 12px rgba(193, 162, 255, 0.2);
                }
                
                .neuroblock-search-icon {
                    width: 18px;
                    height: 18px;
                    color: #9ca3af;
                    flex-shrink: 0;
                }
                
                .neuroblock-search-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #EAEAEA;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 0;
                }
                
                .neuroblock-search-input::placeholder {
                    color: #6b7280;
                }
                
                .neuroblock-search-shortcut {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #9ca3af;
                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
                }
                
                .neuroblock-search-results {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: rgba(15, 15, 20, 0.95);
                    backdrop-filter: blur(32px);
                    border: 1px solid rgba(193, 162, 255, 0.2);
                    border-radius: 16px;
                    padding: 8px;
                    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5),
                                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                    max-height: 400px;
                    overflow-y: auto;
                    z-index: 1001;
                }
                
                .neuroblock-search-result-item {
                    display: block;
                    padding: 12px 16px;
                    border-radius: 12px;
                    text-decoration: none;
                    color: #EAEAEA;
                    transition: all 0.2s ease;
                    margin-bottom: 4px;
                }
                
                .neuroblock-search-result-item:hover {
                    background: rgba(193, 162, 255, 0.15);
                    transform: translateX(4px);
                }
                
                .neuroblock-search-result-item:last-child {
                    margin-bottom: 0;
                }
                
                .neuroblock-search-result-title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #EAEAEA;
                    margin-bottom: 4px;
                }
                
                .neuroblock-search-result-desc {
                    font-size: 12px;
                    color: #9ca3af;
                }
                
                /* Right: Actions */
                .neuroblock-nav-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .neuroblock-nav-action {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-decoration: none;
                    color: #EAEAEA;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }
                
                .neuroblock-nav-action:hover {
                    background: rgba(193, 162, 255, 0.15);
                    border-color: rgba(193, 162, 255, 0.3);
                    transform: scale(1.1);
                }
                
                .neuroblock-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 12px;
                }
                
                .neuroblock-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #10b981;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .neuroblock-status-text {
                    font-size: 12px;
                    font-weight: 600;
                    color: #10b981;
                }
                
                /* Responsive */
                @media (max-width: 1024px) {
                    .neuroblock-nav-search {
                        min-width: 300px;
                        max-width: 350px;
                    }
                }
                
                @media (max-width: 768px) {
                    .neuroblock-nav {
                        flex-wrap: wrap;
                        gap: 12px;
                        padding: 10px 16px;
                        max-width: calc(100vw - 20px);
                    }
                    
                    .neuroblock-nav-left {
                        flex-wrap: wrap;
                        gap: 12px;
                    }
                    
                    .neuroblock-nav-links {
                        order: 3;
                        width: 100%;
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    
                    .neuroblock-nav-search {
                        order: 2;
                        min-width: 100%;
                        max-width: 100%;
                    }
                    
                    .neuroblock-nav-right {
                        order: 1;
                    }
                    
                    .neuroblock-search-shortcut {
                        display: none;
                    }
                }
            `;
            
            document.head.appendChild(style);
        },
        
        setupAtlasSearch() {
            const input = document.getElementById('neuroblock-atlas-search-input');
            const results = document.getElementById('neuroblock-search-results');
            
            if (!input || !results) return;
            
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
            
            // Real-time search as user types
            let searchTimeout;
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length === 0) {
                    results.style.display = 'none';
                    return;
                }
                
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            });
            
            // Show/hide results on focus
            input.addEventListener('focus', () => {
                if (input.value.trim().length > 0) {
                    results.style.display = 'block';
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !results.contains(e.target)) {
                    results.style.display = 'none';
                }
            });
        },
        
        async performSearch(query) {
            if (!query.trim()) return;
            
            const results = document.getElementById('neuroblock-search-results');
            if (!results) return;
            
            results.innerHTML = '<div style="padding: 20px; text-align: center; color: #A0A0A0;">Searching...</div>';
            results.style.display = 'block';
            
            // Search NeuroBlocks
            const neuroblockResults = this.searchNeuroblocks(query);
            
            // Search TD1 Products
            const productResults = this.searchProducts(query);
            
            // Combine results
            const allResults = [...neuroblockResults, ...productResults].slice(0, 8);
            
            if (allResults.length === 0) {
                results.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <p style="color: #A0A0A0; margin-bottom: 12px;">No results found for "${query}"</p>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <a href="submit.html" style="padding: 12px; background: rgba(193, 162, 255, 0.1); border-radius: 8px; color: #C1A2FF; text-decoration: none; text-align: center;">🧩 Submit as NeuroBlock</a>
                            <a href="../index.html" style="padding: 12px; background: rgba(193, 162, 255, 0.1); border-radius: 8px; color: #C1A2FF; text-decoration: none; text-align: center;">🏠 Back to TD1.WORLD</a>
                        </div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            allResults.forEach(result => {
                html += `
                    <a href="${result.url}" class="neuroblock-search-result-item">
                        <div class="neuroblock-search-result-title">${result.icon || '🧩'} ${result.title}</div>
                        <div class="neuroblock-search-result-desc">${result.description}</div>
                    </a>
                `;
            });
            
            results.innerHTML = html;
        },
        
        searchNeuroblocks(query) {
            try {
                const blocks = JSON.parse(localStorage.getItem('neuroblocks') || '[]');
                const q = query.toLowerCase();
                
                return blocks
                    .filter(block => 
                        block.name.toLowerCase().includes(q) ||
                        block.description.toLowerCase().includes(q) ||
                        block.creator.toLowerCase().includes(q) ||
                        (block.tags && block.tags.some(tag => tag.toLowerCase().includes(q)))
                    )
                    .slice(0, 5)
                    .map(block => ({
                        title: block.name,
                        description: block.description.substring(0, 60) + '...',
                        url: `product.html?id=${block.id}`,
                        icon: '🧩'
                    }));
            } catch (e) {
                return [];
            }
        },
        
        searchProducts(query) {
            const products = [
                { title: 'TD1.MEM', description: 'AI Memory-as-a-Service', url: '../website/PRODUCTS_INDEX.html#td1-mem', icon: '🧠' },
                { title: 'TD1.STATE', description: 'Emotional State Engine', url: '../website/PRODUCTS_INDEX.html#td1-state', icon: '💭' },
                { title: 'TD1.ROUTER', description: 'Multi-Model Router', url: '../website/PRODUCTS_INDEX.html#td1-router', icon: '🔄' },
                { title: 'TD1.GRAPH', description: 'Graph Knowledge Engine', url: '../website/PRODUCTS_INDEX.html#td1-graph', icon: '🕸️' },
                { title: 'Karma AC', description: 'Autonomous AI Companion', url: '../karma-ac.html', icon: '⚡' }
            ];
            
            const q = query.toLowerCase();
            return products
                .filter(p => 
                    p.title.toLowerCase().includes(q) || 
                    p.description.toLowerCase().includes(q)
                )
                .slice(0, 3);
        },
        
        setupInteractions() {
            // Smooth scroll and interactions
            document.querySelectorAll('.neuroblock-nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    // Remove active from all
                    document.querySelectorAll('.neuroblock-nav-link').forEach(l => l.classList.remove('active'));
                    // Add active to clicked
                    link.classList.add('active');
                });
            });
        }
    };
    
    // Export
    window.NeuroblockNav = NeuroblockNav;
    
    // Initialize when DOM is ready
    function initializeNav() {
        if (document.body) {
            NeuroblockNav.init();
        } else {
            setTimeout(initializeNav, 50);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNav);
    } else {
        initializeNav();
    }
})();

