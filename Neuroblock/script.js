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
    
    // Load all blocks (including TD1 products) - async
    (async () => {
        try {
            await loadBlocks();
            await updateMarketplaceStats();
            await loadFeaturedSections();
        } catch (err) {
            console.error('Error loading marketplace:', err);
        }
    })();
    
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
    
    // View toggle (Grid/List)
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    // blocksGrid already declared above
    
    if (gridViewBtn && listViewBtn && blocksGrid) {
        gridViewBtn.addEventListener('click', function() {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            blocksGrid.classList.remove('list-view');
            localStorage.setItem('neuroblock-view', 'grid');
        });
        
        listViewBtn.addEventListener('click', function() {
            listViewBtn.classList.add('active');
            gridViewBtn.classList.remove('active');
            blocksGrid.classList.add('list-view');
            localStorage.setItem('neuroblock-view', 'list');
        });
        
        // Restore saved view preference
        const savedView = localStorage.getItem('neuroblock-view');
        if (savedView === 'list') {
            listViewBtn.click();
        }
    }
    
    // Industry category filtering
    const industryButtons = document.querySelectorAll('.category-btn[data-industry]');
    industryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from all industry buttons
            industryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const industry = this.dataset.industry;
            const searchInput = document.getElementById('searchInput');
            const searchQuery = searchInput ? searchInput.value : '';
            const sortSelect = document.getElementById('sortSelect');
            const sortBy = sortSelect ? sortSelect.value : 'popularity';
            
            // Filter by industry (add industry field to blocks)
            filterBlocksByIndustry(industry, searchQuery, sortBy);
        });
    });
    
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
                    maxPrice: maxPriceInput ? parseFloat(maxPriceInput.value) || 99999 : 99999,
                    minRating: minRatingInput ? parseFloat(minRatingInput.value) || 0 : 0,
                    license: licenseSelect ? licenseSelect.value : 'all'
                };
                const activeCategory = document.querySelector('.category-btn.active[data-category]')?.dataset.category || 'all';
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
async function getStoredBlocks() {
    const stored = localStorage.getItem('neuroblocks');
    let existingBlocks = [];
    if (stored) {
        try {
            existingBlocks = JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing stored blocks:', e);
            existingBlocks = [];
        }
    }
    
    // Try Supabase first (if connected)
    let allBlocks = [];
    if (typeof window.supabaseService !== 'undefined' && window.supabaseService.isConnected) {
        try {
            const supabaseBlocks = await window.supabaseService.getProducts();
            if (supabaseBlocks && supabaseBlocks.length > 0) {
                console.log('Loaded', supabaseBlocks.length, 'blocks from Supabase');
                allBlocks = supabaseBlocks;
                return allBlocks; // Return early if Supabase has data
            }
        } catch (e) {
            console.warn('Supabase load failed, using fallback:', e);
        }
    }
    
    // Start with TD1 products if available (prioritize TD1 products)
    // Add ALL TD1 products first if they exist
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS) && TD1_PRODUCTS.length > 0) {
        console.log('Loading', TD1_PRODUCTS.length, 'TD1 products');
        TD1_PRODUCTS.forEach(td1Product => {
            // Convert TD1 product to NeuroBlock format with demo data
            const block = {
                id: td1Product.id,
                name: td1Product.name,
                creator: td1Product.creator,
                description: td1Product.description,
                price: td1Product.price,
                category: td1Product.category,
                rating: td1Product.rating,
                downloads: td1Product.downloads,
                version: td1Product.version,
                license: td1Product.license,
                tags: td1Product.tags || [],
                createdAt: td1Product.createdAt,
                featured: td1Product.featured || false,
                trending: td1Product.trending || false,
                tier: td1Product.tier,
                benefits: td1Product.benefits || [],
                stripePriceId: td1Product.stripePriceId || '',
                demoUrl: td1Product.demoUrl || '',
                screenshots: td1Product.screenshots || getDefaultScreenshots(td1Product),
                videos: td1Product.videos || [],
                files: td1Product.files || getDefaultFileStructure(td1Product),
                isTD1Product: true
            };
            // Ensure demo data structure exists
            allBlocks.push(ensureDemoData(block));
        });
    } else {
        console.warn('TD1_PRODUCTS not available or empty. typeof:', typeof TD1_PRODUCTS, 'isArray:', Array.isArray(TD1_PRODUCTS));
    }
    
    // Then merge in existing blocks (non-TD1 products from localStorage)
    existingBlocks.forEach(block => {
        // Only add if it's not a TD1 product (to avoid duplicates)
        if (!block.isTD1Product && !allBlocks.some(b => b.id === block.id || b.name === block.name)) {
            allBlocks.push(block);
        }
    });
    
    // If no blocks exist at all (no TD1 products and no stored blocks), initialize with sample blocks
    // BUT ONLY if TD1_PRODUCTS is definitely not available (not just loading)
    if (allBlocks.length === 0 && (typeof TD1_PRODUCTS === 'undefined' || !Array.isArray(TD1_PRODUCTS) || TD1_PRODUCTS.length === 0)) {
        console.log('No TD1 products found, using sample blocks');
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
        allBlocks = sampleBlocks;
        saveBlocks(allBlocks);
    }
    
    console.log('Total blocks to display:', allBlocks.length);
    return allBlocks;
}

