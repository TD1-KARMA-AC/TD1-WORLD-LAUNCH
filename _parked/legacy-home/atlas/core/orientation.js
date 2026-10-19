/**
 * Orientation Engine
 * 
 * The core logic that determines current location, plans routes,
 * and orients users in the cognitive map.
 * 
 * This is where the "spatial navigation" happens instead of search.
 */

import { CurrentLocation, NavigationIntent, RouteHistoryEntry } from './types.js';
import { AtlasGraph } from './graph.js';
import { PersonalMemoryLayer } from './memory.js';
import { SemanticEngine } from './semantic.js';

export class OrientationEngine {
    constructor(graph, memoryLayer) {
        this.graph = graph;
        this.memory = memoryLayer;
        this.currentLocation = null;
        this.semanticEngine = new SemanticEngine();
        this.routeHistory = []; // Full navigation history
    }

    /**
     * Process user intent and determine destination
     * This is NOT search - it's spatial reasoning with semantic understanding
     */
    async processIntent(userInput, context = {}) {
        // Use semantic embeddings for better understanding
        const intent = await this.parseUserInput(userInput, context);
        return intent;
    }

    /**
     * Parse user input into navigation intent using semantic embeddings
     */
    async parseUserInput(input, context = {}) {
        // First try semantic matching
        const semanticMatches = await this.semanticEngine.findSemanticMatches(
            input,
            this.graph.topics,
            this.graph.landmarks
        );

        let destinationTopicId = null;
        let destinationLandmarkId = null;
        let confidence = 0.5;

        if (semanticMatches.length > 0) {
            const bestMatch = semanticMatches[0];
            confidence = bestMatch.similarity;
            
            if (bestMatch.type === 'topic') {
                destinationTopicId = bestMatch.id;
            } else if (bestMatch.type === 'landmark') {
                destinationLandmarkId = bestMatch.id;
                const landmark = bestMatch.node;
                destinationTopicId = landmark.topicNeighbourhood;
            }
        }

        // Fallback to keyword matching if semantic fails
        if (!destinationTopicId) {
            const lowerInput = input.toLowerCase().trim();
            
            for (const [topicId, topic] of this.graph.topics.entries()) {
                if (topic.name.toLowerCase().includes(lowerInput) ||
                    topic.description?.toLowerCase().includes(lowerInput)) {
                    destinationTopicId = topicId;
                    confidence = 0.6; // Lower confidence for keyword match
                    break;
                }
            }
        }

        // Generate embedding for the query
        const embedding = await this.semanticEngine.generateEmbedding(input);
        
        return new NavigationIntent({
            destinationTopicId: destinationTopicId || 'unknown',
            destinationLandmarkId,
            query: input,
            intentType: destinationLandmarkId ? 'find' : 'explore',
            semanticEmbedding: embedding,
            confidence,
            context
        });
    }

    /**
     * Navigate to a destination
     * Returns orientation information for the new location
     */
    navigateTo(intent) {
        if (!this.currentLocation) {
            // Initialize to default location
            this.currentLocation = new CurrentLocation({
                topicId: 'general',
                confidence: 0.5
            });
        }

        // Save current location to history before navigating
        this.addToHistory(this.currentLocation, intent);

        // Plan route
        const route = this.graph.planRoute(this.currentLocation, intent);
        
        // Update current location
        this.currentLocation = new CurrentLocation({
            topicId: intent.destinationTopicId,
            landmarkId: intent.destinationLandmarkId,
            path: route,
            confidence: intent.confidence || 0.7,
            historyIndex: this.routeHistory.length
        });

        // Get orientation
        let orientation = this.graph.getOrientation(this.currentLocation);
        
        // Apply personal preferences
        orientation = this.memory.applyPreferences(orientation);
        
        // Record path if route was taken
        if (route && route.length > 0) {
            this.memory.recordPath(route);
            // Update route usage counts
            route.forEach(routeId => {
                const routeObj = this.graph.routes.get(routeId);
                if (routeObj) {
                    routeObj.usageCount = (routeObj.usageCount || 0) + 1;
                }
            });
        }
        
        return {
            location: this.currentLocation,
            orientation,
            route
        };
    }

    /**
     * Add location to navigation history
     */
    addToHistory(location, intent) {
        const historyEntry = new RouteHistoryEntry({
            location: { ...location },
            intent,
            timestamp: new Date().toISOString()
        });
        this.routeHistory.push(historyEntry);
        
        // Keep last 100 entries
        if (this.routeHistory.length > 100) {
            this.routeHistory = this.routeHistory.slice(-100);
        }
    }

    /**
     * Navigate back in history
     */
    goBack() {
        if (this.routeHistory.length < 2) return null;
        
        // Get previous location
        const previousEntry = this.routeHistory[this.routeHistory.length - 2];
        if (!previousEntry) return null;
        
        // Remove current and previous from history
        this.routeHistory.pop(); // Remove current
        this.routeHistory.pop(); // Remove previous (will become current)
        
        // Restore previous location
        this.currentLocation = previousEntry.location;
        
        return this.getCurrentOrientation();
    }

    /**
     * Get navigation history
     */
    getHistory() {
        return this.routeHistory;
    }

    /**
     * Get current orientation (where am I, what's nearby)
     */
    getCurrentOrientation() {
        if (!this.currentLocation) {
            // Initialize to default
            this.currentLocation = new CurrentLocation({
                topicId: 'general',
                confidence: 0.5
            });
        }

        let orientation = this.graph.getOrientation(this.currentLocation);
        orientation = this.memory.applyPreferences(orientation);
        
        return {
            location: this.currentLocation,
            orientation
        };
    }

    /**
     * Handle "I don't know" - mark area as unmapped
     */
    markUnmapped(topicId) {
        const topic = this.graph.topics.get(topicId);
        if (topic) {
            topic.familiarity = Math.max(0, topic.familiarity - 0.1);
        }
    }
}

