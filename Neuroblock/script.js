// Create animated particles
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = (i * 0.12) + 's';
        particle.style.animationDuration = (10 + Math.random() * 5) + 's';
        container.appendChild(particle);
    }
}

// Tab switching functionality (removed - now using scrollable sections)
// Keeping function name for backwards compatibility but it's no longer needed
function initTabs() {
    // Tabs removed - now using scrollable sections
    // This function is kept for backwards compatibility but does nothing
}

// Category filtering and marketplace controls
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initTabs();
    
    // Initialize marketplace stats
    updateMarketplaceStats();
    
    // Load featured/trending sections
    loadFeaturedSections();
    
    const categoryButtons = document.querySelectorAll('.category-btn');
    const blocksGrid = document.getElementById('blocksGrid');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            const searchInput = document.getElementById('searchInput');
            const searchQuery = searchInput ? searchInput.value : '';
            const sortSelect = document.getElementById('sortSelect');
            const sortBy = sortSelect ? sortSelect.value : 'popularity';
            filterBlocks(category, searchQuery, sortBy);
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value;
            const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
            const sortSelect = document.getElementById('sortSelect');
            const sortBy = sortSelect ? sortSelect.value : 'popularity';
            filterBlocks(activeCategory, query, sortBy);
        });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
            const searchInput = document.getElementById('searchInput');
            const searchQuery = searchInput ? searchInput.value : '';
            filterBlocks(activeCategory, searchQuery, this.value);
        });
    }
    
    // Advanced filters toggle
    const filterToggle = document.getElementById('filterToggle');
    const advancedFilters = document.getElementById('advancedFilters');
    if (filterToggle && advancedFilters) {
        filterToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            advancedFilters.classList.toggle('active');
        });
    }
    
    // Advanced filter inputs
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const minRatingInput = document.getElementById('minRating');
    const licenseSelect = document.getElementById('licenseFilter');
    
    [minPriceInput, maxPriceInput, minRatingInput, licenseSelect].forEach(input => {
        if (input) {
            input.addEventListener('change', function() {
                const filters = {
                    minPrice: minPriceInput ? parseFloat(minPriceInput.value) || 0 : 0,
                    maxPrice: maxPriceInput ? parseFloat(maxPriceInput.value) || 1000 : 1000,
                    minRating: minRatingInput ? parseFloat(minRatingInput.value) || 0 : 0,
                    license: licenseSelect ? licenseSelect.value : 'all'
                };
                const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
                const searchInput = document.getElementById('searchInput');
                const searchQuery = searchInput ? searchInput.value : '';
                const sortSelect = document.getElementById('sortSelect');
                const sortBy = sortSelect ? sortSelect.value : 'popularity';
                filterBlocks(activeCategory, searchQuery, sortBy, filters);
            });
        }
    });
    
    // Lazy load TD1 Products when section comes into view (if not already loaded)
    const td1Section = document.getElementById('td1-products-section');
    if (td1Section && typeof IntersectionObserver !== 'undefined') {
        const observerOptions = {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && typeof loadTD1Products === 'function') {
                    loadTD1Products();
                    observer.unobserve(entry.target); // Only load once
                }
            });
        }, observerOptions);
        
        observer.observe(td1Section);
    }
});

