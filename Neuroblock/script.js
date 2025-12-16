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

// Tab switching functionality
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Set initial active tab button styles
    tabButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            btn.style.background = 'rgba(193, 162, 255, 0.2)';
            btn.style.borderColor = 'rgba(193, 162, 255, 0.4)';
            btn.style.color = '#C1A2FF';
        } else {
            btn.style.background = 'rgba(255, 255, 255, 0.05)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            btn.style.color = '#EAEAEA';
        }
    });
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'rgba(255, 255, 255, 0.05)';
                b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                b.style.color = '#EAEAEA';
            });
            
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            this.style.background = 'rgba(193, 162, 255, 0.2)';
            this.style.borderColor = 'rgba(193, 162, 255, 0.4)';
            this.style.color = '#C1A2FF';
            
            // Show corresponding content
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }
            
            // Load TD1 products if switching to that tab
            if (targetTab === 'td1-products') {
                loadTD1Products();
            }
        });
    });
}

// Category filtering
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initTabs();
    
    const categoryButtons = document.querySelectorAll('.category-btn');
    const blocksGrid = document.getElementById('blocksGrid');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterBlocks(category);
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            filterBlocks(null, query);
        });
    }
});

function filterBlocks(category, searchQuery) {
    // This would normally filter blocks from an API
    // For now, it's a placeholder
    console.log('Filtering by category:', category, 'search:', searchQuery);
}

// Sample block data (replace with API call)
const sampleBlocks = [
    {
        id: 1,
        name: 'NLP Sentiment Analyzer',
        creator: 'AI Developer',
        description: 'Advanced sentiment analysis block for processing text data with high accuracy.',
        price: 29.99,
        category: 'nlp',
        rating: 4.5,
        downloads: 120
    },
    {
        id: 2,
        name: 'Image Classifier',
        creator: 'Vision Pro',
        description: 'State-of-the-art image classification using deep learning models.',
        price: 49.99,
        category: 'vision',
        rating: 4.8,
        downloads: 89
    }
];

// Load blocks (placeholder - replace with API)
function loadBlocks() {
    const grid = document.getElementById('blocksGrid');
    if (!grid) return;
    
    if (sampleBlocks.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No NeuroBlocks found yet.</p>
                <a href="submit.html" class="btn btn-primary">Submit Your First Block</a>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = sampleBlocks.map(block => `
        <a href="product.html?id=${block.id}" class="block-card">
            <h3>${block.name}</h3>
            <p class="block-creator">by ${block.creator}</p>
            <p class="block-description">${block.description}</p>
            <div class="block-footer">
                <div>
                    <span>⭐ ${block.rating}</span>
                    <span style="margin-left: 1rem;">⬇️ ${block.downloads}</span>
                </div>
                <div class="block-price">$${block.price}</div>
            </div>
        </a>
    `).join('');
}

// Load TD1 Products
function loadTD1Products() {
    const container = document.getElementById('td1-products-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.dataset.loaded === 'true') return;
    
    // Show loading state
    container.innerHTML = '<div style="text-align: center; padding: 4rem 2rem;"><p style="color: #A0A0A0;">Loading TD1 Products...</p></div>';
    
    // Fetch TD1 products from PRODUCTS_INDEX.html
    fetch('/website/PRODUCTS_INDEX.html')
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
            console.error('Error loading TD1 products:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem;">
                    <p style="color: #A0A0A0; margin-bottom: 1rem;">Unable to load TD1 products.</p>
                    <p style="color: #A0A0A0; margin-bottom: 2rem;">Please visit <a href="/website/PRODUCTS_INDEX.html" style="color: #C1A2FF; text-decoration: none;">Products Page</a> to view all TD1 products.</p>
                </div>
            `;
        });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlocks);
} else {
    loadBlocks();
}

