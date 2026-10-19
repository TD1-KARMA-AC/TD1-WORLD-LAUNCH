/**
 * 3D Spatial Visualization
 * 
 * Three.js 3D visualization of the cognitive map.
 */

export class ThreeDVisualization {
    constructor(containerId, atlas) {
        this.container = document.getElementById(containerId);
        this.atlas = atlas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.nodes = [];
        this.links = [];
    }

    /**
     * Initialize 3D visualization
     */
    async init() {
        // Load Three.js if not already loaded
        if (typeof THREE === 'undefined') {
            await this.loadThreeJS();
        }

        this.setupScene();
        this.buildGraph();
        this.animate();
    }

    /**
     * Load Three.js library
     */
    async loadThreeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Setup Three.js scene
     */
    setupScene() {
        const width = this.container.clientWidth || 800;
        const height = Math.max(600, window.innerHeight - 200);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050507);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 50);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xC1A2FF, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Controls (would need OrbitControls library)
        // For now, basic mouse controls
        this.setupControls();
    }

    /**
     * Setup basic controls
     */
    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Rotate camera
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
        });
    }

    /**
     * Build 3D graph
     */
    buildGraph() {
        const graph = this.atlas.graph;
        const nodeMap = new Map();

        // Create topic nodes
        for (const [topicId, topic] of graph.topics.entries()) {
            const geometry = new THREE.SphereGeometry(
                this.getNodeSize(topic.familiarity),
                16,
                16
            );
            const material = new THREE.MeshPhongMaterial({
                color: this.getNodeColor(topic.familiarity),
                emissive: topic.familiarity > 0.7 ? 0x4a1a7f : 0x000000
            });
            const sphere = new THREE.Mesh(geometry, material);

            // Position in 3D space (use topic relationships for positioning)
            const position = this.calculatePosition(topicId, graph);
            sphere.position.set(position.x, position.y, position.z);

            this.scene.add(sphere);
            nodeMap.set(topicId, sphere);
            this.nodes.push({ id: topicId, mesh: sphere, topic });
        }

        // Create route links
        for (const [routeId, route] of graph.routes.entries()) {
            const fromNode = nodeMap.get(route.from);
            const toNode = nodeMap.get(route.to);

            if (fromNode && toNode) {
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    fromNode.position,
                    toNode.position
                ]);
                const material = new THREE.LineBasicMaterial({
                    color: this.getRouteColor(route.type),
                    opacity: 0.3 + route.confidence * 0.4,
                    transparent: true
                });
                const line = new THREE.Line(geometry, material);
                this.scene.add(line);
                this.links.push({ route, line });
            }
        }
    }

    /**
     * Calculate 3D position for node
     */
    calculatePosition(nodeId, graph) {
        // Simple layout: use topic relationships to position
        // In production, would use force-directed layout in 3D
        const topic = graph.topics.get(nodeId);
        if (!topic) return { x: 0, y: 0, z: 0 };

        // Use nearby topics to calculate position
        let x = 0, y = 0, z = 0;
        let count = 0;

        topic.nearbyTopics.forEach(({ topicId, distance }) => {
            const nearby = graph.topics.get(topicId);
            if (nearby) {
                // Simple positioning based on relationships
                x += Math.cos(count) * distance * 10;
                y += Math.sin(count) * distance * 10;
                z += (count % 3) * 5;
                count++;
            }
        });

        if (count === 0) {
            // Random position for isolated nodes
            x = (Math.random() - 0.5) * 30;
            y = (Math.random() - 0.5) * 30;
            z = (Math.random() - 0.5) * 30;
        }

        return { x, y, z };
    }

    /**
     * Get node size based on familiarity
     */
    getNodeSize(familiarity) {
        return 2 + familiarity * 3;
    }

    /**
     * Get node color based on familiarity
     */
    getNodeColor(familiarity) {
        if (familiarity > 0.7) return 0xC1A2FF; // Purple
        if (familiarity > 0.5) return 0xa78bfa; // Lighter purple
        return 0x6b7280; // Gray
    }

    /**
     * Get route color
     */
    getRouteColor(type) {
        const colors = {
            'often-used-with': 0xC1A2FF,
            'prerequisite': 0x3b82f6,
            'deeper-explanation': 0x10b981,
            'alternative-approach': 0xf59e0b,
            'related': 0x8b5cf6
        };
        return colors[type] || 0x666666;
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate nodes slightly for visual interest
        this.nodes.forEach(({ mesh }) => {
            mesh.rotation.y += 0.005;
        });

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update current location highlight
     */
    updateCurrentLocation(locationId) {
        this.nodes.forEach(({ id, mesh }) => {
            if (id === locationId) {
                mesh.material.emissive.setHex(0xffffff);
                mesh.material.emissiveIntensity = 0.5;
            } else {
                const topic = this.atlas.graph.topics.get(id);
                mesh.material.emissive.setHex(topic?.familiarity > 0.7 ? 0x4a1a7f : 0x000000);
                mesh.material.emissiveIntensity = 0.2;
            }
        });
    }
}

