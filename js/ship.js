// Ship class
class Ship {
    constructor(isPlayer = false) {
        this.isPlayer = isPlayer;
        this.maxSpeed = isPlayer ? 1.5 : 0.8;
        this.turnSpeed = isPlayer ? 0.03 : 0.015;
        this.rotation = 0;
        this.speed = 0;
        this.direction = 0;
        this.health = 100;
        this.position = new THREE.Vector3(0, 0, 0);
        this.mesh = null;
        this.model = null;
        this.boundingBox = null;
        this.isLoaded = false;
    }
    
    init() {
        // Create the ship model directly with vertices
        this.createShipModel();
        return this;
    }
    
    createShipModel() {
        // Create a ship model using basic geometries
        const shipGroup = new THREE.Group();
        
        // Hull
        const hullGeometry = new THREE.BoxGeometry(10, 3, 25);
        const hullMaterial = new THREE.MeshPhongMaterial({ 
            color: this.isPlayer ? 0x3366ff : 0xff3333,
            shininess: 30
        });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 1.5;
        shipGroup.add(hull);
        
        // Bridge
        const bridgeGeometry = new THREE.BoxGeometry(6, 4, 8);
        const bridgeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 20
        });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(0, 5, -2);
        shipGroup.add(bridge);
        
        // Cannon
        const cannonGeometry = new THREE.CylinderGeometry(0.8, 1, 10);
        const cannonMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 50
        });
        const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon.rotation.x = Math.PI / 2;
        cannon.position.set(0, 4, 8);
        shipGroup.add(cannon);
        
        // Add details based on ship type
        if (this.isPlayer) {
            // Add radar/antenna
            const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6);
            const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(0, 9, -4);
            shipGroup.add(antenna);
            
            // Add radar dish
            const radarGeometry = new THREE.SphereGeometry(1, 8, 8, 0, Math.PI);
            const radarMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
            const radar = new THREE.Mesh(radarGeometry, radarMaterial);
            radar.rotation.x = Math.PI / 2;
            radar.position.set(0, 12, -4);
            shipGroup.add(radar);
            
            // Add deck details
            const deckDetailGeometry = new THREE.BoxGeometry(8, 0.5, 15);
            const deckDetailMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
            const deckDetail = new THREE.Mesh(deckDetailGeometry, deckDetailMaterial);
            deckDetail.position.set(0, 3.2, 0);
            shipGroup.add(deckDetail);
        } else {
            // Enemy ship details
            // Add a different style bridge for enemy ships
            const enemyTowerGeometry = new THREE.CylinderGeometry(2, 3, 6);
            const enemyTowerMaterial = new THREE.MeshPhongMaterial({ color: 0x880000 });
            const enemyTower = new THREE.Mesh(enemyTowerGeometry, enemyTowerMaterial);
            enemyTower.position.set(0, 6, -5);
            shipGroup.add(enemyTower);
            
            // Add enemy cannons (two smaller ones)
            const enemyCannonGeometry = new THREE.CylinderGeometry(0.6, 0.8, 8);
            const enemyCannonMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
            
            const leftCannon = new THREE.Mesh(enemyCannonGeometry, enemyCannonMaterial);
            leftCannon.rotation.x = Math.PI / 2;
            leftCannon.position.set(-3, 3, 6);
            shipGroup.add(leftCannon);
            
            const rightCannon = new THREE.Mesh(enemyCannonGeometry, enemyCannonMaterial);
            rightCannon.rotation.x = Math.PI / 2;
            rightCannon.position.set(3, 3, 6);
            shipGroup.add(rightCannon);
        }
        
        this.model = shipGroup;
        this.model.position.copy(this.position);
        
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
        
        // Debug output
        if (window.debugControls) {
            console.log("Ship update - speed:", this.speed, "delta:", delta);
        }
        
        // Ensure delta is not too small (minimum effective delta of 0.016s = 60fps)
        const effectiveDelta = Math.max(delta, 0.016);
        
        // Move ship based on current speed and direction
        if (this.speed !== 0) {
            // Scale movement by 30 for smoother control
            const moveAmount = this.speed * effectiveDelta * 30;
            
            if (window.debugControls) {
                console.log("Moving ship by:", moveAmount, "Direction:", this.direction);
            }
            
            // Update position based on direction and speed
            this.position.x += Math.sin(this.rotation) * moveAmount;
            this.position.z += Math.cos(this.rotation) * moveAmount;
            
            // Update the mesh position
            if (this.model) {
                this.model.position.copy(this.position);
            }
        }
        
        // Update rotation
        if (this.model) {
            this.model.rotation.y = this.rotation;
        }
        
        // Update the bounding box
        if (this.boundingBox && this.model) {
            this.boundingBox.setFromObject(this.model);
        }
    }
    
    moveForward(speedMultiplier = 1.0) {
        if (window.debugControls) {
            console.log("Ship.moveForward() called, setting speed to", this.maxSpeed * speedMultiplier);
        }
        this.speed = this.maxSpeed * speedMultiplier;
        this.direction = 1;
    }
    
    moveBackward(speedMultiplier = 1.0) {
        if (window.debugControls) {
            console.log("Ship.moveBackward() called, setting speed to", -this.maxSpeed * speedMultiplier);
        }
        this.speed = -this.maxSpeed * speedMultiplier;
        this.direction = -1;
    }
    
    stopMoving() {
        if (window.debugControls) {
            console.log("Ship.stopMoving() called, setting speed to 0");
        }
        this.speed = 0;
    }
    
    turnLeft(speedMultiplier = 1.0) {
        if (!this.isLoaded) return;
        this.rotation += this.turnSpeed * speedMultiplier;
    }
    
    turnRight(speedMultiplier = 1.0) {
        if (!this.isLoaded) return;
        this.rotation -= this.turnSpeed * speedMultiplier;
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
    return new Ship(true);
}

// Function to create enemy ship
function createEnemyShip(position) {
    const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
    return new Ship(false);
}

// Make functions available globally
window.Ship = Ship;
window.createPlayerShip = createPlayerShip;
window.createEnemyShip = createEnemyShip; 