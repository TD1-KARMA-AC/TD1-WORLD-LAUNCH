/**
 * Atlas Cognitive Web Navigation System
 * Core Data Structures
 * 
 * These structures represent the spatial model of the web:
 * - Landmarks = authoritative sources/pages
 * - Neighbourhoods = topic clusters
 * - Routes = relationships between topics
 */

/**
 * Landmark Node
 * Represents an authoritative source/page in the cognitive map
 */
export class Landmark {
    constructor(data) {
        this.id = data.id; // Canonical identifier (URL or source ID)
        this.url = data.url; // Original URL
        this.title = data.title;
        this.topicNeighbourhood = data.topicNeighbourhood; // Which topic area this belongs to
        this.summary = data.summary; // Human-readable summary
        this.structuredFacts = data.structuredFacts || []; // Structured facts/procedures
        this.provenance = {
            source: data.provenance?.source || data.url,
            snapshotDate: data.provenance?.snapshotDate || new Date().toISOString()
        };
        this.reliabilityScore = data.reliabilityScore || 0.5; // 0-1 confidence score
        this.content = data.content || ''; // Local cached content
        this.metadata = data.metadata || {};
    }
}

/**
 * Topic / Neighbourhood Node
 * Represents a conceptual area or topic cluster
 */
export class Topic {
    constructor(data) {
        this.id = data.id; // Unique topic identifier
        this.name = data.name; // Human-readable name
        this.description = data.description;
        this.parentTopics = data.parentTopics || []; // Array of topic IDs
        this.childTopics = data.childTopics || []; // Array of topic IDs
        this.nearbyTopics = data.nearbyTopics || []; // Array of {topicId, distance}
        this.commonUserIntents = data.commonUserIntents || []; // What users typically want here
        this.preferredLandmarks = data.preferredLandmarks || []; // Array of landmark IDs
        this.familiarity = data.familiarity || 0.5; // How well-mapped this area is (0-1)
    }
}

/**
 * Route Edge
 * Represents a relationship between topics/landmarks
 * Routes are NOT just links - they have semantic meaning
 */
export class Route {
    constructor(data) {
        this.id = data.id;
        this.from = data.from; // Source node ID (topic or landmark)
        this.to = data.to; // Destination node ID
        this.type = data.type; // 'often-used-with' | 'prerequisite' | 'deeper-explanation' | 'alternative-approach' | 'related'
        this.distance = data.distance || 1.0; // Conceptual distance (lower = closer)
        this.confidence = data.confidence || 0.5; // How reliable this route is
        this.description = data.description; // Human-readable description of the relationship
        this.usageCount = data.usageCount || 0; // How often this route is taken
    }
}

/**
 * Personal Memory Entry
 * User-specific routes, preferences, and corrections
 */
export class PersonalMemory {
    constructor(data) {
        this.userId = data.userId;
        this.preferredSources = data.preferredSources || []; // Array of landmark IDs
        this.rejectedSources = data.rejectedSources || []; // Array of landmark IDs
        this.commonPaths = data.commonPaths || []; // Array of route sequences
        this.corrections = data.corrections || {}; // Override global defaults
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
        // Enhanced features
        this.routeHistory = data.routeHistory || []; // Full navigation history with timestamps
        this.conversationThreads = data.conversationThreads || []; // Conversation context
        this.patterns = data.patterns || {}; // Learned navigation patterns
        this.sessionContext = data.sessionContext || null; // Current session context
    }
}

/**
 * Current Location
 * Represents where the user is in the cognitive map
 */
export class CurrentLocation {
    constructor(data) {
        this.topicId = data.topicId; // Current topic neighbourhood
        this.landmarkId = data.landmarkId || null; // Current landmark (if viewing specific page)
        this.path = data.path || []; // How we got here (array of route IDs)
        this.confidence = data.confidence || 0.5; // How certain we are about location
        this.timestamp = data.timestamp || new Date().toISOString();
        // Enhanced features
        this.historyIndex = data.historyIndex || -1; // Index in navigation history
        this.arrivalTime = data.arrivalTime || new Date().toISOString();
    }
}

/**
 * Navigation Intent
 * What the user wants to do
 */
export class NavigationIntent {
    constructor(data) {
        this.destinationTopicId = data.destinationTopicId; // Where they want to go
        this.destinationLandmarkId = data.destinationLandmarkId || null; // Specific landmark
        this.intentType = data.intentType || 'explore'; // 'explore' | 'learn' | 'find' | 'navigate'
        this.query = data.query || ''; // Original user input (for context)
        this.timestamp = data.timestamp || new Date().toISOString();
        // Enhanced features
        this.semanticEmbedding = data.semanticEmbedding || null; // Embedding vector for semantic matching
        this.confidence = data.confidence || 0.5; // Confidence in intent understanding
        this.context = data.context || {}; // Additional context (voice, image, etc.)
    }
}

/**
 * Route History Entry
 * Tracks navigation history for backtracking
 */
export class RouteHistoryEntry {
    constructor(data) {
        this.location = data.location; // CurrentLocation at this point
        this.timestamp = data.timestamp || new Date().toISOString();
        this.action = data.action || 'navigate'; // 'navigate' | 'back' | 'forward'
        this.intent = data.intent || null; // Original intent
    }
}

/**
 * Conversation Thread
 * Tracks conversation context
 */
export class ConversationThread {
    constructor(data) {
        this.id = data.id || `thread_${Date.now()}`;
        this.messages = data.messages || [];
        this.context = data.context || {};
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
    }
}

/**
 * Collaborative Annotation
 * Community contributions to the map
 */
export class CollaborativeAnnotation {
    constructor(data) {
        this.id = data.id;
        this.nodeId = data.nodeId; // Topic or landmark ID
        this.userId = data.userId;
        this.type = data.type; // 'landmark' | 'route' | 'correction' | 'note'
        this.content = data.content;
        this.votes = data.votes || { up: 0, down: 0 };
        this.timestamp = data.timestamp || new Date().toISOString();
    }
}

