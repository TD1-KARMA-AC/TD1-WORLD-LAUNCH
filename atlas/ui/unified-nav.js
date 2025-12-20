/**
 * Unified Navigation Bar
 * 
 * Merges the top nav and hero island into one clean, premium navigation bar
 */

export class UnifiedNavBar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isExpanded = false;
        this.init();
    }

    /**
     * Initialize the unified nav bar
     */
    init() {
        this.render();
        this.setupInteractions();
    }

    /**
     * Render the unified nav bar
     */
    render() {
        this.container.innerHTML = `
            <nav class="unified-nav-bar" id="unified-nav-bar">
                <!-- Left: Navigation Links -->
                <div class="unified-nav-links">
                    <a href="index.html" class="unified-nav-link active" data-tooltip="Home">
                        <span class="unified-nav-icon">🏠</span>
                        <span class="unified-nav-text">Home</span>
                    </a>
                    <a href="PRODUCTS_INDEX.html" class="unified-nav-link" data-tooltip="Products">
                        <span class="unified-nav-icon">📦</span>
                        <span class="unified-nav-text">Products</span>
                    </a>
                    <a href="/neuroblock" class="unified-nav-link" data-tooltip="NeuroBlocks">
                        <span class="unified-nav-icon">🧩</span>
                        <span class="unified-nav-text">NeuroBlock</span>
                    </a>
                    <a href="/realm" class="unified-nav-link" data-tooltip="Realm">
                        <span class="unified-nav-icon">💬</span>
                        <span class="unified-nav-text">Realm</span>
                    </a>
                    <a href="karma-ac.html" class="unified-nav-link" data-tooltip="Karma AC">
                        <span class="unified-nav-icon">⚡</span>
                        <span class="unified-nav-text">Karma AC</span>
                    </a>
                    <a href="ABOUT.html" class="unified-nav-link" data-tooltip="About">
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
            </nav>
        `;
    }

    /**
     * Setup interactions
     */
    setupInteractions() {
        const input = document.getElementById('unified-search-input');
        const searchBtn = document.getElementById('unified-search-btn');
        const navBar = document.getElementById('unified-nav-bar');

        // Search on Enter
        if (input) {
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.performSearch();
                }
            });

            // Expand on focus
            input.addEventListener('focus', () => {
                navBar.classList.add('expanded');
                this.isExpanded = true;
            });

            input.addEventListener('blur', () => {
                // Don't collapse if results are showing
                const results = document.getElementById('unified-search-results');
                if (!results || results.style.display === 'none') {
                    setTimeout(() => {
                        navBar.classList.remove('expanded');
                        this.isExpanded = false;
                    }, 200);
                }
            });

            // Real-time search as user types
            let searchTimeout;
            input.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch();
                }, 300);
            });
        }

        // Search button
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                await this.performSearch();
            });
        }

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                const results = document.getElementById('unified-search-results');
                if (results) {
                    results.style.display = 'none';
                }
                navBar.classList.remove('expanded');
                this.isExpanded = false;
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (input) input.focus();
            }
            if (e.key === 'Escape' && this.isExpanded) {
                if (input) input.blur();
                const results = document.getElementById('unified-search-results');
                if (results) results.style.display = 'none';
            }
        });
    }

    /**
     * Perform search
     */
    async performSearch() {
        const input = document.getElementById('unified-search-input');
        const query = input.value.trim();
        const results = document.getElementById('unified-search-results');

        if (!query) {
            if (results) results.style.display = 'none';
            return;
        }

        // Show loading
        if (results) {
            results.innerHTML = '<div class="unified-search-loading">Searching...</div>';
            results.style.display = 'block';
        }

        try {
            // Import and use Atlas search
            const { AtlasWebsiteIntegration } = await import('../website-integration.js');
            const integration = new AtlasWebsiteIntegration();
            const searchResults = await integration.search(query);
            
            this.renderResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            if (results) {
                results.innerHTML = '<div class="unified-search-error">Error performing search</div>';
            }
        }
    }

    /**
     * Render search results
     */
    renderResults(data) {
        const results = document.getElementById('unified-search-results');
        if (!results) return;

        let html = '';

        // Products
        if (data.products && data.products.length > 0) {
            html += `
                <div class="unified-results-section">
                    <h3 class="unified-results-title">Products</h3>
                    <div class="unified-results-list">
                        ${data.products.slice(0, 3).map(product => `
                            <a href="${product.url}" class="unified-result-item">
                                <h4>${product.title}</h4>
                                <p>${(product.summary || '').substring(0, 60)}...</p>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // NeuroBlocks
        if (data.blocks && data.blocks.length > 0) {
            html += `
                <div class="unified-results-section">
                    <h3 class="unified-results-title">NeuroBlocks</h3>
                    <div class="unified-results-list">
                        ${data.blocks.slice(0, 3).map(block => `
                            <a href="${block.url}" class="unified-result-item">
                                <h4>${block.title}</h4>
                                <p>${(block.summary || '').substring(0, 60)}...</p>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Suggestions
        if (data.suggestions && data.suggestions.length > 0) {
            html += `
                <div class="unified-results-section">
                    <h3 class="unified-results-title">💡 Suggestions</h3>
                    <div class="unified-suggestions-list">
                        ${data.suggestions.map(suggestion => `
                            <a href="${suggestion.action || suggestion.url}" class="unified-suggestion-item">
                                <span class="unified-suggestion-icon">${suggestion.icon}</span>
                                <div>
                                    <h4>${suggestion.title}</h4>
                                    <p>${suggestion.description}</p>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (!html) {
            const query = document.getElementById('unified-search-input').value;
            html = `
                <div class="unified-no-results">
                    <div class="unified-suggestions-list">
                        <a href="karma-ac.html" class="unified-suggestion-item">
                            <span class="unified-suggestion-icon">🤖</span>
                            <div>
                                <h4>Create with Karma AC</h4>
                                <p>Discuss how to build "${query.substring(0, 30)}..."</p>
                            </div>
                        </a>
                        <a href="/realm" class="unified-suggestion-item">
                            <span class="unified-suggestion-icon">💬</span>
                            <div>
                                <h4>Discuss on Realm</h4>
                                <p>Share your idea with the community</p>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        }

        results.innerHTML = html;
        results.style.display = 'block';
    }
}

