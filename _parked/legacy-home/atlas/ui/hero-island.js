/**
 * Hero Dynamic Island Bar
 * 
 * Unique hero-specific navigation/search bar inspired by Karma AC's dynamic island.
 * Static but premium - not reactive, but distinctive.
 */

export class HeroIslandBar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isExpanded = false;
        this.init();
    }

    /**
     * Initialize the hero island bar
     */
    init() {
        this.render();
        this.setupInteractions();
    }

    /**
     * Render the hero island bar
     */
    render() {
        this.container.innerHTML = `
            <div class="hero-island-container">
                <div class="hero-island-bar" id="hero-island-bar">
                    <!-- Left: Quick Nav Pills -->
                    <div class="hero-island-nav">
                        <a href="PRODUCTS_INDEX.html" class="hero-island-nav-item" data-tooltip="Products">
                            <span class="hero-island-icon">📦</span>
                        </a>
                        <a href="/neuroblock" class="hero-island-nav-item" data-tooltip="NeuroBlocks">
                            <span class="hero-island-icon">🧩</span>
                        </a>
                        <a href="/realm" class="hero-island-nav-item" data-tooltip="Realm">
                            <span class="hero-island-icon">💬</span>
                        </a>
                        <a href="karma-ac.html" class="hero-island-nav-item" data-tooltip="Karma AC">
                            <span class="hero-island-icon">⚡</span>
                        </a>
                    </div>

                    <!-- Center: Atlas Search (Premium) -->
                    <div class="hero-island-search">
                        <div class="hero-island-search-bar">
                            <input 
                                type="text" 
                                id="hero-island-search-input" 
                                placeholder="Search products, blocks, or ask..." 
                                class="hero-island-search-input"
                                autocomplete="off"
                            >
                            <button class="hero-island-search-btn" id="hero-island-search-btn" aria-label="Search">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="hero-island-search-results" id="hero-island-search-results" style="display: none;"></div>
                    </div>

                    <!-- Right: Status Indicator -->
                    <div class="hero-island-status">
                        <div class="hero-island-status-dot"></div>
                        <span class="hero-island-status-text">Ready</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup interactions
     */
    setupInteractions() {
        const input = document.getElementById('hero-island-search-input');
        const searchBtn = document.getElementById('hero-island-search-btn');
        const islandBar = document.getElementById('hero-island-bar');

        // Search on Enter
        if (input) {
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.performSearch();
                }
            });

            // Expand on focus
            input.addEventListener('focus', () => {
                islandBar.classList.add('expanded');
                this.isExpanded = true;
            });

            input.addEventListener('blur', () => {
                // Don't collapse if results are showing
                const results = document.getElementById('hero-island-search-results');
                if (!results || results.style.display === 'none') {
                    islandBar.classList.remove('expanded');
                    this.isExpanded = false;
                }
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
                const results = document.getElementById('hero-island-search-results');
                if (results) {
                    results.style.display = 'none';
                }
                islandBar.classList.remove('expanded');
                this.isExpanded = false;
            }
        });
    }

    /**
     * Perform search
     */
    async performSearch() {
        const input = document.getElementById('hero-island-search-input');
        const query = input.value.trim();
        const results = document.getElementById('hero-island-search-results');

        if (!query) {
            if (results) results.style.display = 'none';
            return;
        }

        // Show loading
        if (results) {
            results.innerHTML = '<div class="hero-island-loading">Searching...</div>';
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
                results.innerHTML = '<div class="hero-island-error">Error performing search</div>';
            }
        }
    }

    /**
     * Render search results
     */
    renderResults(data) {
        const results = document.getElementById('hero-island-search-results');
        if (!results) return;

        let html = '';

        // Products
        if (data.products && data.products.length > 0) {
            html += `
                <div class="hero-island-results-section">
                    <h3 class="hero-island-results-title">Products</h3>
                    <div class="hero-island-results-list">
                        ${data.products.slice(0, 3).map(product => `
                            <a href="${product.url}" class="hero-island-result-item">
                                <h4>${product.title}</h4>
                                <p>${(product.summary || '').substring(0, 60)}...</p>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // NeuroBlocks (blocks)
        if (data.blocks && data.blocks.length > 0) {
            html += `
                <div class="hero-island-results-section">
                    <h3 class="hero-island-results-title">NeuroBlocks</h3>
                    <div class="hero-island-results-list">
                        ${data.blocks.slice(0, 3).map(block => `
                            <a href="${block.url}" class="hero-island-result-item">
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
                <div class="hero-island-results-section">
                    <h3 class="hero-island-results-title">💡 Suggestions</h3>
                    <div class="hero-island-suggestions-list">
                        ${data.suggestions.map(suggestion => `
                            <a href="${suggestion.action}" class="hero-island-suggestion-item">
                                <span class="hero-island-suggestion-icon">${suggestion.icon}</span>
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
            const query = document.getElementById('hero-island-search-input').value;
            html = `
                <div class="hero-island-no-results">
                    <div class="hero-island-suggestions-list">
                        <a href="karma-ac.html" class="hero-island-suggestion-item">
                            <span class="hero-island-suggestion-icon">🤖</span>
                            <div>
                                <h4>Create with Karma AC</h4>
                                <p>Discuss how to build "${query.substring(0, 30)}..."</p>
                            </div>
                        </a>
                        <a href="/realm" class="hero-island-suggestion-item">
                            <span class="hero-island-suggestion-icon">💬</span>
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

