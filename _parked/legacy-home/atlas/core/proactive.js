/**
 * Proactive Intelligence Engine
 * 
 * Learns patterns and provides predictive suggestions.
 */

export class ProactiveEngine {
    constructor(memoryLayer) {
        this.memory = memoryLayer;
        this.patterns = {};
    }

    /**
     * Analyze navigation patterns
     */
    analyzePatterns() {
        const paths = this.memory.memory.commonPaths || [];
        const patterns = {};

        // Find common sequences
        paths.forEach((pathEntry, index) => {
            if (index > 0) {
                const prevPath = paths[index - 1];
                const currentPath = pathEntry.routeIds;
                const prevLast = prevPath.routeIds[prevPath.routeIds.length - 1];
                
                if (currentPath.length > 0) {
                    const currentFirst = currentPath[0];
                    const key = `${prevLast}->${currentFirst}`;
                    patterns[key] = (patterns[key] || 0) + 1;
                }
            }
        });

        this.patterns = patterns;
        return patterns;
    }

    /**
     * Get predictive suggestions based on current location and history
     */
    getSuggestions(currentLocation, graph) {
        const suggestions = [];
        const patterns = this.analyzePatterns();
        
        // Get current topic
        const currentTopic = graph.topics.get(currentLocation.topicId);
        if (!currentTopic) return suggestions;

        // Find patterns that start from current location
        const currentRoutes = graph.getRoutesFrom(currentLocation.topicId);
        
        currentRoutes.forEach(route => {
            const patternKey = `${route.id}`;
            const patternCount = patterns[patternKey] || 0;
            
            if (patternCount > 2) { // If taken more than twice
                const toTopic = graph.topics.get(route.to);
                if (toTopic) {
                    suggestions.push({
                        route,
                        topic: toTopic,
                        confidence: Math.min(patternCount / 10, 1.0), // Normalize to 0-1
                        reason: `You've taken this route ${patternCount} times`
                    });
                }
            }
        });

        // Sort by confidence
        suggestions.sort((a, b) => b.confidence - a.confidence);
        
        return suggestions.slice(0, 3); // Top 3 suggestions
    }

    /**
     * Learn from user action
     */
    learnFromAction(action) {
        // Store pattern for future learning
        // This would be called after each navigation
    }
}

