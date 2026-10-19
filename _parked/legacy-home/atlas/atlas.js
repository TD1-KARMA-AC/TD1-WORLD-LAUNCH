/**
 * Atlas Main Interface
 * 
 * This is the public API for the Atlas cognitive navigation system.
 * It coordinates all components and provides the orientation-based interface.
 */

import { AtlasGraph } from './core/graph.js';
import { PersonalMemoryLayer } from './core/memory.js';
import { OrientationEngine } from './core/orientation.js';
import { ProactiveEngine } from './core/proactive.js';
import { initializeAtlasMap } from './data/initial-map.js';

export class Atlas {
    constructor(userId = 'default') {
        this.graph = new AtlasGraph();
        this.memory = new PersonalMemoryLayer(userId);
        this.orientation = new OrientationEngine(this.graph, this.memory);
        this.proactive = new ProactiveEngine(this.memory);
        
        // Initialize with seed data
        this.initializeMap();
    }

    /**
     * Initialize the cognitive map with seed data
     */
    initializeMap() {
        const { landmarks, topics, routes } = initializeAtlasMap();
        
        landmarks.forEach(landmark => this.graph.addLandmark(landmark));
        topics.forEach(topic => this.graph.addTopic(topic));
        routes.forEach(route => this.graph.addRoute(route));
    }

    /**
     * Handle user input - this is the main entry point
     * Returns orientation information, NOT search results
     */
    async navigate(userInput, context = {}) {
        // Process intent (spatial reasoning with semantic understanding)
        const intent = await this.orientation.processIntent(userInput, context);
        
        // If destination is unknown, return helpful message
        if (intent.destinationTopicId === 'unknown') {
            return {
                success: false,
                message: "I don't have that area mapped yet. This space is unmapped or low confidence.",
                suggestion: "Try exploring nearby areas, or I can update this later.",
                currentOrientation: this.orientation.getCurrentOrientation()
            };
        }
        
        // Navigate to destination
        const result = this.orientation.navigateTo(intent);
        
        // Get proactive suggestions
        const suggestions = this.proactive.getSuggestions(result.location, this.graph);
        
        return {
            success: true,
            location: result.location,
            orientation: result.orientation,
            route: result.route,
            suggestions,
            message: this.generateOrientationMessage(result.orientation)
        };
    }

    /**
     * Navigate back in history
     */
    goBack() {
        const result = this.orientation.goBack();
        if (!result) {
            return {
                success: false,
                message: "No history to go back to."
            };
        }
        return {
            success: true,
            location: result.location,
            orientation: result.orientation,
            message: "Went back in navigation history."
        };
    }

    /**
     * Get current orientation (where am I, what's nearby)
     */
    getCurrentOrientation() {
        return this.orientation.getCurrentOrientation();
    }

    /**
     * Generate human-readable orientation message
     * Uses Atlas language principles (no search engine phrases)
     */
    generateOrientationMessage(orientation) {
        const topic = orientation.currentTopic;
        const landmarks = orientation.landmarks;
        const nearbyTopics = orientation.nearbyTopics;
        
        let message = `You're in the ${topic.name} area. `;
        
        if (orientation.isWellMapped) {
            message += "This is a well-mapped space. ";
        } else {
            message += "This area has lower confidence. ";
        }
        
        if (landmarks.length > 0) {
            message += `There are ${landmarks.length} landmarks here. `;
            if (landmarks.length > 0) {
                message += `The most reliable is "${landmarks[0].title}". `;
            }
        }
        
        if (nearbyTopics.length > 0) {
            message += `Nearby areas include ${nearbyTopics.slice(0, 2).map(t => t.topic.name).join(' and ')}. `;
        }
        
        return message.trim();
    }

    /**
     * Record user preference (prefer/reject source)
     */
    preferSource(landmarkId) {
        this.memory.preferSource(landmarkId);
    }

    rejectSource(landmarkId) {
        this.memory.rejectSource(landmarkId);
    }
}

// Export singleton instance
let atlasInstance = null;

export function getAtlas(userId = 'default') {
    if (!atlasInstance || atlasInstance.memory.userId !== userId) {
        atlasInstance = new Atlas(userId);
    }
    return atlasInstance;
}