function saveBlocks(blocks) {
    localStorage.setItem('neuroblocks', JSON.stringify(blocks));
}

async function addBlock(block) {
    const blocks = await getStoredBlocks();
    const newId = 'user-' + Date.now(); // Use timestamp-based ID
    const newBlock = {
        ...block,
        id: newId,
        rating: block.rating || 0,
        downloads: block.downloads || 0,
        createdAt: block.createdAt || new Date().toISOString(),
        screenshots: block.screenshots || [],
        videos: block.videos || [],
        files: block.files || []
    };
    blocks.push(newBlock);
    
    // Save to Supabase if connected, otherwise localStorage
    if (typeof window.supabaseService !== 'undefined' && window.supabaseService.isConnected) {
        // Already saved via uploadProduct, just return
        return newBlock;
    } else {
        saveBlocks(blocks);
        return newBlock;
    }
}

// Filter and sort blocks
let currentFilters = {
    category: 'all',
    searchQuery: '',
    sortBy: 'popularity',
    minPrice: 0,
    maxPrice: 99999, // Increased to show all products including high-priced ones
    minRating: 0,
    license: 'all'
};

async function filterBlocks(category, searchQuery, sortBy = 'popularity', filters = {}) {
    const grid = document.getElementById('blocksGrid');
    if (!grid) {
        console.error('blocksGrid element not found in filterBlocks');
        return;
    }
    
    const allBlocks = await getStoredBlocks();
    console.log('filterBlocks: allBlocks count:', allBlocks.length);
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
    
    console.log('filterBlocks: filtered count after sorting:', filtered.length);
    
    // Render filtered blocks
    if (filtered.length === 0) {
        console.log('filterBlocks: No blocks to render, showing empty state');
        grid.innerHTML = `
            <div class="empty-state">
                <p>No NeuroBlocks found matching your criteria.</p>
                <a href="submit.html" class="btn btn-primary">Submit Your First Block</a>
            </div>
        `;
        return;
    }
    
    console.log('filterBlocks: Rendering', filtered.length, 'blocks');
    const html = filtered.map(block => renderBlockCard(block)).join('');
    console.log('filterBlocks: Generated HTML length:', html.length);
    console.log('filterBlocks: Grid element:', grid);
    console.log('filterBlocks: Grid display style:', window.getComputedStyle(grid).display);
    console.log('filterBlocks: Grid visibility:', window.getComputedStyle(grid).visibility);
    console.log('filterBlocks: Grid opacity:', window.getComputedStyle(grid).opacity);
    console.log('filterBlocks: Grid parent display:', window.getComputedStyle(grid.parentElement).display);
    grid.innerHTML = html;
    console.log('filterBlocks: Blocks rendered to grid');
    console.log('filterBlocks: Grid innerHTML length after render:', grid.innerHTML.length);
    console.log('filterBlocks: First block card in DOM:', grid.querySelector('.block-card') ? 'YES' : 'NO');
    console.log('filterBlocks: Number of block cards:', grid.querySelectorAll('.block-card').length);
    
    // Force a reflow to ensure rendering
    grid.offsetHeight;
    
    // Double-check visibility after render
    setTimeout(() => {
        const cards = grid.querySelectorAll('.block-card');
        console.log('filterBlocks: After timeout - Cards found:', cards.length);
        if (cards.length > 0) {
            const firstCard = cards[0];
            console.log('filterBlocks: First card display:', window.getComputedStyle(firstCard).display);
            console.log('filterBlocks: First card visibility:', window.getComputedStyle(firstCard).visibility);
            console.log('filterBlocks: First card opacity:', window.getComputedStyle(firstCard).opacity);
            console.log('filterBlocks: First card offsetHeight:', firstCard.offsetHeight);
        }
    }, 100);
}

