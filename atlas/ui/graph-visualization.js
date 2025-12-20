/**
 * Visual Graph Map Visualization
 * 
 * Interactive D3.js force-directed graph showing the cognitive map.
 */

export class GraphVisualization {
    constructor(containerId, atlas) {
        this.container = document.getElementById(containerId);
        this.atlas = atlas;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.currentLocationId = null;
    }

    /**
     * Initialize the graph visualization
     */
    async init() {
        // Load D3.js if not already loaded
        if (typeof d3 === 'undefined') {
            await this.loadD3();
        }

        this.render();
    }

    /**
     * Load D3.js library
     */
    async loadD3() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://d3js.org/d3.v7.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Render the graph
     */
    render() {
        if (typeof d3 === 'undefined') {
            console.error('D3.js not loaded');
            return;
        }

        // Clear existing
        d3.select(this.container).selectAll('*').remove();

        // Get graph data
        const { nodes, links } = this.buildGraphData();

        // Set up SVG
        const width = this.container.clientWidth || 800;
        const height = Math.max(600, window.innerHeight - 200);

        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'rgba(5, 5, 7, 0.5)');

        // Add zoom
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            });

        this.svg.call(zoom);

        const g = this.svg.append('g');

        // Create force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.distance * 100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));

        // Draw links
        const link = g.append('g')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', d => this.getRouteColor(d.type))
            .attr('stroke-opacity', d => 0.3 + d.confidence * 0.4)
            .attr('stroke-width', d => 2 + d.usageCount * 0.5);

        // Draw nodes
        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .enter()
            .append('g')
            .call(this.drag());

        // Add circles for nodes
        node.append('circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => d.id === this.currentLocationId ? '#C1A2FF' : '#666')
            .attr('stroke-width', d => d.id === this.currentLocationId ? 3 : 1)
            .on('click', (event, d) => this.onNodeClick(d));

        // Add labels
        node.append('text')
            .text(d => d.name)
            .attr('dx', d => this.getNodeRadius(d) + 5)
            .attr('dy', 4)
            .attr('fill', '#fff')
            .attr('font-size', '12px')
            .attr('font-family', 'Satoshi, sans-serif');

        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    /**
     * Build graph data from Atlas graph
     */
    buildGraphData() {
        const nodes = [];
        const links = [];
        const graph = this.atlas.graph;

        // Add topic nodes
        for (const [topicId, topic] of graph.topics.entries()) {
            nodes.push({
                id: topicId,
                name: topic.name,
                type: 'topic',
                familiarity: topic.familiarity,
                isCurrent: topicId === this.currentLocationId
            });
        }

        // Add landmark nodes
        for (const [landmarkId, landmark] of graph.landmarks.entries()) {
            nodes.push({
                id: landmarkId,
                name: landmark.title,
                type: 'landmark',
                reliability: landmark.reliabilityScore,
                topicId: landmark.topicNeighbourhood
            });
        }

        // Add route links
        for (const [routeId, route] of graph.routes.entries()) {
            links.push({
                source: route.from,
                target: route.to,
                type: route.type,
                distance: route.distance,
                confidence: route.confidence,
                usageCount: route.usageCount || 0
            });
        }

        return { nodes, links };
    }

    /**
     * Get node radius based on type and importance
     */
    getNodeRadius(node) {
        if (node.type === 'landmark') return 8;
        const baseSize = 20;
        const familiarity = node.familiarity || 0.5;
        return baseSize + familiarity * 10;
    }

    /**
     * Get node color based on familiarity/reliability
     */
    getNodeColor(node) {
        if (node.type === 'landmark') {
            const reliability = node.reliability || 0.5;
            if (reliability > 0.8) return '#22c55e'; // Green - high reliability
            if (reliability > 0.6) return '#eab308'; // Yellow - medium
            return '#ef4444'; // Red - low
        }
        
        const familiarity = node.familiarity || 0.5;
        if (familiarity > 0.7) return '#C1A2FF'; // Purple - well-mapped
        if (familiarity > 0.5) return '#a78bfa'; // Lighter purple
        return '#6b7280'; // Gray - unmapped
    }

    /**
     * Get route color based on type
     */
    getRouteColor(type) {
        const colors = {
            'often-used-with': '#C1A2FF',
            'prerequisite': '#3b82f6',
            'deeper-explanation': '#10b981',
            'alternative-approach': '#f59e0b',
            'related': '#8b5cf6'
        };
        return colors[type] || '#666';
    }

    /**
     * Drag behavior for nodes
     */
    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    /**
     * Handle node click
     */
    onNodeClick(node) {
        if (node.type === 'topic') {
            // Navigate to topic
            if (window.atlasUI) {
                window.atlasUI.navigateToTopic(node.id);
            }
        } else {
            // Navigate to landmark's topic
            if (window.atlasUI && node.topicId) {
                window.atlasUI.navigateToTopic(node.topicId);
            }
        }
    }

    /**
     * Update current location highlight
     */
    updateCurrentLocation(locationId) {
        this.currentLocationId = locationId;
        this.render();
    }

    /**
     * Highlight route path
     */
    highlightRoute(routeIds) {
        // Re-render with highlighted routes
        this.render();
    }
}

