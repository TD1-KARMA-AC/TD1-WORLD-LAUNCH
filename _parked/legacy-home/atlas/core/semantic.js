/**
 * Semantic Embeddings Engine
 * 
 * Provides semantic understanding for intent parsing.
 * Uses embeddings to match user queries to topics/landmarks.
 */

export class SemanticEngine {
    constructor() {
        this.embeddingsCache = new Map(); // Cache of computed embeddings
        this.similarityThreshold = 0.7; // Minimum similarity for matches
    }

    /**
     * Generate embedding for text (simplified - in production would use actual embedding model)
     * For now, uses a simple TF-IDF-like approach. In production, would call OpenAI/Cohere/etc.
     */
    async generateEmbedding(text) {
        if (this.embeddingsCache.has(text)) {
            return this.embeddingsCache.get(text);
        }

        // Simplified embedding: normalize text and create feature vector
        const normalized = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);

        // Create simple hash-based embedding (in production, use real embeddings)
        const embedding = this.simpleHashEmbedding(normalized);
        
        this.embeddingsCache.set(text, embedding);
        return embedding;
    }

    /**
     * Simple hash-based embedding (placeholder for real embeddings)
     * In production, replace with actual embedding API call
     */
    simpleHashEmbedding(words) {
        const vector = new Array(128).fill(0);
        words.forEach(word => {
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                hash = ((hash << 5) - hash) + word.charCodeAt(i);
                hash = hash & hash;
            }
            const index = Math.abs(hash) % vector.length;
            vector[index] += 1 / words.length;
        });
        // Normalize
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return vector.map(val => magnitude > 0 ? val / magnitude : 0);
    }

    /**
     * Compute cosine similarity between two embeddings
     */
    cosineSimilarity(embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) return 0;
        
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            magnitude1 += embedding1[i] * embedding1[i];
            magnitude2 += embedding2[i] * embedding2[i];
        }
        
        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);
        
        if (magnitude1 === 0 || magnitude2 === 0) return 0;
        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Find best matching topics/landmarks using semantic similarity
     */
    async findSemanticMatches(query, topics, landmarks) {
        const queryEmbedding = await this.generateEmbedding(query);
        const matches = [];

        // Match topics
        for (const [topicId, topic] of topics.entries()) {
            const topicText = `${topic.name} ${topic.description || ''} ${topic.commonUserIntents.join(' ')}`;
            const topicEmbedding = await this.generateEmbedding(topicText);
            const similarity = this.cosineSimilarity(queryEmbedding, topicEmbedding);
            
            if (similarity >= this.similarityThreshold) {
                matches.push({
                    type: 'topic',
                    id: topicId,
                    similarity,
                    node: topic
                });
            }
        }

        // Match landmarks
        for (const [landmarkId, landmark] of landmarks.entries()) {
            const landmarkText = `${landmark.title} ${landmark.summary || ''}`;
            const landmarkEmbedding = await this.generateEmbedding(landmarkText);
            const similarity = this.cosineSimilarity(queryEmbedding, landmarkEmbedding);
            
            if (similarity >= this.similarityThreshold) {
                matches.push({
                    type: 'landmark',
                    id: landmarkId,
                    similarity,
                    node: landmark
                });
            }
        }

        // Sort by similarity
        matches.sort((a, b) => b.similarity - a.similarity);
        
        return matches;
    }
}

