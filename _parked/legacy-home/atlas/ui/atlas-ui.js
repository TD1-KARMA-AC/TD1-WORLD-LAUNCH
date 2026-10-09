/**
 * Atlas UI Components
 * 
 * Spatial navigation interface components.
 * NO search bars, NO ranked lists, NO link dumps.
 * Shows: current location, nearby concepts, available routes, confidence.
 */

import { GraphVisualization } from './graph-visualization.js';
import { VoiceEngine } from '../core/voice.js';

export class AtlasUI {
    constructor(atlas, containerId) {
        this.atlas = atlas;
        this.container = document.getElementById(containerId);
        this.currentOrientation = null;
        this.graphViz = null;
        this.voiceEngine = new VoiceEngine();
        this.viewMode = 'cards'; // 'cards' | 'graph' | '3d'
        this.isVoiceListening = false;
    }

    /**
     * Initialize the UI
     */
    async init() {
        // Get initial orientation
        const result = this.atlas.getCurrentOrientation();
        this.currentOrientation = result.orientation;
        
        // Initialize graph visualization
        this.initGraphVisualization();
        
        // Initialize voice interface
        this.initVoiceInterface();
        
        // Render initial state
        this.render();
    }

    /**
     * Initialize graph visualization
     */
    initGraphVisualization() {
        const graphContainer = document.createElement('div');
        graphContainer.id = 'atlas-graph-container';
        graphContainer.style.display = 'none';
        graphContainer.style.width = '100%';
        graphContainer.style.height = '600px';
        graphContainer.style.marginBottom = '2rem';
        this.container.parentElement.insertBefore(graphContainer, this.container);
        
        this.graphViz = new GraphVisualization('atlas-graph-container', this.atlas);
        this.graphViz.init();
    }

    /**
     * Initialize voice interface
     */
    initVoiceInterface() {
        if (this.voiceEngine.isAvailable()) {
            // Voice button will be added in render
        }
    }

    /**
     * Handle user input (voice or text)
     * Treats input as directional commands, not queries
     */
    async handleInput(input, context = {}) {
        if (!input || !input.trim()) return;
        
        // Show loading state
        this.showLoading();
        
        // Navigate using Atlas (now with semantic understanding)
        const result = await this.atlas.navigate(input, context);
        
        if (result.success) {
            this.currentOrientation = result.orientation;
            this.currentLocation = result.location;
            
            // Update graph visualization
            if (this.graphViz && this.viewMode === 'graph') {
                this.graphViz.updateCurrentLocation(result.location.topicId);
            }
            
            this.render(result);
            this.showMessage(result.message);
            
            // Speak the message if voice is available
            if (this.voiceEngine.isAvailable()) {
                this.voiceEngine.speak(result.message);
            }
        } else {
            this.showMessage(result.message, 'warning');
            // Still show current orientation
            if (result.currentOrientation) {
                this.currentOrientation = result.currentOrientation.orientation;
                this.render();
            }
        }
    }

    /**
     * Start voice listening
     */
    startVoiceListening() {
        if (!this.voiceEngine.isAvailable()) {
            this.showMessage('Voice recognition not available in your browser', 'warning');
            return;
        }

        this.isVoiceListening = true;
        this.voiceEngine.startListening((transcript) => {
            this.isVoiceListening = false;
            this.handleInput(transcript, { source: 'voice' });
        });

        this.showMessage('Listening...', 'info');
    }

    /**
     * Stop voice listening
     */
    stopVoiceListening() {
        this.voiceEngine.stopListening();
        this.isVoiceListening = false;
    }

    /**
     * Toggle view mode
     */
    toggleViewMode() {
        if (this.viewMode === 'cards') {
            this.viewMode = 'graph';
            document.getElementById('atlas-graph-container').style.display = 'block';
            this.container.style.display = 'none';
            if (this.currentLocation) {
                this.graphViz.updateCurrentLocation(this.currentLocation.topicId);
            }
        } else {
            this.viewMode = 'cards';
            document.getElementById('atlas-graph-container').style.display = 'none';
            this.container.style.display = 'block';
        }
        this.render();
    }