// Block storage using localStorage
function getStoredBlocks() {
    const stored = localStorage.getItem('neuroblocks');
    if (stored) {
        return JSON.parse(stored);
    }
    // Initialize with sample blocks (BeatStars-level quality)
    const sampleBlocks = [
        {
            id: 1,
            name: 'NLP Sentiment Analyzer',
            creator: 'AI Developer',
            description: 'Advanced sentiment analysis block for processing text data with high accuracy. Perfect for social media monitoring and customer feedback analysis.',
            price: 29.99,
            category: 'nlp',
            rating: 4.5,
            downloads: 1247,
            version: '1.0.0',
            license: 'MIT',
            tags: ['nlp', 'sentiment', 'analysis', 'text-processing'],
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            featured: true,
            trending: true
        },
        {
            id: 2,
            name: 'Image Classifier Pro',
            creator: 'Vision Pro',
            description: 'State-of-the-art image classification using deep learning models. Supports 1000+ categories with 95% accuracy.',
            price: 49.99,
            category: 'vision',
            rating: 4.8,
            downloads: 892,
            version: '1.2.0',
            license: 'Apache-2.0',
            tags: ['vision', 'classification', 'deep-learning', 'cnn'],
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            featured: true,
            trending: false
        },
        {
            id: 3,
            name: 'AI Agent Framework',
            creator: 'Agent Labs',
            description: 'Complete framework for building autonomous AI agents with memory, planning, and tool usage capabilities.',
            price: 79.99,
            category: 'agents',
            rating: 4.7,
            downloads: 456,
            version: '2.1.0',
            license: 'Proprietary',
            tags: ['agents', 'autonomous', 'framework', 'memory'],
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            featured: false,
            trending: true
        },
        {
            id: 4,
            name: 'Data Pipeline Builder',
            creator: 'DataFlow Inc',
            description: 'Visual pipeline builder for ETL processes. Drag-and-drop interface with 50+ connectors.',
            price: 39.99,
            category: 'data',
            rating: 4.6,
            downloads: 678,
            version: '1.5.0',
            license: 'MIT',
            tags: ['data', 'etl', 'pipeline', 'processing'],
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            featured: false,
            trending: false
        },
        {
            id: 5,
            name: 'Code Generator Utility',
            creator: 'DevTools',
            description: 'Generate boilerplate code for multiple languages. Supports Python, JavaScript, TypeScript, and more.',
            price: 19.99,
            category: 'utils',
            rating: 4.4,
            downloads: 1234,
            version: '1.0.0',
            license: 'MIT',
            tags: ['utils', 'code-generation', 'productivity'],
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            featured: false,
            trending: false
        },
        {
            id: 6,
            name: 'Real-time Chat Translator',
            creator: 'Lingua AI',
            description: 'Translate conversations in real-time across 50+ languages with context preservation.',
            price: 34.99,
            category: 'nlp',
            rating: 4.9,
            downloads: 2103,
            version: '2.0.0',
            license: 'Apache-2.0',
            tags: ['nlp', 'translation', 'real-time', 'chat'],
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            featured: true,
            trending: true
        }
    ];
    saveBlocks(sampleBlocks);
    return sampleBlocks;
}

function saveBlocks(blocks) {
    localStorage.setItem('neuroblocks', JSON.stringify(blocks));
}

function addBlock(block) {
    const blocks = getStoredBlocks();
    const newId = Math.max(...blocks.map(b => b.id), 0) + 1;
    const newBlock = {
        ...block,
        id: newId,
        rating: 0,
        downloads: 0,
        createdAt: new Date().toISOString()
    };
    blocks.push(newBlock);
    saveBlocks(blocks);
    return newBlock;
}

// Filter and sort blocks
let currentFilters = {
    category: 'all',
    searchQuery: '',
    sortBy: 'popularity',
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    license: 'all'
};