async function filterBlocksByIndustry(industry, searchQuery, sortBy = 'popularity', filters = {}) {
    const grid = document.getElementById('blocksGrid');
    if (!grid) return;
    
    const allBlocks = await getStoredBlocks();
    let filtered = [...allBlocks];
    
    // Filter by industry (blocks can have industry field or tags)
    if (industry && industry !== 'all') {
        filtered = filtered.filter(block => 
            (block.industry && block.industry === industry) ||
            (block.tags && block.tags.some(tag => tag.toLowerCase().includes(industry.toLowerCase())))
        );
    }
    
    // Filter by search query
    if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(block => 
            block.name.toLowerCase().includes(query) ||
            block.description.toLowerCase().includes(query) ||
            block.creator.toLowerCase().includes(query) ||
            (block.tags && block.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    }
    
    // Apply other filters
    if (filters.minPrice !== undefined) {
        filtered = filtered.filter(block => block.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(block => block.price <= filters.maxPrice);
    }
    if (filters.minRating !== undefined) {
        filtered = filtered.filter(block => (block.rating || 0) >= filters.minRating);
    }
    if (filters.license && filters.license !== 'all') {
        filtered = filtered.filter(block => block.license === filters.license);
    }
    
    // Sort blocks
    filtered = sortBlocks(filtered, sortBy);
    
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
        case 'best-quality':
            // Quality score: rating * 0.6 + (downloads/1000) * 0.4
            return sorted.sort((a, b) => {
                const qualityA = (a.rating || 0) * 0.6 + Math.min((a.downloads || 0) / 1000, 1) * 0.4;
                const qualityB = (b.rating || 0) * 0.6 + Math.min((b.downloads || 0) / 1000, 1) * 0.4;
                return qualityB - qualityA;
            });
        case 'highest-rated':
            // Highest rated (4.5+ stars, then by rating)
            return sorted.sort((a, b) => {
                const ratingA = a.rating || 0;
                const ratingB = b.rating || 0;
                if (ratingA >= 4.5 && ratingB < 4.5) return -1;
                if (ratingA < 4.5 && ratingB >= 4.5) return 1;
                return ratingB - ratingA;
            });
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
        'utils': '🔧',
        'robotics': '🤖',
        'enterprise': '🏢',
        'personal': '🧠',
        'platform': '🌐',
        'dev-tools': '🛠️',
        'creative': '🎨',
        'simulation': '🌍'
    };
    
    const icon = categoryIcons[block.category] || '🧩';
    const ratingStars = '⭐'.repeat(Math.floor(block.rating || 0));
    
    // For TD1 products, open modal. For others, use product.html
    const isTD1Product = block.isTD1Product || block.id?.startsWith('td1-');
    const onClick = isTD1Product ? `onclick="openProductModal('${block.id}'); return false;"` : '';
    const href = isTD1Product ? '#' : `href="product.html?id=${block.id}"`;
    
    return `
        <a ${href} ${onClick} class="block-card" style="cursor: pointer;">
            <div class="block-card-preview">
                <div class="block-card-preview-icon">${icon}</div>
                ${block.tier ? `<div class="block-card-preview-badge" style="background: ${getTierColor(block.tier)};">${block.tier}</div>` : ''}
                ${block.featured ? '<div class="block-card-preview-badge" style="top: 48px;">⭐ Featured</div>' : ''}
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

function getTierColor(tier) {
    const colors = {
        'INFRASTRUCTURE': 'rgba(59, 130, 246, 0.2)',
        'FORBIDDEN AGI': 'rgba(239, 68, 68, 0.2)',
        'DEVELOPMENT': 'rgba(245, 158, 11, 0.2)',
        'ROBOTICS': 'rgba(6, 182, 212, 0.2)',
        'ENTERPRISE': 'rgba(139, 92, 246, 0.2)',
        'PERSONAL': 'rgba(34, 197, 94, 0.2)',
        'PLATFORM': 'rgba(155, 92, 246, 0.2)'
    };
    return colors[tier] || 'rgba(193, 162, 255, 0.2)';
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Helper: Get default screenshots for products that don't have them
function getDefaultScreenshots(product) {
    // Return placeholder screenshots - in production, these would be real images
    return [
        { 
            url: `https://via.placeholder.com/800x450/7C3AED/FFFFFF?text=${encodeURIComponent(product.name)}`, 
            caption: `${product.name} Dashboard` 
        },
        { 
            url: `https://via.placeholder.com/800x450/7C3AED/FFFFFF?text=${encodeURIComponent(product.name)}+Demo`, 
            caption: 'Demo Preview' 
        }
    ];
}