    /**
     * Navigate back
     */
    async goBack() {
        const result = this.atlas.goBack();
        if (result.success) {
            this.currentOrientation = result.orientation;
            this.currentLocation = result.location;
            this.render();
            this.showMessage(result.message);
        } else {
            this.showMessage(result.message, 'warning');
        }
    }

    /**
     * Render the spatial navigation interface
     */
    render(result = null) {
        if (!this.currentOrientation) return;
        
        // Hide loading first
        this.hideLoading();
        
        const topic = this.currentOrientation.currentTopic;
        const landmarks = this.currentOrientation.landmarks;
        const nearbyTopics = this.currentOrientation.nearbyTopics;
        const availableRoutes = this.currentOrientation.availableRoutes;
        const suggestions = result?.suggestions || [];
        
        // Get navigation history
        const history = this.atlas.orientation.getHistory();
        const canGoBack = history.length > 1;
        
        this.container.innerHTML = `
            <!-- View Mode Toggle & Controls -->
            <div class="atlas-controls" style="display: flex; gap: 1rem; margin-bottom: 2rem; align-items: center; flex-wrap: wrap;">
                <button class="atlas-btn atlas-btn-secondary" onclick="atlasUI.toggleViewMode()">
                    ${this.viewMode === 'cards' ? '🗺️ Show Map' : '📋 Show Cards'}
                </button>
                ${this.voiceEngine.isAvailable() ? `
                    <button class="atlas-btn atlas-btn-secondary" onclick="atlasUI.startVoiceListening()" 
                            style="${this.isVoiceListening ? 'background: #ef4444;' : ''}">
                        ${this.isVoiceListening ? '🔴 Stop Listening' : '🎤 Voice Input'}
                    </button>
                ` : ''}
                ${canGoBack ? `
                    <button class="atlas-btn atlas-btn-secondary" onclick="atlasUI.goBack()">
                        ← Go Back
                    </button>
                ` : ''}
            </div>

            <!-- Proactive Suggestions -->
            ${suggestions.length > 0 ? `
                <div class="atlas-section">
                    <h3 class="atlas-section-title">💡 You might want to...</h3>
                    <div class="atlas-suggestions">
                        ${suggestions.map(suggestion => `
                            <div class="atlas-suggestion" onclick="atlasUI.navigateToTopic('${suggestion.topic.id}')">
                                <h4>${suggestion.topic.name}</h4>
                                <p>${suggestion.reason}</p>
                                <span class="atlas-confidence">${Math.round(suggestion.confidence * 100)}% match</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <!-- Current Location Indicator -->
            <div class="atlas-location">
                <div class="atlas-location-header">
                    <span class="atlas-location-label">You are here</span>
                    <span class="atlas-confidence ${this.currentOrientation.isWellMapped ? 'high' : 'low'}">
                        ${this.currentOrientation.isWellMapped ? '✓ Well-mapped' : '⚠ Low confidence'}
                    </span>
                </div>
                <h2 class="atlas-topic-name">${topic.name}</h2>
                <p class="atlas-topic-description">${topic.description || 'Explore this area'}</p>
            </div>

            <!-- Landmarks in this area -->
            ${landmarks.length > 0 ? `
                <div class="atlas-section">
                    <h3 class="atlas-section-title">Landmarks here</h3>
                    <div class="atlas-landmarks">
                        ${landmarks.map(landmark => this.renderLandmark(landmark)).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Nearby Topics -->
            ${nearbyTopics.length > 0 ? `
                <div class="atlas-section">
                    <h3 class="atlas-section-title">Nearby areas</h3>
                    <div class="atlas-topics">
                        ${nearbyTopics.map(({ topic, distance }) => this.renderTopic(topic, distance)).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Available Routes -->
            ${availableRoutes.length > 0 ? `
                <div class="atlas-section">
                    <h3 class="atlas-section-title">Available routes</h3>
                    <div class="atlas-routes">
                        ${availableRoutes.map(route => this.renderRoute(route)).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    /**
     * Render a landmark card
     */
    renderLandmark(landmark) {
        const reliabilityPercent = Math.round(landmark.reliabilityScore * 100);
        
        return `
            <div class="atlas-landmark" data-landmark-id="${landmark.id}">
                <div class="atlas-landmark-header">
                    <h4 class="atlas-landmark-title">${landmark.title}</h4>
                    <span class="atlas-reliability">${reliabilityPercent}% reliable</span>
                </div>
                <p class="atlas-landmark-summary">${landmark.summary}</p>
                ${landmark.structuredFacts.length > 0 ? `
                    <ul class="atlas-landmark-facts">
                        ${landmark.structuredFacts.slice(0, 3).map(fact => `<li>${fact}</li>`).join('')}
                    </ul>
                ` : ''}
                <div class="atlas-landmark-actions">
                    <a href="${landmark.url}" class="atlas-btn atlas-btn-primary">Visit</a>
                    <button class="atlas-btn atlas-btn-secondary" onclick="atlasUI.preferSource('${landmark.id}')">Prefer</button>
                </div>
            </div>
        `;
    }

    /**
     * Render a nearby topic
     */
    renderTopic(topic, distance) {
        const distanceLabel = distance < 1.1 ? 'Very close' : distance < 1.3 ? 'Close' : 'Nearby';
        
        return `
            <div class="atlas-topic" data-topic-id="${topic.id}" onclick="atlasUI.navigateToTopic('${topic.id}')">
                <h4 class="atlas-topic-name">${topic.name}</h4>
                <p class="atlas-topic-description">${topic.description || ''}</p>
                <span class="atlas-distance">${distanceLabel}</span>
            </div>
        `;
    }

    /**
     * Render an available route
     */
    renderRoute(route) {
        const toTopic = this.atlas.graph.topics.get(route.to);
        if (!toTopic) return '';
        
        return `
            <div class="atlas-route" data-route-id="${route.id}" onclick="atlasUI.navigateRoute('${route.id}')">
                <div class="atlas-route-info">
                    <h4 class="atlas-route-destination">${toTopic.name}</h4>
                    <p class="atlas-route-description">${route.description || 'Navigate to this area'}</p>
                </div>
                <div class="atlas-route-meta">
                    <span class="atlas-route-type">${this.formatRouteType(route.type)}</span>
                    <span class="atlas-route-distance">${route.distance.toFixed(1)} units</span>
                </div>
            </div>
        `;
    }

    /**
     * Format route type for display
     */
    formatRouteType(type) {
        const types = {
            'often-used-with': 'Often used with',
            'prerequisite': 'Prerequisite',
            'deeper-explanation': 'Go deeper',
            'alternative-approach': 'Alternative',
            'related': 'Related'
        };
        return types[type] || type;
    }

    /**
     * Navigate to a topic
     */
    async navigateToTopic(topicId) {
        const topic = this.atlas.graph.topics.get(topicId);
        if (!topic) return;
        
        await this.handleInput(topic.name);
    }

    /**
     * Navigate via a route
     */
    async navigateRoute(routeId) {
        const route = this.atlas.graph.routes.get(routeId);
        if (!route) return;
        
        const toTopic = this.atlas.graph.topics.get(route.to);
        if (!toTopic) return;
        
        await this.handleInput(`go to ${toTopic.name}`);
    }

    /**
     * Prefer a source
     */
    preferSource(landmarkId) {
        this.atlas.preferSource(landmarkId);
        this.showMessage('Source marked as preferred', 'success');
        // Re-render to show updated preferences
        this.render();
    }

    /**
     * Show a message
     */
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `atlas-message atlas-message-${type}`;
        messageEl.textContent = message;
        
        this.container.insertBefore(messageEl, this.container.firstChild);
        
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'atlas-loading';
        loadingEl.id = 'atlas-loading';
        loadingEl.innerHTML = '<div class="atlas-spinner"></div><p>Orienting...</p>';
        this.container.insertBefore(loadingEl, this.container.firstChild);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingEl = document.getElementById('atlas-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
}