function filterBlocks(category, searchQuery, sortBy = 'popularity', filters = {}) {
    const grid = document.getElementById('blocksGrid');
    if (!grid) return;
    
    const allBlocks = getStoredBlocks();
    let filtered = [...allBlocks];
    
    // Update current filters
    currentFilters.category = category || currentFilters.category;
    currentFilters.searchQuery = searchQuery || currentFilters.searchQuery;
    currentFilters.sortBy = sortBy || currentFilters.sortBy;
    Object.assign(currentFilters, filters);
    
    // Filter by category
    if (currentFilters.category && currentFilters.category !== 'all') {
        filtered = filtered.filter(block => block.category === currentFilters.category);
    }
    
    // Filter by search query
    if (currentFilters.searchQuery && currentFilters.searchQuery.trim() !== '') {
        const query = currentFilters.searchQuery.toLowerCase();
        filtered = filtered.filter(block => 
            block.name.toLowerCase().includes(query) ||
            block.description.toLowerCase().includes(query) ||
            block.creator.toLowerCase().includes(query) ||
            (block.tags && block.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    }
    
    // Filter by price range
    if (currentFilters.minPrice !== undefined) {
        filtered = filtered.filter(block => block.price >= currentFilters.minPrice);
    }
    if (currentFilters.maxPrice !== undefined) {
        filtered = filtered.filter(block => block.price <= currentFilters.maxPrice);
    }
    
    // Filter by rating
    if (currentFilters.minRating !== undefined) {
        filtered = filtered.filter(block => (block.rating || 0) >= currentFilters.minRating);
    }
    
    // Filter by license
    if (currentFilters.license && currentFilters.license !== 'all') {
        filtered = filtered.filter(block => block.license === currentFilters.license);
    }
    
    // Sort blocks
    filtered = sortBlocks(filtered, currentFilters.sortBy);
    
    // Update results count
    updateResultsCount(filtered.length);
    
    // Render filtered blocks
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No NeuroBlocks found matching your criteria.</p>
                <a href="submit.html" class="btn btn-primary">Submit Your First Block</a>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(block => renderBlockCard(block)).join('');
}

function sortBlocks(blocks, sortBy) {
    const sorted = [...blocks];
    
    switch(sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        case 'price-high':
            return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        case 'oldest':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateA - dateB;
            });
        case 'downloads':
            return sorted.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        case 'popularity':
        default:
            // Combined score: rating * downloads / days since creation
            return sorted.sort((a, b) => {
                const scoreA = calculatePopularityScore(a);
                const scoreB = calculatePopularityScore(b);
                return scoreB - scoreA;
            });
    }
}

function calculatePopularityScore(block) {
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(block.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    const rating = block.rating || 0;
    const downloads = block.downloads || 0;
    return (rating * downloads) / daysSinceCreation;
}

function renderBlockCard(block) {
    const categoryIcons = {
        'nlp': '💬',
        'vision': '👁️',
        'agents': '🤖',
        'data': '📊',
        'utils': '🔧'
    };
    
    const icon = categoryIcons[block.category] || '🧩';
    const ratingStars = '⭐'.repeat(Math.floor(block.rating || 0));
    
    return `
        <a href="product.html?id=${block.id}" class="block-card">
            <div class="block-card-preview">
                <div class="block-card-preview-icon">${icon}</div>
                ${block.featured ? '<div class="block-card-preview-badge">⭐ Featured</div>' : ''}
                ${block.trending ? '<div class="block-card-preview-badge" style="top: 48px;">🔥 Trending</div>' : ''}
            </div>
            <div class="block-card-content">
                <h3>${block.name}</h3>
                <p class="block-creator">
                    <span class="block-creator-avatar"></span>
                    by ${block.creator}
                </p>
                <p class="block-description">${block.description}</p>
                <div class="block-card-stats">
                    <span class="block-rating">${ratingStars} ${block.rating || 0}</span>
                    <span>⬇️ ${formatNumber(block.downloads || 0)}</span>
                </div>
                <div class="block-footer">
                    <div style="font-size: 0.75rem; color: #6b7280;">${block.license || 'Proprietary'}</div>
                    <div class="block-price">$${block.price || 0}</div>
                </div>
            </div>
        </a>
    `;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    }
}

// Load blocks (with filtering support)
function loadBlocks() {
    const grid = document.getElementById('blocksGrid');
    if (!grid) return;
    
    // Get current filter state
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value : '';
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'popularity';
    
    filterBlocks(activeCategory, searchQuery, sortBy);
}

