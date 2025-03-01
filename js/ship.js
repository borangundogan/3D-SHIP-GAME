// Ship class
class Ship {
    constructor(type, position, rotation) {
        this.type = type;
        this.position = position || new THREE.Vector3(0, 0, 0);
        this.rotation = rotation || new THREE.Euler(0, 0, 0);
        this.speed = 0;
        this.maxSpeed = type === 'player' ? 1.0 : 0.5;
        this.turnSpeed = type === 'player' ? 0.03 : 0.01;
        this.health = type === 'player' ? 100 : 50;
        this.model = null;
        this.boundingBox = null;
        this.isLoaded = false;
        
        // We'll load the model later when scene is available
    }
    
    init() {
        // Load the ship model
        this.loadModel();
        return this;
    }
    
    loadModel() {
        const loader = new THREE.GLTFLoader();
        const modelUrl = this.type === 'player' 
            ? 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ship/scene.gltf'
            : 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ship/scene.gltf'; // Use same model for now, we can change later
        
        loader.load(
            modelUrl,
            (gltf) => {
                this.model = gltf.scene;
                
                // Scale and position the model
                this.model.scale.set(0.5, 0.5, 0.5);
                this.model.position.copy(this.position);
                this.model.rotation.copy(this.rotation);
                
                // Create a bounding box for collision detection
                const boundingBoxHelper = new THREE.Box3().setFromObject(this.model);
                this.boundingBox = boundingBoxHelper;
                
                // Add to scene
                window.scene.add(this.model);
                this.isLoaded = true;
                
                // Add to game state
                window.gameState.ships.push(this);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error happened while loading the ship model:', error);
                
                // Fallback to a simple ship model if loading fails
                this.createFallbackModel();
            }
        );
    }
    
    createFallbackModel() {
        // Create a simple ship model using basic geometries
        const shipGroup = new THREE.Group();
        
        // Hull
        const hullGeometry = new THREE.BoxGeometry(10, 3, 25);
        const hullMaterial = new THREE.MeshPhongMaterial({ color: this.type === 'player' ? 0x3366ff : 0xff3333 });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 1.5;
        shipGroup.add(hull);
        
        // Bridge
        const bridgeGeometry = new THREE.BoxGeometry(6, 4, 8);
        const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(0, 5, -2);
        shipGroup.add(bridge);
        
        // Cannon
        const cannonGeometry = new THREE.CylinderGeometry(0.8, 1, 10);
        const cannonMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(0, 4, 8);
        shipGroup.add(cannon);
        
        this.model = shipGroup;
        this.model.position.copy(this.position);
        this.model.rotation.copy(this.rotation);
        
        // Create a bounding box for collision detection
        const boundingBoxHelper = new THREE.Box3().setFromObject(this.model);
        this.boundingBox = boundingBoxHelper;
        
        // Add to scene
        window.scene.add(this.model);
        this.isLoaded = true;
        
        // Add to game state
        window.gameState.ships.push(this);
    }
    
    update(delta) {
        if (!this.isLoaded) return;
        
        // Update position based on speed and rotation
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.model.rotation);
        direction.multiplyScalar(this.speed * delta);
        
        this.model.position.add(direction);
        
        // Update the bounding box
        this.boundingBox.setFromObject(this.model);
        
        // Update the ship's position property
        this.position.copy(this.model.position);
    }
    
    moveForward() {
        this.speed = this.maxSpeed;
    }
    
    moveBackward() {
        this.speed = -this.maxSpeed / 2; // Slower in reverse
    }
    
    stopMoving() {
        this.speed = 0;
    }
    
    turnLeft() {
        if (!this.isLoaded) return;
        this.model.rotation.y += this.turnSpeed;
        this.rotation.copy(this.model.rotation);
    }
    
    turnRight() {
        if (!this.isLoaded) return;
        this.model.rotation.y -= this.turnSpeed;
        this.rotation.copy(this.model.rotation);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        if (this.model) {
            window.scene.remove(this.model);
            
            // Remove from game state
            const index = window.gameState.ships.indexOf(this);
            if (index !== -1) {
                window.gameState.ships.splice(index, 1);
            }
        }
    }
}

// Function to create player ship
function createPlayerShip() {
    return new Ship('player', new THREE.Vector3(0, 0, 0), new THREE.Euler(0, 0, 0));
}

// Function to create enemy ship
function createEnemyShip(position) {
    const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
    return new Ship('enemy', position, randomRotation);
}

// Make functions available globally
window.Ship = Ship;
window.createPlayerShip = createPlayerShip;
window.createEnemyShip = createEnemyShip; 