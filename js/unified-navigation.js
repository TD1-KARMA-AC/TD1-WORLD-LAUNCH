// TD1.WORLD Unified Navigation with Atlas Integration
// Works on ALL pages - consistent navigation everywhere
// Version: 12 - Full premium nav bar on all pages including Neuroblock

(function() {
    'use strict';
    
    const UnifiedNav = {
        currentPage: window.location.pathname.split('/').pop() || 'index.html',
        
        // Helper to get relative path (same logic as createNav)
        getRelativePath(target) {
            // More precise detection - check actual directory structure (case-insensitive)
            const currentPath = window.location.pathname;
            const currentPathLower = currentPath.toLowerCase();
            const pathParts = currentPathLower.split('/').filter(p => p);
            const currentPageName = pathParts[pathParts.length - 1] || '';
            
            // More precise detection - check actual directory structure
            // Root is: /, /index.html, or empty pathParts
            const isRoot = currentPathLower === '/' || 
                          currentPathLower === '/index.html' || 
                          (pathParts.length === 1 && (pathParts[0] === 'index.html' || pathParts[0] === '')) ||
                          (pathParts.length === 0) ||
                          (!pathParts.includes('website') && !pathParts.includes('neuroblock') && !pathParts.includes('realm') && !pathParts.includes('atlas') && !pathParts.includes('karma-ac') && currentPageName !== 'products_index.html' && currentPageName !== 'about.html');
            
            const isWebsite = pathParts.includes('website');
            const isNeuroblock = pathParts.includes('neuroblock'); // Case-insensitive check
            const isRealm = pathParts.includes('realm');
            const isAtlas = pathParts.includes('atlas');
            
            if (isNeuroblock) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return '../website/ABOUT.html';
                if (target === 'karma-ac.html') return '../karma-ac.html';
                if (target === 'neuroblock') return './index.html'; // Stay on Neuroblock page
                if (target === 'realm') return '../realm/index.html';
                if (target === 'atlas') return '../atlas/index.html';
            } else if (isWebsite) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return 'PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return 'ABOUT.html';
                if (target === 'karma-ac.html') return '../karma-ac.html';
                if (target === 'neuroblock') return '../Neuroblock/index.html';
                if (target === 'realm') return '../realm/index.html';
                if (target === 'atlas') return '../atlas/index.html';
            } else if (isRealm) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return '../website/ABOUT.html';
                if (target === 'karma-ac.html') return '../karma-ac.html';
                if (target === 'neuroblock') return '../Neuroblock/index.html';
                if (target === 'realm') return 'index.html';
                if (target === 'atlas') return '../atlas/index.html';
            } else if (isAtlas) {
                if (target === 'index.html') return '../index.html';
                if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return '../website/ABOUT.html';
                if (target === 'karma-ac.html') return '../karma-ac.html';
                if (target === 'neuroblock') return '../Neuroblock/index.html';
                if (target === 'realm') return '../realm/index.html';
                if (target === 'atlas') return 'index.html';
            } else {
                // Root level - ALWAYS return root paths
                if (target === 'index.html') return '/index.html'; // Use absolute path to ensure root
                if (target === 'PRODUCTS_INDEX.html') return 'website/PRODUCTS_INDEX.html';
                if (target === 'ABOUT.html') return 'website/ABOUT.html';
                if (target === 'karma-ac.html') return 'karma-ac.html';
                if (target === 'neuroblock') {
                    // Try both cases for compatibility
                    const neuroblockPath = 'Neuroblock/index.html';
                    return neuroblockPath;
                }
                if (target === 'realm') return 'realm/index.html';
                if (target === 'atlas') return 'atlas/index.html';
            }
            return target;
        },
        
        init() {
            console.log('UnifiedNav.init() called');
            try {
                this.createNav();
                this.setupAtlasSearch();
                this.setActiveLink();
                console.log('UnifiedNav.init() completed successfully');
            } catch (e) {
                console.error('Error in UnifiedNav.init():', e);
                throw e;
            }
        },
        
        createNav() {
            // Remove ALL old nav elements (but keep nav-secondary for Neuroblock pages)
            // Do this FIRST before creating new nav
            const allNavs = document.querySelectorAll('nav');
            allNavs.forEach(nav => {
                // Keep nav-secondary and unified-nav-bar, remove everything else
                if (!nav.classList.contains('nav-secondary') && !nav.classList.contains('unified-nav-bar')) {
                    console.log('Removing old nav element:', nav);
                    nav.remove();
                }
            });
            
            // Also remove any old unified-nav-bar that might exist
            const oldUnifiedNav = document.getElementById('unified-nav-bar');
            if (oldUnifiedNav && oldUnifiedNav.parentNode) {
                oldUnifiedNav.remove();
            }
            
            // Remove any nav with class "nav" that's not unified-nav-bar or nav-secondary
            const oldNavClass = document.querySelectorAll('nav.nav:not(.unified-nav-bar):not(.nav-secondary)');
            oldNavClass.forEach(nav => {
                console.log('Removing old nav.nav element:', nav);
                nav.remove();
            });
            
            // Detect current page location to fix paths - more precise detection (case-insensitive)
            const currentPath = window.location.pathname;
            const currentPathLower = currentPath.toLowerCase();
            const pathParts = currentPathLower.split('/').filter(p => p);
            const currentPageName = pathParts[pathParts.length - 1] || '';
            
            // More precise detection - check actual directory structure
            // Root is: /, /index.html, or empty pathParts
            const isRoot = currentPathLower === '/' || 
                          currentPathLower === '/index.html' || 
                          (pathParts.length === 1 && (pathParts[0] === 'index.html' || pathParts[0] === '')) ||
                          (pathParts.length === 0) ||
                          (!pathParts.includes('website') && !pathParts.includes('neuroblock') && !pathParts.includes('realm') && !pathParts.includes('atlas') && !pathParts.includes('karma-ac') && currentPageName !== 'products_index.html' && currentPageName !== 'about.html');
            
            const isWebsite = pathParts.includes('website');
            const isNeuroblock = pathParts.includes('neuroblock'); // Case-insensitive check
            const isRealm = pathParts.includes('realm');
            const isAtlas = pathParts.includes('atlas');
            
            // Calculate correct paths based on current location
            const getPath = (target) => {
                if (isNeuroblock) {
                    // Inside Neuroblock folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return '../website/ABOUT.html';
                    if (target === 'karma-ac.html') return '../karma-ac.html';
                    if (target === 'neuroblock') return './index.html'; // Stay on Neuroblock page
                    if (target === 'realm') return '../realm/index.html';
                    if (target === 'atlas') return '../atlas/index.html';
                } else if (isWebsite) {
                    // Inside website folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return 'PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return 'ABOUT.html';
                    if (target === 'karma-ac.html') return '../karma-ac.html';
                    if (target === 'neuroblock') return '../Neuroblock/index.html';
                    if (target === 'realm') return '../realm/index.html';
                    if (target === 'atlas') return '../atlas/index.html';
                } else if (isRealm) {
                    // Inside realm folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return '../website/ABOUT.html';
                    if (target === 'karma-ac.html') return '../karma-ac.html';
                    if (target === 'neuroblock') return '../Neuroblock/index.html';
                    if (target === 'realm') return 'index.html';
                    if (target === 'atlas') return '../atlas/index.html';
                } else if (isAtlas) {
                    // Inside atlas folder
                    if (target === 'index.html') return '../index.html';
                    if (target === 'PRODUCTS_INDEX.html') return '../website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return '../website/ABOUT.html';
                    if (target === 'karma-ac.html') return '../karma-ac.html';
                    if (target === 'neuroblock') return '../Neuroblock/index.html';
                    if (target === 'realm') return '../realm/index.html';
                    if (target === 'atlas') return 'index.html';
                } else {
                    // Root level - ALWAYS return root paths
                    if (target === 'index.html') return '/index.html'; // Use absolute path to ensure root
                    if (target === 'PRODUCTS_INDEX.html') return 'website/PRODUCTS_INDEX.html';
                    if (target === 'ABOUT.html') return 'website/ABOUT.html';
                    if (target === 'karma-ac.html') return 'karma-ac.html';
                    if (target === 'neuroblock') {
                        // Use the correct path - check if Neuroblock folder exists (capital N)
                        // If not found, try lowercase neuroblock
                        return 'Neuroblock/index.html';
                    }
                    if (target === 'realm') return 'realm/index.html';
                    if (target === 'atlas') return 'atlas/index.html';
                }
                return target;
            };
            
            // Find or create nav container - MUST be first child of body
            let navContainer = document.getElementById('unified-nav-container');
            if (!navContainer) {
                navContainer = document.createElement('div');
                navContainer.id = 'unified-nav-container';
                navContainer.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1001; width: 100%; max-width: 1200px; padding: 0 20px; box-sizing: border-box;';
                // Insert at the very beginning of body
                if (document.body.firstChild) {
                    document.body.insertBefore(navContainer, document.body.firstChild);
                } else {
                    document.body.appendChild(navContainer);
                }
            } else {
                // Clear existing content but keep container
                navContainer.innerHTML = '';
                navContainer.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1001; width: 100%; max-width: 1200px; padding: 0 20px; box-sizing: border-box;';
                // Move to first position if not already
                if (navContainer.parentNode && navContainer !== navContainer.parentNode.firstChild) {
                    navContainer.parentNode.insertBefore(navContainer, navContainer.parentNode.firstChild);
                }
            }
            
            // Create nav bar
            const nav = document.createElement('nav');
            nav.className = 'unified-nav-bar';
            nav.id = 'unified-nav-bar';
            
            // Always show full premium navigation bar on all pages
            const currentPageName = window.location.pathname.split('/').pop() || 'index.html';
            
            console.log('Creating nav - isNeuroblock:', isNeuroblock, 'currentPageName:', currentPageName);
            
            // Full premium nav for all pages (including Neuroblock)
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
            
            // Remove ALL old nav elements (including secondary nav) - now integrated into unified nav
            const oldSecondaryNav = document.querySelector('nav.nav-secondary');
            if (oldSecondaryNav) {
                console.log('Removing old secondary nav:', oldSecondaryNav);
                oldSecondaryNav.remove();
            }
            
            // Also remove any nav elements that might be interfering
            const allOldNavs = document.querySelectorAll('nav:not(.unified-nav-bar)');
            allOldNavs.forEach(oldNav => {
                if (oldNav.id !== 'unified-nav-bar' && !oldNav.classList.contains('unified-nav-bar')) {
                    console.log('Removing interfering nav element:', oldNav);
                    oldNav.remove();
                }
            });
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
                    min-width: 600px;
                    max-width: 1200px;
                    width: fit-content;
                }
                
                @media (max-width: 768px) {
                    #unified-nav-container {
                        padding: 0 10px !important;
                        top: 10px !important;
                    }
                    
                    .unified-nav-bar {
                        min-width: auto !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 8px 12px !important;
                        gap: 8px !important;
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                        border-radius: 20px !important;
                    }
                    
                    .unified-nav-links {
                        flex-wrap: wrap !important;
                        gap: 4px !important;
                        justify-content: center !important;
                        width: 100% !important;
                    }
                    
                    .unified-nav-link {
                        padding: 6px 10px !important;
                        font-size: 11px !important;
                        flex: 0 0 auto !important;
                    }
                    
                    .unified-nav-icon {
                        display: none !important;
                    }
                    
                    .unified-nav-text {
                        font-size: 11px !important;
                    }
                    
                    .unified-nav-search {
                        min-width: auto !important;
                        width: 100% !important;
                        order: 3 !important;
                        margin-top: 8px !important;
                    }
                    
                    .unified-search-bar {
                        width: 100% !important;
                    }
                    
                    .unified-search-input {
                        font-size: 12px !important;
                        padding: 6px 10px !important;
                    }
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
            const currentPath = window.location.pathname.toLowerCase();
            const currentPageName = currentPath.split('/').pop() || 'index.html';
            const pathParts = currentPath.split('/').filter(p => p);
            const isNeuroblock = pathParts.includes('neuroblock');
            
            links.forEach(link => {
                const page = link.getAttribute('data-page');
                const href = link.getAttribute('href') || '';
                
                // Remove active class first
                link.classList.remove('active');
                
                // Special handling for Neuroblock link
                if (page === 'neuroblock' && isNeuroblock) {
                    link.classList.add('active');
                    return;
                }
                
                // Check if this link matches current page
                if (page && (currentPath.includes(page.toLowerCase()) || currentPageName.includes(page.toLowerCase()))) {
                    link.classList.add('active');
                } else if (href && (currentPath.endsWith(href) || currentPageName === href.split('/').pop())) {
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
                            <a href="${this.getRelativePath('neuroblock').replace(/index\.html$/, '')}submit.html" style="padding: 12px; background: rgba(193, 162, 255, 0.1); border-radius: 8px; color: #C1A2FF; text-decoration: none;">🧩 Submit as NeuroBlock</a>
                        </div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            searchResults.forEach(result => {
                // Fix Neuroblock paths - ensure they work both locally and online
                let resultUrl = result.url;
                if (resultUrl && (resultUrl.includes('Neuroblock') || resultUrl.includes('neuroblock'))) {
                    // Normalize the path - ensure it uses the correct case
                    resultUrl = resultUrl.replace(/neuroblock/gi, 'Neuroblock');
                }
                html += `
                    <a href="${resultUrl}" class="unified-search-result-item" style="text-decoration: none; display: block;">
                        <div style="font-weight: 600; color: #EAEAEA; margin-bottom: 4px;">${result.title}</div>
                        <div style="font-size: 12px; color: #A0A0A0;">${result.description}</div>
                    </a>
                `;
            });
            
            results.innerHTML = html;
        },
        
        searchProducts(query) {
            // Use getRelativePath for all URLs to ensure correct paths based on current location
            const products = [
                { title: 'TD1.MEM', description: 'AI Memory-as-a-Service', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-mem' },
                { title: 'TD1.STATE', description: 'Emotional State Engine', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-state' },
                { title: 'TD1.ROUTER', description: 'Multi-Model Router', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-router' },
                { title: 'TD1.GRAPH', description: 'Graph Knowledge Engine', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-graph' },
                { title: 'TD1.MIRROR', description: 'Perspective Transformation', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-mirror' },
                { title: 'TD1.INTENT', description: 'Intent & Emotion Parser', url: this.getRelativePath('PRODUCTS_INDEX.html') + '#td1-intent' },
                { title: 'Karma AC', description: 'Autonomous AI Companion', url: this.getRelativePath('karma-ac.html') },
                { title: 'NeuroBlock', description: 'AI Block Marketplace', url: this.getRelativePath('neuroblock') || 'Neuroblock/index.html' },
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
    
    // Export first so it's available immediately
    window.UnifiedNav = UnifiedNav;
    
    // Initialize when DOM is ready - with retry logic
    function initializeNav() {
        // Wait for body to exist
        if (!document.body) {
            setTimeout(initializeNav, 50);
            return;
        }
        
        // Check if container exists or create it
        let container = document.getElementById('unified-nav-container');
        if (!container) {
            // Create container if it doesn't exist
            container = document.createElement('div');
            container.id = 'unified-nav-container';
            document.body.insertBefore(container, document.body.firstChild);
        }
        
        // Initialize nav
        try {
            UnifiedNav.init();
            console.log('UnifiedNav initialized successfully');
        } catch (e) {
            console.error('Error initializing UnifiedNav:', e);
            setTimeout(initializeNav, 100);
        }
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNav);
    } else {
        // If DOM is already loaded, try immediately
        setTimeout(initializeNav, 0);
    }
    
    // Also try on window load as backup
    window.addEventListener('load', () => {
        if (!document.getElementById('unified-nav-bar')) {
            console.log('Nav not found on load, retrying...');
            initializeNav();
        }
    });
})();

