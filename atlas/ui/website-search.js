/**
 * Atlas Website Search Component
 * 
 * A search bar replacement that uses Atlas for intelligent navigation.
 */

export class AtlasWebsiteSearch {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.integration = null;
        this.isOpen = false;
        this.currentResults = null;
        this.init();
    }

    /**
     * Initialize integration (async)
     */
    async initIntegration() {
        if (!this.integration) {
            const { AtlasWebsiteIntegration } = await import('../website-integration.js');
            this.integration = new AtlasWebsiteIntegration();
        }
        return this.integration;
    }

    /**
     * Initialize the search component
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the search bar
     */
    render() {
        // Create container with premium styling
        this.container.innerHTML = '';
        const searchContainer = document.createElement('div');
        searchContainer.className = 'atlas-website-search';
        searchContainer.id = 'atlas-search-container';
        
        const searchBar = document.createElement('div');
        searchBar.className = 'atlas-search-bar';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'atlas-search-input';
        input.placeholder = 'Search...';
        input.className = 'atlas-search-input';
        input.autocomplete = 'off';
        
        const searchBtn = document.createElement('button');
        searchBtn.className = 'atlas-search-btn';
        searchBtn.id = 'atlas-search-btn';
        searchBtn.title = 'Search';
        searchBtn.setAttribute('aria-label', 'Search');
        searchBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
        `;
        
        const results = document.createElement('div');
        results.className = 'atlas-search-results';
        results.id = 'atlas-search-results';
        results.style.display = 'none';
        
        searchBar.appendChild(input);
        searchBar.appendChild(searchBtn);
        searchContainer.appendChild(searchBar);
        searchContainer.appendChild(results);
        this.container.appendChild(searchContainer);

        // Voice support removed for cleaner design
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const input = document.getElementById('atlas-search-input');
        const searchBtn = document.getElementById('atlas-search-btn');
        const results = document.getElementById('atlas-search-results');

        // Search on Enter
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.performSearch();
            }
        });

        // Search on button click
        searchBtn.addEventListener('click', async () => {
            await this.performSearch();
        });

        // Show results on focus
        input.addEventListener('focus', () => {
            if (this.currentResults) {
                results.style.display = 'block';
            }
        });

        // Hide results on click outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                results.style.display = 'none';
            }
        });

        // Keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                input.focus();
            }
        });
    }

    /**
     * Perform search
     */
    async performSearch() {
        const input = document.getElementById('atlas-search-input');
        const query = input.value.trim();
        const results = document.getElementById('atlas-search-results');

        if (!query) {
            results.style.display = 'none';
            return;
        }

        // Ensure integration is loaded
        await this.initIntegration();

        // Show loading
        results.innerHTML = '<div class="atlas-search-loading">Searching...</div>';
        results.style.display = 'block';

        try {
            const searchData = await this.integration.navigate(query);
            this.currentResults = searchData;
            this.renderResults(searchData.combined);
        } catch (error) {
            console.error('Search error:', error);
            results.innerHTML = '<div class="atlas-search-error">Error performing search</div>';
        }
    }

    /**
     * Render search results
     */
    renderResults(data) {
        const results = document.getElementById('atlas-search-results');
        
        let html = '';

        // Products
        if (data.products && data.products.length > 0) {
            html += `
                <div class="atlas-results-section">
                    <h3 class="atlas-results-title">Products</h3>
                    <div class="atlas-results-list">
                        ${data.products.slice(0, 4).map(product => `
                            <a href="${product.url}" class="atlas-result-item">
                                <div class="atlas-result-header">
                                    <h4>${product.title}</h4>
                                    <span class="atlas-result-type">Product</span>
                                </div>
                                ${product.summary || product.description ? `<p>${(product.summary || product.description).substring(0, 80)}${(product.summary || product.description).length > 80 ? '...' : ''}</p>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Blocks
        if (data.blocks && data.blocks.length > 0) {
            html += `
                <div class="atlas-results-section">
                    <h3 class="atlas-results-title">NeuroBlocks</h3>
                    <div class="atlas-results-list">
                        ${data.blocks.slice(0, 4).map(block => `
                            <a href="${block.url}" class="atlas-result-item">
                                <div class="atlas-result-header">
                                    <h4>${block.title}</h4>
                                    <span class="atlas-result-type">Block</span>
                                </div>
                                ${block.summary || block.description ? `<p>${(block.summary || block.description).substring(0, 80)}${(block.summary || block.description).length > 80 ? '...' : ''}</p>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Suggestions (only show if no results or specific conditions)
        if (data.suggestions && data.suggestions.length > 0 && (!data.products?.length && !data.blocks?.length)) {
            html += `
                <div class="atlas-results-section">
                    <h3 class="atlas-results-title">💡 Suggestions</h3>
                    <div class="atlas-suggestions-list">
                        ${data.suggestions.map(suggestion => `
                            <a href="${suggestion.url}" class="atlas-suggestion-item">
                                <span class="atlas-suggestion-icon">${suggestion.icon}</span>
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

        // No results message
        if (!data.products?.length && !data.blocks?.length && !data.suggestions?.length) {
            const query = document.getElementById('atlas-search-input').value;
            html += `
                <div class="atlas-no-results">
                    <div class="atlas-suggestions-list">
                        <a href="/karma-ac" class="atlas-suggestion-item">
                            <span class="atlas-suggestion-icon">🤖</span>
                            <div>
                                <h4>Create with Karma AC</h4>
                                <p>Discuss how to build "${query.substring(0, 35)}${query.length > 35 ? '...' : ''}"</p>
                            </div>
                        </a>
                        <a href="/realm" class="atlas-suggestion-item">
                            <span class="atlas-suggestion-icon">💬</span>
                            <div>
                                <h4>Discuss on Realm</h4>
                                <p>Share your idea with the community</p>
                            </div>
                        </a>
                        <a href="/neuroblock/submit.html" class="atlas-suggestion-item">
                            <span class="atlas-suggestion-icon">🧩</span>
                            <div>
                                <h4>Submit as NeuroBlock</h4>
                                <p>This could be a great NeuroBlock</p>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        }

        results.innerHTML = html;
    }

}