// Update marketplace statistics
function updateMarketplaceStats() {
    const blocks = getStoredBlocks();
    const totalBlocks = blocks.length;
    const totalDownloads = blocks.reduce((sum, b) => sum + (b.downloads || 0), 0);
    const avgRating = blocks.reduce((sum, b) => sum + (b.rating || 0), 0) / totalBlocks || 0;
    const totalCreators = new Set(blocks.map(b => b.creator)).size;
    
    const statsContainer = document.getElementById('marketplaceStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalBlocks}</div>
                <div class="stat-label">Total Blocks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatNumber(totalDownloads)}</div>
                <div class="stat-label">Total Downloads</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgRating.toFixed(1)}</div>
                <div class="stat-label">Avg Rating</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalCreators}</div>
                <div class="stat-label">Creators</div>
            </div>
        `;
    }
}

// Load featured and trending sections
function loadFeaturedSections() {
    const blocks = getStoredBlocks();
    const featured = blocks.filter(b => b.featured).slice(0, 6);
    const trending = blocks.filter(b => b.trending).slice(0, 6);
    
    const featuredContainer = document.getElementById('featuredBlocks');
    const trendingContainer = document.getElementById('trendingBlocks');
    
    if (featuredContainer && featured.length > 0) {
        featuredContainer.innerHTML = featured.map(block => renderBlockCard(block)).join('');
    }
    
    if (trendingContainer && trending.length > 0) {
        trendingContainer.innerHTML = trending.map(block => renderBlockCard(block)).join('');
    }
}

// Get block by ID
function getBlockById(id) {
    const blocks = getStoredBlocks();
    return blocks.find(block => block.id === parseInt(id));
}

// Load TD1 Products
function loadTD1Products() {
    const container = document.getElementById('td1-products-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.dataset.loaded === 'true') return;
    
    // Show loading state
    container.innerHTML = '<div style="text-align: center; padding: 4rem 2rem;"><p style="color: #A0A0A0;">Loading TD1 Products...</p></div>';
    
    // Try multiple paths (for different deployment scenarios)
    const possiblePaths = [
        '/website/PRODUCTS_INDEX.html',  // Root deployment
        '../website/PRODUCTS_INDEX.html', // Relative from neuroblock folder
        'website/PRODUCTS_INDEX.html'     // Alternative relative
    ];
    
    function tryFetch(pathIndex) {
        if (pathIndex >= possiblePaths.length) {
            // All paths failed
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem;">
                    <p style="color: #A0A0A0; margin-bottom: 1rem;">Unable to load TD1 products.</p>
                    <p style="color: #A0A0A0; margin-bottom: 2rem;">Please visit <a href="/website/PRODUCTS_INDEX.html" style="color: #C1A2FF; text-decoration: none;">Products Page</a> to view all TD1 products.</p>
                </div>
            `;
            return;
        }
        
        fetch(possiblePaths[pathIndex])
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch products');
                return response.text();
            })
            .then(html => {
                // Extract product sections using DOMParser
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Get all product sections (skip hero and footer)
                const sections = doc.querySelectorAll('section.container');
                let productsHTML = '';
                
                sections.forEach(section => {
                    // Skip hero section and footer
                    if (section.querySelector('.hero') || section.querySelector('.footer')) return;
                    
                    // Get section header and products
                    const sectionHeader = section.querySelector('.section-header');
                    const productsBlock = section.querySelector('.products-block, .products-grid');
                    
                    if (sectionHeader && productsBlock) {
                        const categoryBadge = sectionHeader.querySelector('.category-badge');
                        const sectionTitle = sectionHeader.querySelector('.section-title');
                        
                        productsHTML += `
                            <div class="td1-section" style="margin-bottom: 4rem;">
                                <div class="section-header" style="text-align: center; padding: 40px 20px 30px;">
                                    ${categoryBadge ? categoryBadge.outerHTML : ''}
                                    ${sectionTitle ? sectionTitle.outerHTML : ''}
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; padding: 20px; max-width: 1600px; margin: 0 auto;">
                                    ${productsBlock.innerHTML}
                                </div>
                            </div>
                        `;
                    }
                });
                
                if (productsHTML) {
                    container.innerHTML = productsHTML;
                    container.dataset.loaded = 'true';
                    
                    // Note: Product modals (openProductModal) will need to be loaded separately
                    // For now, users can click "Explore More" and it will try to open modals
                    // If modals don't work, they can visit the full products page
                } else {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 4rem 2rem;">
                            <p style="color: #A0A0A0; margin-bottom: 2rem;">No products found. Please visit <a href="/website/PRODUCTS_INDEX.html" style="color: #C1A2FF; text-decoration: none;">Products Page</a> to view all TD1 products.</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error(`Error loading TD1 products from ${possiblePaths[pathIndex]}:`, error);
                // Try next path
                tryFetch(pathIndex + 1);
            });
    }
    
    // Start trying paths
    tryFetch(0);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlocks);
} else {
    loadBlocks();
}