// Helper: Get default file structure for products
function getDefaultFileStructure(product) {
    // Return a basic file structure that all products would have
    return [
        { name: 'README.md', type: 'file', size: 2048 },
        { name: 'src/', type: 'folder' },
        { name: 'src/main.py', type: 'file', size: 8192 },
        { name: 'requirements.txt', type: 'file', size: 512 },
        { name: 'config.json', type: 'file', size: 1024 }
    ];
}

function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
        countElement.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    }
}

// Load blocks (with filtering support)
async function loadBlocks() {
    const grid = document.getElementById('blocksGrid');
    if (!grid) {
        console.warn('blocksGrid not found');
        return;
    }
    
    // Wait for TD1_PRODUCTS to be loaded if it exists
    if (typeof TD1_PRODUCTS === 'undefined') {
        console.log('Waiting for TD1_PRODUCTS to load...');
        setTimeout(loadBlocks, 100);
        return;
    }
    
    console.log('TD1_PRODUCTS loaded:', TD1_PRODUCTS ? TD1_PRODUCTS.length : 0, 'products');
    
    // Get current filter state
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value : '';
    const sortSelect = document.getElementById('sortSelect');
    const sortBy = sortSelect ? sortSelect.value : 'popularity';
    
    await filterBlocks(activeCategory, searchQuery, sortBy);
}

