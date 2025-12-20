/**
 * Initial Cognitive Map Data
 * 
 * This is a seed dataset that demonstrates the spatial model.
 * In production, this would be built by the ingestion system.
 */

import { Landmark, Topic, Route } from '../core/types.js';

/**
 * Initialize a basic cognitive map for Atlas
 */
export function initializeAtlasMap() {
    const landmarks = [
        new Landmark({
            id: 'nlp-sentiment-analyzer',
            url: '#',
            title: 'NLP Sentiment Analyzer',
            topicNeighbourhood: 'nlp',
            summary: 'Advanced sentiment analysis block for processing text data with high accuracy.',
            structuredFacts: [
                'Category: NLP',
                'Price: $29.99',
                'Rating: 4.5',
                'Downloads: 120'
            ],
            reliabilityScore: 0.8,
            metadata: {
                creator: 'AI Developer',
                version: '1.0.0',
                license: 'MIT'
            }
        }),
        new Landmark({
            id: 'image-classifier',
            url: '#',
            title: 'Image Classifier',
            topicNeighbourhood: 'vision',
            summary: 'State-of-the-art image classification using deep learning models.',
            structuredFacts: [
                'Category: Computer Vision',
                'Price: $49.99',
                'Rating: 4.8',
                'Downloads: 89'
            ],
            reliabilityScore: 0.85,
            metadata: {
                creator: 'Vision Pro',
                version: '1.2.0',
                license: 'Apache-2.0'
            }
        })
    ];

    const topics = [
        new Topic({
            id: 'general',
            name: 'General',
            description: 'The main entry point to NeuroBlocks',
            nearbyTopics: [
                { topicId: 'nlp', distance: 1.0 },
                { topicId: 'vision', distance: 1.0 },
                { topicId: 'agents', distance: 1.2 }
            ],
            commonUserIntents: [
                'browse blocks',
                'find AI tools',
                'explore marketplace'
            ],
            familiarity: 0.9
        }),
        new Topic({
            id: 'nlp',
            name: 'Natural Language Processing',
            description: 'Blocks for text processing, sentiment analysis, and language understanding',
            parentTopics: ['general'],
            nearbyTopics: [
                { topicId: 'general', distance: 1.0 },
                { topicId: 'data', distance: 1.1 },
                { topicId: 'agents', distance: 1.3 }
            ],
            commonUserIntents: [
                'analyze text',
                'sentiment analysis',
                'text processing',
                'NLP tools'
            ],
            preferredLandmarks: ['nlp-sentiment-analyzer'],
            familiarity: 0.8
        }),
        new Topic({
            id: 'vision',
            name: 'Computer Vision',
            description: 'Blocks for image processing, classification, and visual understanding',
            parentTopics: ['general'],
            nearbyTopics: [
                { topicId: 'general', distance: 1.0 },
                { topicId: 'data', distance: 1.1 },
                { topicId: 'agents', distance: 1.2 }
            ],
            commonUserIntents: [
                'classify images',
                'image processing',
                'computer vision',
                'visual AI'
            ],
            preferredLandmarks: ['image-classifier'],
            familiarity: 0.8
        }),
        new Topic({
            id: 'agents',
            name: 'AI Agents',
            description: 'Autonomous agents and intelligent systems',
            parentTopics: ['general'],
            nearbyTopics: [
                { topicId: 'general', distance: 1.2 },
                { topicId: 'nlp', distance: 1.3 },
                { topicId: 'vision', distance: 1.2 }
            ],
            commonUserIntents: [
                'build agents',
                'autonomous systems',
                'AI assistants'
            ],
            familiarity: 0.6
        }),
        new Topic({
            id: 'data',
            name: 'Data Processing',
            description: 'Blocks for data manipulation, transformation, and analysis',
            parentTopics: ['general'],
            nearbyTopics: [
                { topicId: 'nlp', distance: 1.1 },
                { topicId: 'vision', distance: 1.1 },
                { topicId: 'general', distance: 1.2 }
            ],
            commonUserIntents: [
                'process data',
                'transform data',
                'data analysis'
            ],
            familiarity: 0.7
        }),
        new Topic({
            id: 'utils',
            name: 'Utilities',
            description: 'Helper blocks and utility functions',
            parentTopics: ['general'],
            nearbyTopics: [
                { topicId: 'general', distance: 1.3 },
                { topicId: 'data', distance: 1.2 }
            ],
            commonUserIntents: [
                'utility functions',
                'helper tools',
                'common utilities'
            ],
            familiarity: 0.7
        })
    ];

    const routes = [
        new Route({
            id: 'general-to-nlp',
            from: 'general',
            to: 'nlp',
            type: 'often-used-with',
            distance: 1.0,
            confidence: 0.9,
            description: 'NLP tools are commonly explored from the general area'
        }),
        new Route({
            id: 'general-to-vision',
            from: 'general',
            to: 'vision',
            type: 'often-used-with',
            distance: 1.0,
            confidence: 0.9,
            description: 'Computer vision tools are commonly explored from the general area'
        }),
        new Route({
            id: 'nlp-to-data',
            from: 'nlp',
            to: 'data',
            type: 'often-used-with',
            distance: 1.1,
            confidence: 0.8,
            description: 'NLP often works with data processing blocks'
        })
    ];

    return { landmarks, topics, routes };
}

