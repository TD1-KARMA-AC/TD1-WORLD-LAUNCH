/**
 * Collaborative Mapping Engine
 * 
 * Handles community contributions, consensus scoring, and shared annotations.
 */

import { CollaborativeAnnotation } from './types.js';

export class CollaborativeEngine {
    constructor() {
        this.annotations = new Map(); // Map<nodeId, CollaborativeAnnotation[]>
        this.consensusScores = new Map(); // Map<nodeId, score>
    }

    /**
     * Load collaborative data from localStorage (in production, would be from server)
     */
    loadCollaborativeData() {
        const key = 'atlas_collaborative';
        const stored = localStorage.getItem(key);
        
        if (stored) {
            const data = JSON.parse(stored);
            this.annotations = new Map(data.annotations || []);
            this.consensusScores = new Map(data.consensusScores || []);
        }
    }

    /**
     * Save collaborative data
     */
    saveCollaborativeData() {
        const key = 'atlas_collaborative';
        const data = {
            annotations: Array.from(this.annotations.entries()),
            consensusScores: Array.from(this.consensusScores.entries())
        };
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * Add collaborative annotation
     */
    addAnnotation(nodeId, userId, type, content) {
        const annotation = new CollaborativeAnnotation({
            id: `annotation_${Date.now()}`,
            nodeId,
            userId,
            type,
            content,
            timestamp: new Date().toISOString()
        });

        if (!this.annotations.has(nodeId)) {
            this.annotations.set(nodeId, []);
        }
        this.annotations.get(nodeId).push(annotation);
        
        this.updateConsensusScore(nodeId);
        this.saveCollaborativeData();
        
        return annotation;
    }

    /**
     * Vote on annotation
     */
    voteOnAnnotation(annotationId, nodeId, vote) {
        const annotations = this.annotations.get(nodeId);
        if (!annotations) return;

        const annotation = annotations.find(a => a.id === annotationId);
        if (!annotation) return;

        if (vote === 'up') {
            annotation.votes.up++;
        } else if (vote === 'down') {
            annotation.votes.down++;
        }

        this.updateConsensusScore(nodeId);
        this.saveCollaborativeData();
    }

    /**
     * Update consensus score for a node
     */
    updateConsensusScore(nodeId) {
        const annotations = this.annotations.get(nodeId) || [];
        
        if (annotations.length === 0) {
            this.consensusScores.set(nodeId, 0.5); // Default
            return;
        }

        // Calculate consensus based on votes and number of contributors
        let totalScore = 0;
        let totalWeight = 0;

        annotations.forEach(annotation => {
            const netVotes = annotation.votes.up - annotation.votes.down;
            const weight = Math.max(0, 1 + netVotes * 0.1); // Weight by votes
            totalScore += weight;
            totalWeight += weight;
        });

        const consensus = totalWeight > 0 ? Math.min(1, 0.5 + (totalScore / totalWeight) * 0.5) : 0.5;
        this.consensusScores.set(nodeId, consensus);
    }

    /**
     * Get consensus score for node
     */
    getConsensusScore(nodeId) {
        return this.consensusScores.get(nodeId) || 0.5;
    }

    /**
     * Get annotations for node
     */
    getAnnotations(nodeId) {
        return this.annotations.get(nodeId) || [];
    }

    /**
     * Get top annotations (by votes)
     */
    getTopAnnotations(nodeId, limit = 3) {
        const annotations = this.getAnnotations(nodeId);
        return annotations
            .sort((a, b) => (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down))
            .slice(0, limit);
    }
}