// Update marketplace statistics
async function updateMarketplaceStats() {
    const blocks = await getStoredBlocks();
    const totalBlocks = blocks.length;
    const totalDownloads = blocks.reduce((sum, b) => sum + (b.downloads || 0), 0);
    const avgRating = blocks.reduce((sum, b) => sum + (b.rating || 0), 0) / totalBlocks || 0;
    const totalCreators = new Set(blocks.map(b => b.creator)).size;
    const featuredBlocks = blocks.filter(b => b.featured).length;
    const trendingBlocks = blocks.filter(b => b.trending).length;
    const totalRevenue = blocks.reduce((sum, b) => sum + ((b.price || 0) * (b.downloads || 0)), 0);
    const premiumBlocks = blocks.filter(b => (b.rating || 0) >= 4.5).length;
    
    const statsContainer = document.getElementById('marketplaceStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalBlocks}+</div>
                <div class="stat-label">Total Blocks</div>
                <div class="stat-sublabel">${featuredBlocks} featured, ${trendingBlocks} trending</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatNumber(totalDownloads)}+</div>
                <div class="stat-label">Total Downloads</div>
                <div class="stat-sublabel">${premiumBlocks} premium blocks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgRating.toFixed(1)}⭐</div>
                <div class="stat-label">Avg Rating</div>
                <div class="stat-sublabel">${totalCreators} active creators</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${formatNumber(totalRevenue)}</div>
                <div class="stat-label">Market Value</div>
                <div class="stat-sublabel">Total revenue generated</div>
            </div>
        `;
    }
}

// Load featured and trending sections
async function loadFeaturedSections() {
    const blocks = await getStoredBlocks();
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
async function getBlockById(id) {
    const blocks = await getStoredBlocks();
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

// Stripe Checkout Handler
let stripe = null;

// Initialize Stripe when Stripe.js loads
if (typeof Stripe !== 'undefined') {
    // Use your Stripe publishable key (replace with your actual key)
    stripe = Stripe('pk_test_51SUTNZGyR5AWuIFNAtvb2WrGzalAglOeu7yQLV3lRoJ1i6V00NurTFpMRTUR62yfYcLdIBpUTOL1SKJuVNF6mPF900OWlAYh49');
} else {
    // Wait for Stripe.js to load
    window.addEventListener('load', function() {
        if (typeof Stripe !== 'undefined') {
            stripe = Stripe('pk_test_51SUTNZGyR5AWuIFNAtvb2WrGzalAglOeu7yQLV3lRoJ1i6V00NurTFpMRTUR62yfYcLdIBpUTOL1SKJuVNF6mPF900OWlAYh49');
        }
    });
}

async function handleStripeCheckout(productId, productName, priceId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (!priceId || priceId === '') {
        alert('Price ID not configured. Please contact sales@td1.world');
        return;
    }
    
    if (!stripe) {
        alert('Stripe is not loaded. Please refresh the page.');
        return;
    }
    
    const button = event?.target || document.activeElement;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';
    
    try {
        console.log('Starting checkout for:', { productId, productName, priceId });
        
        // Call Netlify function to create checkout session
        const response = await fetch('/.netlify/functions/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: priceId,
                productName: productName || productId,
                productId: productId,
                tier: 'Standard'
            })
        }).catch((fetchError) => {
            console.error('Fetch network error:', fetchError);
            throw new Error(`Network error: ${fetchError.message}. The Netlify function may not be deployed.`);
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText || 'Unknown error', status: response.status };
            }
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Checkout session created:', data);
        
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId
        });
        
        if (error) {
            throw error;
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Error starting checkout: ' + error.message);
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Initialize on page load - with retry mechanism
function initializeMarketplace() {
    // Wait for both DOM and TD1_PRODUCTS to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                if (typeof TD1_PRODUCTS !== 'undefined' || document.getElementById('blocksGrid')) {
                    loadBlocks();
                } else {
                    console.log('Retrying loadBlocks...');
                    setTimeout(initializeMarketplace, 200);
                }
            }, 100);
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            if (typeof TD1_PRODUCTS !== 'undefined' || document.getElementById('blocksGrid')) {
                loadBlocks();
            } else {
                console.log('Retrying loadBlocks...');
                setTimeout(initializeMarketplace, 200);
            }
        }, 100);
    }
}

// Start initialization
initializeMarketplace();

// Also try on window load as backup
window.addEventListener('load', function() {
    setTimeout(function() {
        const grid = document.getElementById('blocksGrid');
        if (grid) {
            const hasBlocks = grid.querySelectorAll('.block-card').length > 0;
            const hasEmptyState = grid.innerHTML.includes('No NeuroBlocks');
            if (hasEmptyState && !hasBlocks) {
                console.log('Blocks grid is empty, retrying loadBlocks...');
                loadBlocks();
            } else if (hasBlocks) {
                console.log('Blocks already loaded:', grid.querySelectorAll('.block-card').length, 'blocks');
            }
        }
    }, 500);
});

// ========== PRODUCT MODAL FUNCTIONS ==========

// Initialize Stripe (stripe already declared above)
if (typeof Stripe !== 'undefined' && !stripe) {
    stripe = Stripe('pk_test_51SUTNZGyR5AWuIFNAtvb2WrGzalAglOeu7yQLV3lRoJ1i6V00NurTFpMRTUR62yfYcLdIBpUTOL1SKJuVNF6mPF900OWlAYh49');
}

// Open Product Modal
function openProductModal(productId) {
    // Get product from TD1_PRODUCTS array
    let product = null;
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS)) {
        product = TD1_PRODUCTS.find(p => p.id === productId);
    }
    
    if (!product) {
        console.error('Product not found:', productId);
        alert('Product not found. Please try again.');
        return;
    }
    
    // Get product details
    const details = typeof getTD1ProductDetails !== 'undefined' ? getTD1ProductDetails(productId) : null;
    
    const modal = document.getElementById('productModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    
    // Store product ID on modal
    modal.dataset.productId = productId;
    
    // Set icon, title, tagline
    const iconEl = document.getElementById('modalProductIcon');
    const titleEl = document.getElementById('modalProductTitle');
    const taglineEl = document.getElementById('modalProductTagline');
    
    if (iconEl) iconEl.textContent = details?.icon || '🧩';
    if (titleEl) titleEl.textContent = product.name;
    if (taglineEl) taglineEl.textContent = details?.tagline || product.description;
    
    // Set pricing
    const pricingGrid = document.getElementById('modalPricingGrid');
    if (pricingGrid && details) {
        pricingGrid.innerHTML = details.pricing.map((tier, index) => {
            const isStandard = tier.name === 'Standard';
            const isEnterprise = tier.name === 'Enterprise' || tier.price === 'Contact Sales';
            
            let buttonText, buttonClass, buttonAttrs;
            
            if (isStandard && tier.priceId) {
                buttonText = `Buy ${tier.name} - ${tier.price}`;
                buttonClass = 'buy-button stripe-checkout-btn';
                buttonAttrs = `data-product-id="${productId}" data-tier="${tier.name}" data-price-id="${tier.priceId}" data-product-name="${product.name} - ${tier.name}"`;
            } else {
                buttonText = 'Contact Sales';
                buttonClass = 'buy-button contact-sales';
                const emailSubject = encodeURIComponent(`Inquiry: ${product.name} - ${tier.name} (${tier.price})`);
                buttonAttrs = `onclick="window.location.href='mailto:sales@td1.world?subject=${emailSubject}'"`;
            }
            
            return `
                <div class="pricing-tier-modal">
                    <div class="pricing-tier-name-modal">${tier.name}</div>
                    <div class="pricing-tier-price-modal">${tier.price}</div>
                    <div class="pricing-tier-features-modal">
                        ${tier.features.map(f => `<div>${f}</div>`).join('')}
                    </div>
                    <button class="${buttonClass}" ${buttonAttrs}>
                        ${buttonText}
                    </button>
                </div>
            `;
        }).join('');
        
        // Attach event listeners to Stripe checkout buttons
        pricingGrid.querySelectorAll('.stripe-checkout-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.dataset.productId;
                const tier = this.dataset.tier;
                const priceId = this.dataset.priceId;
                const productName = this.dataset.productName;
                handleBuy(productId, tier, priceId, productName, this);
            });
        });
    }
    
    // Set content sections
    const whatItsForEl = document.getElementById('modalWhatItsFor');
    const howItWorksEl = document.getElementById('modalHowItWorks');
    const whoItsForEl = document.getElementById('modalWhoItsFor');
    const whatYouGetEl = document.getElementById('modalWhatYouGet');
    
    if (whatItsForEl && details) whatItsForEl.innerHTML = `<p>${details.whatItsFor}</p>`;
    if (howItWorksEl && details) howItWorksEl.innerHTML = `<p>${details.howItWorks}</p>`;
    if (whoItsForEl && details) whoItsForEl.innerHTML = `<p>${details.whoItsFor}</p>`;
    if (whatYouGetEl && details) {
        whatYouGetEl.innerHTML = details.whatYouGet.map(item => `<li>${item}</li>`).join('');
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set active tab to Overview
    switchTab('overview');
}

// Close Modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Switch Tab
function switchTab(tabName, event) {
    // Remove active from all tabs and contents
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active to selected tab and content
    const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`tab-${tabName}`);
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
    
    // Load demo content when demo tab is opened
    if (tabName === 'demo') {
        loadDemoContent();
    }
}

// Demo Mode Functions
function switchDemoMode(mode) {
    // Update buttons
    document.querySelectorAll('.demo-mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update panels
    document.querySelectorAll('.demo-mode-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`demo-${mode}`).classList.add('active');
    
    // Load content for the selected mode
    if (mode === 'media') {
        loadMediaGallery();
    } else if (mode === 'files') {
        loadFileBrowser();
    } else if (mode === 'live') {
        loadLiveDemo();
    }
}

// Load Demo Content
function loadDemoContent() {
    const modal = document.getElementById('productModal');
    const productId = modal?.dataset?.productId;
    
    if (!productId) return;
    
    // Load media gallery by default
    switchDemoMode('media');
}

// Load Media Gallery (Screenshots/Videos)
function loadMediaGallery() {
    const modal = document.getElementById('productModal');
    const productId = modal?.dataset?.productId;
    
    if (!productId) return;
    
    // Get product
    let product = null;
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS)) {
        product = TD1_PRODUCTS.find(p => p.id === productId);
    }
    
    const gallery = document.getElementById('screenshotGallery');
    const videoContainer = document.getElementById('videoPlayer');
    
    if (!gallery || !videoContainer) return;
    
    gallery.innerHTML = '';
    videoContainer.innerHTML = '';
    
    // Load screenshots
    const screenshots = product?.screenshots || [];
    if (screenshots.length > 0) {
        screenshots.forEach((screenshot, index) => {
            const item = document.createElement('div');
            item.className = 'screenshot-item';
            item.innerHTML = `
                <img src="${screenshot.url}" alt="${screenshot.caption || 'Screenshot ' + (index + 1)}" loading="lazy">
                ${screenshot.caption ? `<div class="screenshot-label">${screenshot.caption}</div>` : ''}
            `;
            item.onclick = () => openImageModal(screenshot.url, screenshot.caption);
            gallery.appendChild(item);
        });
    } else {
        gallery.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">No screenshots available yet.</p>';
    }
    
    // Load videos
    const videos = product?.videos || [];
    if (videos.length > 0) {
        const mainVideo = videos[0];
        videoContainer.innerHTML = `
            <video controls style="width: 100%; max-height: 600px;">
                <source src="${mainVideo.url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }
}

