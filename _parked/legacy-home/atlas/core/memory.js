/**
 * Personal Memory Layer
 * 
 * Stores user-specific routes, preferences, and corrections.
 * This is personal cognition, not global truth.
 */

import { PersonalMemory } from './types.js';

export class PersonalMemoryLayer {
    constructor(userId = 'default') {
        this.userId = userId;
        this.memory = this.loadMemory();
    }

    /**
     * Load personal memory from localStorage
     */
    loadMemory() {
        const key = `atlas_memory_${this.userId}`;
        const stored = localStorage.getItem(key);
        
        if (stored) {
            const data = JSON.parse(stored);
            return new PersonalMemory(data);
        }
        
        return new PersonalMemory({ userId: this.userId });
    }

    /**
     * Save personal memory to localStorage
     */
    saveMemory() {
        const key = `atlas_memory_${this.userId}`;
        localStorage.setItem(key, JSON.stringify(this.memory));
    }

    /**
     * Record a path the user took
     */
    recordPath(routeIds) {
        this.memory.commonPaths.push({
            routeIds,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 paths
        if (this.memory.commonPaths.length > 100) {
            this.memory.commonPaths = this.memory.commonPaths.slice(-100);
        }
        
        this.saveMemory();
    }

    /**
     * Add conversation message
     */
    addConversationMessage(threadId, message, role = 'user') {
        if (!this.memory.conversationThreads) {
            this.memory.conversationThreads = [];
        }

        let thread = this.memory.conversationThreads.find(t => t.id === threadId);
        if (!thread) {
            thread = {
                id: threadId,
                messages: [],
                context: {},
                createdAt: new Date().toISOString()
            };
            this.memory.conversationThreads.push(thread);
        }

        thread.messages.push({
            role,
            content: message,
            timestamp: new Date().toISOString()
        });
        thread.lastUpdated = new Date().toISOString();

        this.saveMemory();
    }

    /**
     * Get conversation thread
     */
    getConversationThread(threadId) {
        if (!this.memory.conversationThreads) return null;
        return this.memory.conversationThreads.find(t => t.id === threadId);
    }

    /**
     * Set session context
     */
    setSessionContext(context) {
        this.memory.sessionContext = {
            ...context,
            timestamp: new Date().toISOString()
        };
        this.saveMemory();
    }

    /**
     * Get session context
     */
    getSessionContext() {
        return this.memory.sessionContext;
    }

    /**
     * Mark a source as preferred
     */
    preferSource(landmarkId) {
        if (!this.memory.preferredSources.includes(landmarkId)) {
            this.memory.preferredSources.push(landmarkId);
            this.saveMemory();
        }
    }

    /**
     * Mark a source as rejected
     */
    rejectSource(landmarkId) {
        if (!this.memory.rejectedSources.includes(landmarkId)) {
            this.memory.rejectedSources.push(landmarkId);
            this.saveMemory();
        }
    }

    /**
     * Add a correction (override global default)
     */
    addCorrection(nodeId, correction) {
        this.memory.corrections[nodeId] = {
            ...correction,
            timestamp: new Date().toISOString()
        };
        this.saveMemory();
    }

    /**
     * Get user's preferred sources for a topic
     */
    getPreferredSources(topicId) {
        return this.memory.preferredSources.filter(id => {
            // In a full implementation, check if landmark belongs to topic
            return true; // Simplified for now
        });
    }

    /**
     * Check if a source is rejected
     */
    isRejected(landmarkId) {
        return this.memory.rejectedSources.includes(landmarkId);
    }

    /**
     * Get user's common paths (for suggesting routes)
     */
    getCommonPaths() {
        return this.memory.commonPaths;
    }

    /**
     * Apply personal preferences to orientation results
     */
    applyPreferences(orientation) {
        // Filter out rejected sources
        orientation.landmarks = orientation.landmarks.filter(
            landmark => !this.isRejected(landmark.id)
        );

        // Boost preferred sources
        const preferred = this.getPreferredSources(orientation.currentTopic.id);
        orientation.landmarks.sort((a, b) => {
            const aPreferred = preferred.includes(a.id);
            const bPreferred = preferred.includes(b.id);
            if (aPreferred && !bPreferred) return -1;
            if (!aPreferred && bPreferred) return 1;
            return b.reliabilityScore - a.reliabilityScore;
        });

        return orientation;
    }
}

