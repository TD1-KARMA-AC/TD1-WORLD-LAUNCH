// TD1 Product Details - Full product documentation loaded from PRODUCTS_INDEX.html
// This file will be populated with full product data including whatItsFor, howItWorks, etc.

// For now, we'll create a function that generates default product details
// In production, this should load from PRODUCTS_INDEX.html's productData object

function getTD1ProductDetails(productId) {
    // Default product details structure
    const defaultDetails = {
        icon: '🧩',
        tagline: '',
        demoUrl: '',
        pricing: [
            { 
                name: 'Standard', 
                price: '$0', 
                priceId: '', 
                features: ['Core functionality', 'Basic features', 'One-time purchase'] 
            }
        ],
        whatItsFor: 'This product provides essential AI functionality for your applications.',
        howItWorks: 'This product integrates seamlessly into your existing workflow with a simple API.',
        whoItsFor: 'AI Developers, Builders, and Teams looking to enhance their applications.',
        whatYouGet: [
            'Complete source code',
            'Full API documentation',
            'Example implementations',
            'One-time purchase, fully yours'
        ]
    };
    
    // Try to get product from TD1_PRODUCTS array
    if (typeof TD1_PRODUCTS !== 'undefined' && Array.isArray(TD1_PRODUCTS)) {
        const product = TD1_PRODUCTS.find(p => p.id === productId);
        if (product) {
            // Build pricing tiers from product data
            const pricing = [];
            if (product.stripePriceId) {
                pricing.push({
                    name: 'Standard',
                    price: `$${product.price}`,
                    priceId: product.stripePriceId,
                    features: product.benefits || ['Core functionality', 'Full features', 'One-time purchase']
                });
            }
            
            return {
                icon: getProductIcon(product.category),
                tagline: product.description,
                demoUrl: product.demoUrl || '',
                pricing: pricing.length > 0 ? pricing : defaultDetails.pricing,
                whatItsFor: product.description + ' Perfect for building AI applications that need this functionality.',
                howItWorks: `This product uses advanced AI technology to provide ${product.description.toLowerCase()}. It integrates seamlessly with your existing infrastructure.`,
                whoItsFor: `AI Developers building ${product.category} applications. Teams needing ${product.name} functionality.`,
                whatYouGet: product.benefits ? product.benefits.map(b => `✓ ${b}`) : defaultDetails.whatYouGet
            };
        }
    }
    
    return defaultDetails;
}

function getProductIcon(category) {
    const icons = {
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
    return icons[category] || '🧩';
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.getTD1ProductDetails = getTD1ProductDetails;
}