// Load File Browser (GitHub-style)
function loadFileBrowser() {
    const modal = document.getElementById('productModal');
    const productId = modal?.dataset?.productId;
    
    if (!productId) return;
    
    // Get product
    let product = null;
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS)) {
        product = TD1_PRODUCTS.find(p => p.id === productId);
    }
    
    const fileTree = document.getElementById('fileTree');
    const fileContent = document.getElementById('fileContent');
    
    if (!fileTree || !fileContent) return;
    
    // Load file structure
    const files = product?.files || [];
    
    if (files.length === 0) {
        fileTree.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">File structure will be available after purchase.</p>';
        fileContent.innerHTML = '';
        return;
    }
    
    // Build file tree
    fileTree.innerHTML = '';
    files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-tree-item';
        item.dataset.fileIndex = index;
        item.innerHTML = `
            <span class="file-icon">${file.type === 'folder' ? '📁' : getFileIcon(file.name)}</span>
            <span>${file.name}</span>
        `;
        item.onclick = () => loadFileContent(file, index);
        fileTree.appendChild(item);
    });
    
    // Load first file by default
    if (files.length > 0 && files[0].type !== 'folder') {
        loadFileContent(files[0], 0);
    }
}

// Load File Content
function loadFileContent(file, index) {
    const fileTree = document.getElementById('fileTree');
    const fileContent = document.getElementById('fileContent');
    
    if (!fileTree || !fileContent) return;
    
    // Update active item
    fileTree.querySelectorAll('.file-tree-item').forEach(item => item.classList.remove('active'));
    fileTree.querySelector(`[data-file-index="${index}"]`).classList.add('active');
    
    // Load content
    if (file.type === 'folder') {
        fileContent.innerHTML = '<p style="color: #6b7280;">Select a file to view its contents.</p>';
        return;
    }
    
    // Show file content
    fileContent.innerHTML = `
        <div class="file-header">
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size || 0)}</div>
            </div>
        </div>
        <pre><code>${escapeHtml(file.content || '// File content will be available after purchase')}</code></pre>
    `;
}

