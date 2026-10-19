/**
 * Atlas Graph Traversal Engine
 * 
 * Handles spatial navigation through the cognitive map.
 * NO SEARCH - only graph traversal and orientation.
 */

import { Landmark, Topic, Route, CurrentLocation, NavigationIntent } from './types.js';

export class AtlasGraph {
    constructor() {
        this.landmarks = new Map(); // Map<id, Landmark>
        this.topics = new Map(); // Map<id, Topic>
        this.routes = new Map(); // Map<id, Route>
        this.landmarkIndex = new Map(); // Map<topicId, Set<landmarkId>> for fast lookup
        this.routeIndex = new Map(); // Map<nodeId, Set<routeId>> for fast lookup
    }

    /**
     * Add a landmark to the graph
     */
    addLandmark(landmark) {
        if (!(landmark instanceof Landmark)) {
            landmark = new Landmark(landmark);
        }
        this.landmarks.set(landmark.id, landmark);
        
        // Index by topic
        if (!this.landmarkIndex.has(landmark.topicNeighbourhood)) {
            this.landmarkIndex.set(landmark.topicNeighbourhood, new Set());
        }
        this.landmarkIndex.get(landmark.topicNeighbourhood).add(landmark.id);
    }

    /**
     * Add a topic to the graph
     */
    addTopic(topic) {
        if (!(topic instanceof Topic)) {
            topic = new Topic(topic);
        }
        this.topics.set(topic.id, topic);
    }

    /**
     * Add a route to the graph
     */
    addRoute(route) {
        if (!(route instanceof Route)) {
            route = new Route(route);
        }
        this.routes.set(route.id, route);
        
        // Index by source node
        if (!this.routeIndex.has(route.from)) {
            this.routeIndex.set(route.from, new Set());
        }
        this.routeIndex.get(route.from).add(route.id);
    }

    /**
     * Get all landmarks in a topic neighbourhood
     */
    getLandmarksInNeighbourhood(topicId) {
        const landmarkIds = this.landmarkIndex.get(topicId) || new Set();
        return Array.from(landmarkIds).map(id => this.landmarks.get(id)).filter(Boolean);
    }

    /**
     * Get all routes from a node
     */
    getRoutesFrom(nodeId) {
        const routeIds = this.routeIndex.get(nodeId) || new Set();
        return Array.from(routeIds).map(id => this.routes.get(id)).filter(Boolean);
    }

    /**
     * Get nearby topics (conceptually close)
     */
    getNearbyTopics(topicId) {
        const topic = this.topics.get(topicId);
        if (!topic) return [];
        
        return topic.nearbyTopics
            .map(({ topicId, distance }) => ({
                topic: this.topics.get(topicId),
                distance
            }))
            .filter(({ topic }) => topic)
            .sort((a, b) => a.distance - b.distance);
    }

    /**
     * Plan a route from current location to destination
     * Returns array of route IDs representing the path
     */
    planRoute(currentLocation, intent) {
        const currentTopicId = currentLocation.topicId;
        const destinationTopicId = intent.destinationTopicId;
        
        if (currentTopicId === destinationTopicId) {
            return []; // Already there
        }

        // Simple pathfinding: find shortest path through topic graph
        // In a full implementation, this would use A* or Dijkstra's algorithm
        const path = this.findPath(currentTopicId, destinationTopicId);
        
        return path;
    }

    /**
     * Find path between two topics using BFS
     */
    findPath(fromTopicId, toTopicId) {
        if (fromTopicId === toTopicId) return [];
        
        const queue = [[fromTopicId, []]];
        const visited = new Set([fromTopicId]);
        
        while (queue.length > 0) {
            const [currentId, path] = queue.shift();
            const topic = this.topics.get(currentId);
            
            if (!topic) continue;
            
            // Check all nearby topics and child/parent relationships
            const neighbors = [
                ...topic.nearbyTopics.map(n => n.topicId),
                ...topic.childTopics,
                ...topic.parentTopics
            ];
            
            for (const neighborId of neighbors) {
                if (visited.has(neighborId)) continue;
                
                if (neighborId === toTopicId) {
                    // Found destination
                    return path;
                }
                
                visited.add(neighborId);
                queue.push([neighborId, [...path, neighborId]]);
            }
        }
        
        return null; // No path found
    }

    /**
     * Get orientation information for current location
     * Returns what's nearby, available routes, etc.
     */
    getOrientation(currentLocation) {
        const topic = this.topics.get(currentLocation.topicId);
        if (!topic) {
            return {
                error: 'Unknown location',
                confidence: 0
            };
        }

        const landmarks = this.getLandmarksInNeighbourhood(currentLocation.topicId);
        const nearbyTopics = this.getNearbyTopics(currentLocation.topicId);
        const availableRoutes = this.getRoutesFrom(currentLocation.topicId);

        return {
            currentTopic: topic,
            landmarks: landmarks.sort((a, b) => b.reliabilityScore - a.reliabilityScore),
            nearbyTopics: nearbyTopics.slice(0, 5), // Top 5 closest
            availableRoutes: availableRoutes.sort((a, b) => a.distance - b.distance),
            confidence: topic.familiarity,
            isWellMapped: topic.familiarity > 0.7
        };
    }
}

