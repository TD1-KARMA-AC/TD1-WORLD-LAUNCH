/**
 * Atlas Website Integration
 * 
 * Integrates Atlas as a search replacement for TD1.WORLD website.
 * Searches across all products, blocks, and provides intelligent suggestions.
 */

import { getAtlas } from './atlas.js';
import { SemanticEngine } from './core/semantic.js';

export class AtlasWebsiteIntegration {
    constructor() {
        this.atlas = getAtlas();
        this.semanticEngine = new SemanticEngine();
        this.products = [];
        this.blocks = [];
        this.loadProductData();
    }

    /**
     * Load product and block data
     */
    async loadProductData() {
        // Load TD1.WORLD products
        try {
            const productsResponse = await fetch('/website/PRODUCTS_INDEX.html');
            if (productsResponse.ok) {
                const html = await productsResponse.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                this.products = this.extractProducts(doc);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }

        // Load NeuroBlocks
        try {
            const blocksData = localStorage.getItem('neuroblocks');
            if (blocksData) {
                this.blocks = JSON.parse(blocksData);
            }
        } catch (error) {
            console.error('Error loading blocks:', error);
        }

        // Add products and blocks to Atlas cognitive map
        this.addToCognitiveMap();
    }

    /**
     * Extract products from products page
     */
    extractProducts(doc) {
        const products = [];
        
        // Find all product sections
        const productSections = doc.querySelectorAll('.product-card, .product-item, section[class*="product"]');
        
        productSections.forEach(section => {
            const title = section.querySelector('h2, h3, .product-title')?.textContent?.trim();
            const description = section.querySelector('p, .product-description')?.textContent?.trim();
            const link = section.querySelector('a')?.href;
            const category = section.querySelector('.category, .category-badge')?.textContent?.trim();
            
            if (title) {
                products.push({
                    id: `product_${products.length}`,
                    title,
                    description: description || '',
                    url: link || '#',
                    category: category || 'general',
                    type: 'product'
                });
            }
        });

        return products;
    }

    /**
     * Add products and blocks to cognitive map
     */
    addToCognitiveMap() {
        // Add products as landmarks
        this.products.forEach(product => {
            const landmark = {
                id: product.id,
                url: product.url,
                title: product.title,
                topicNeighbourhood: this.mapCategoryToTopic(product.category),
                summary: product.description,
                reliabilityScore: 0.9,
                metadata: { type: 'product', category: product.category }
            };
            this.atlas.graph.addLandmark(landmark);
        });

        // Add blocks as landmarks
        this.blocks.forEach(block => {
            const landmark = {
                id: `block_${block.id}`,
                url: `/neuroblock/product.html?id=${block.id}`,
                title: block.name,
                topicNeighbourhood: block.category || 'general',
                summary: block.description,
                reliabilityScore: 0.8,
                metadata: { type: 'block', category: block.category }
            };
            this.atlas.graph.addLandmark(landmark);
        });
    }

    /**
     * Map product category to topic
     */
    mapCategoryToTopic(category) {
        const categoryMap = {
            'infrastructure': 'general',
            'development-tools': 'data',
            'enterprise': 'general',
            'personal-ai': 'agents',
            'platform': 'general',
            'forbidden-blocks': 'general',
            'nlp': 'nlp',
            'vision': 'vision',
            'agents': 'agents',
            'data': 'data'
        };
        return categoryMap[category.toLowerCase()] || 'general';
    }

    /**
     * Search across all products and blocks
     */
    async search(query) {
        const results = {
            products: [],
            blocks: [],
            suggestions: []
        };

        // Use semantic matching
        const allItems = [
            ...this.products.map(p => ({ ...p, type: 'product' })),
            ...this.blocks.map(b => ({ ...b, type: 'block', title: b.name }))
        ];

        const matches = await this.semanticEngine.findSemanticMatches(
            query,
            this.atlas.graph.topics,
            this.atlas.graph.landmarks
        );

        // Get matching landmarks
        matches.forEach(match => {
            if (match.type === 'landmark') {
                const landmark = match.node;
                if (landmark.metadata?.type === 'product') {
                    results.products.push({
                        ...landmark,
                        similarity: match.similarity
                    });
                } else if (landmark.metadata?.type === 'block') {
                    results.blocks.push({
                        ...landmark,
                        similarity: match.similarity
                    });
                }
            }
        });

        // Sort by similarity
        results.products.sort((a, b) => b.similarity - a.similarity);
        results.blocks.sort((a, b) => b.similarity - a.similarity);

        // Generate intelligent suggestions
        results.suggestions = this.generateSuggestions(query, results);

        return results;
    }

    /**
     * Generate intelligent suggestions
     */
    generateSuggestions(query, results) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // Check if nothing found
        if (results.products.length === 0 && results.blocks.length === 0) {
            suggestions.push({
                type: 'create',
                title: 'Nothing found - Create with Karma AC',
                description: `"${query}" doesn't exist yet. Discuss with Karma AC how to build it.`,
                action: 'karma-ac',
                icon: '🤖',
                url: '/karma-ac'
            });
        }

        // Check if should be discussed on Realm
        const realmKeywords = ['discuss', 'talk', 'community', 'forum', 'share', 'idea'];
        if (realmKeywords.some(keyword => lowerQuery.includes(keyword))) {
            suggestions.push({
                type: 'realm',
                title: 'Discuss on Realm',
                description: 'This might be better discussed in the Realm community.',
                action: 'realm',
                icon: '💬',
                url: '/realm'
            });
        }

        // Check if Karma AC could help
        const karmaKeywords = ['build', 'create', 'make', 'develop', 'how to', 'tutorial'];
        if (karmaKeywords.some(keyword => lowerQuery.includes(keyword))) {
            suggestions.push({
                type: 'karma-ac',
                title: 'Build with Karma AC',
                description: 'Karma AC can help you build this. Start a conversation.',
                action: 'karma-ac',
                icon: '⚡',
                url: '/karma-ac'
            });
        }

        // Check if it's a good idea for a block
        if (results.products.length === 0 && results.blocks.length === 0) {
            suggestions.push({
                type: 'neuroblock',
                title: 'Submit as NeuroBlock',
                description: 'This could be a great NeuroBlock. Consider submitting it.',
                action: 'submit',
                icon: '🧩',
                url: '/neuroblock/submit.html'
            });
        }

        return suggestions;
    }

    /**
     * Navigate using Atlas (for website integration)
     */
    async navigate(query) {
        // First try semantic search
        const searchResults = await this.search(query);
        
        // Also use Atlas navigation
        const atlasResult = await this.atlas.navigate(query);
        
        return {
            search: searchResults,
            atlas: atlasResult,
            combined: this.combineResults(searchResults, atlasResult)
        };
    }

    /**
     * Combine search and Atlas results
     */
    combineResults(searchResults, atlasResult) {
        return {
            products: searchResults.products,
            blocks: searchResults.blocks,
            landmarks: atlasResult.success ? atlasResult.orientation.landmarks : [],
            nearbyTopics: atlasResult.success ? atlasResult.orientation.nearbyTopics : [],
            suggestions: searchResults.suggestions,
            message: atlasResult.message || 'Search complete'
        };
    }
}

