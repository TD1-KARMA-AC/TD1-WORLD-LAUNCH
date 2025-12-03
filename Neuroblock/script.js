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

// Category filtering
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    
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

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlocks);
} else {
    loadBlocks();
}

