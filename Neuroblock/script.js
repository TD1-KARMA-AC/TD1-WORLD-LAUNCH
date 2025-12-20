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

// Category filtering
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initTabs(); // No longer needed but kept for compatibility
    
    const categoryButtons = document.querySelectorAll('.category-btn');
    const blocksGrid = document.getElementById('blocksGrid');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.dataset.category;
            const searchInput = document.getElementById('searchInput');
            const searchQuery = searchInput ? searchInput.value : '';
            filterBlocks(category, searchQuery);
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value;
            const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
            filterBlocks(activeCategory, query);
        });
    }
    
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
    // Initialize with sample blocks
    const sampleBlocks = [
        {
            id: 1,
            name: 'NLP Sentiment Analyzer',
            creator: 'AI Developer',
            description: 'Advanced sentiment analysis block for processing text data with high accuracy.',
            price: 29.99,
            category: 'nlp',
            rating: 4.5,
            downloads: 120,
            version: '1.0.0',
            license: 'MIT',
            tags: ['nlp', 'sentiment', 'analysis']
        },
        {
            id: 2,
            name: 'Image Classifier',
            creator: 'Vision Pro',
            description: 'State-of-the-art image classification using deep learning models.',
            price: 49.99,
            category: 'vision',
            rating: 4.8,
            downloads: 89,
            version: '1.2.0',
            license: 'Apache-2.0',
            tags: ['vision', 'classification', 'deep-learning']
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

// Filter blocks by category and search query
function filterBlocks(category, searchQuery) {
    const grid = document.getElementById('blocksGrid');
    if (!grid) return;
    
    const allBlocks = getStoredBlocks();
    let filtered = [...allBlocks];
    
    // Filter by category
    if (category && category !== 'all') {
        filtered = filtered.filter(block => block.category === category);
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
    
    grid.innerHTML = filtered.map(block => `
        <a href="product.html?id=${block.id}" class="block-card">
            <h3>${block.name}</h3>
            <p class="block-creator">by ${block.creator}</p>
            <p class="block-description">${block.description}</p>
            <div class="block-footer">
                <div>
                    <span>⭐ ${block.rating || 0}</span>
                    <span style="margin-left: 1rem;">⬇️ ${block.downloads || 0}</span>
                </div>
                <div class="block-price">$${block.price || 0}</div>
            </div>
        </a>
    `).join('');
}

// Load blocks (with filtering support)
function loadBlocks() {
    const grid = document.getElementById('blocksGrid');
    if (!grid) return;
    
    // Get current filter state
    const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value : '';
    
    filterBlocks(activeCategory, searchQuery);
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