// Get File Icon
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'js': '📜', 'ts': '📘', 'py': '🐍', 'html': '🌐', 'css': '🎨',
        'json': '📋', 'md': '📝', 'txt': '📄', 'yml': '⚙️', 'yaml': '⚙️',
        'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
        'zip': '📦', 'tar': '📦', 'gz': '📦'
    };
    return icons[ext] || '📄';
}

// Load Live Demo
function loadLiveDemo() {
    const modal = document.getElementById('productModal');
    const productId = modal?.dataset?.productId;
    
    if (!productId) return;
    
    // Get product
    let product = null;
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS)) {
        product = TD1_PRODUCTS.find(p => p.id === productId);
    }
    
    const container = document.getElementById('liveDemoContainer');
    const btn = document.getElementById('openLiveDemoBtn');
    
    if (product && product.demoUrl) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 16px; color: #EAEAEA;">Ready to try it live?</p>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 24px; color: #9ca3af;">Experience the full interactive demo in a new window</p>
                <button class="btn btn-primary" onclick="openLiveDemo()" style="padding: 14px 32px; font-size: 16px; font-weight: 700;">
                    🚀 Open Live Demo
                </button>
            </div>
        `;
    }
}

// Open Live Demo
function openLiveDemo() {
    const modal = document.getElementById('productModal');
    const productId = modal?.dataset?.productId;
    
    if (!productId) return;
    
    // Get product
    let product = null;
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS)) {
        product = TD1_PRODUCTS.find(p => p.id === productId);
    }
    
    if (product && product.demoUrl) {
        window.open(product.demoUrl, '_blank', 'noopener,noreferrer');
    } else {
        alert('Live demo not available for this product yet.');
    }
}

// Toggle File View
function toggleFileView() {
    const icon = document.getElementById('viewIcon');
    const text = document.getElementById('viewText');
    const fileTree = document.getElementById('fileTree');
    
    if (fileTree.classList.contains('list-view')) {
        fileTree.classList.remove('list-view');
        icon.textContent = '📋';
        text.textContent = 'List';
    } else {
        fileTree.classList.add('list-view');
        icon.textContent = '📊';
        text.textContent = 'Grid';
    }
}

// Open Image Modal
function openImageModal(url, caption) {
    // Simple image modal (can be enhanced)
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 20000;
        background: rgba(0,0,0,0.95); display: flex;
        align-items: center; justify-content: center;
        cursor: pointer;
    `;
    modal.innerHTML = `
        <img src="${url}" alt="${caption || ''}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
        ${caption ? `<div style="position: absolute; bottom: 40px; color: white; font-size: 18px;">${caption}</div>` : ''}
    `;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

// Helper Functions
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.switchDemoMode = switchDemoMode;
window.toggleFileView = toggleFileView;
window.openLiveDemo = openLiveDemo;

// Stripe Checkout Handler
async function handleBuy(productId, tier, priceId, productName, buttonElement) {
    if (!priceId || priceId === '') {
        alert('Price ID not configured. Please contact sales@td1.world');
        return;
    }
    
    if (!stripe) {
        alert('Stripe not loaded. Please refresh the page.');
        return;
    }
    
    const button = buttonElement || event?.target || document.activeElement;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';
    
    try {
        console.log('Starting checkout for:', { productId, tier, priceId, productName });
        
        // Call Netlify function to create checkout session
        const response = await fetch('/.netlify/functions/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: priceId,
                productName: productName || productId,
                productId: productId,
                tier: tier
            })
        }).catch((fetchError) => {
            console.error('Fetch network error:', fetchError);
            throw new Error(`Network error: ${fetchError.message}. The Netlify function may not be deployed.`);
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create checkout session'}`);
        }
        
        const data = await response.json();
        console.log('Checkout session created:', data);
        
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId
        });
        
        if (error) {
            throw error;
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Error starting checkout: ' + error.message);
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Close modal on background click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('productModal');
    if (e.target === modal) {
        closeProductModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// Make functions globally accessible
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.switchTab = switchTab;
window.handleBuy = handleBuy;

