// Projectile class
class Projectile {
    constructor(position, direction, speed, owner) {
        this.position = position.clone();
        this.direction = direction.normalize();
        this.speed = speed || 5;
        this.owner = owner; // 'player' or 'enemy'
        this.damage = owner === 'player' ? 20 : 10;
        this.lifespan = 3; // seconds
        this.age = 0;
        this.isActive = true;
        
        // Create projectile mesh
        this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: this.owner === 'player' ? 0x00ffff : 0xff0000,
            emissive: this.owner === 'player' ? 0x00ffff : 0xff0000,
            emissiveIntensity: 1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Add a point light to make it glow
        this.light = new THREE.PointLight(
            this.owner === 'player' ? 0x00ffff : 0xff0000,
            1,
            10
        );
        this.light.position.copy(this.position);
        
        // Add to scene
        window.scene.add(this.mesh);
        window.scene.add(this.light);
        
        // Add to game state
        window.gameState.projectiles.push(this);
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        // Update age
        this.age += delta;
        
        // Check if projectile has expired
        if (this.age >= this.lifespan) {
            this.destroy();
            return;
        }
        
        // Move projectile
        const movement = this.direction.clone().multiplyScalar(this.speed * delta * 60);
        this.position.add(movement);
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        this.light.position.copy(this.position);
        
        // Check for collisions
        this.checkCollisions();
    }
    
    checkCollisions() {
        // Check collision with ships
        for (let i = 0; i < window.gameState.ships.length; i++) {
            const ship = window.gameState.ships[i];
            
            // Skip if ship is not loaded or if projectile belongs to the ship
            if (!ship.isLoaded || (this.owner === 'player' && ship.type === 'player') || 
                (this.owner === 'enemy' && ship.type === 'enemy')) {
                continue;
            }
            
            // Check if projectile is within ship's bounding box
            if (ship.boundingBox && ship.boundingBox.containsPoint(this.position)) {
                // Hit detected
                ship.takeDamage(this.damage);
                
                // Update score if player hit an enemy
                if (this.owner === 'player' && ship.type === 'enemy') {
                    window.gameState.score += 10;
                    window.updateUI();
                    
                    // If enemy is destroyed, add more points
                    if (ship.health <= 0) {
                        window.gameState.score += 50;
                        window.updateUI();
                    }
                }
                
                // Destroy projectile
                this.destroy();
                break;
            }
        }
    }
    
    destroy() {
        if (!this.isActive) return;
        
        // Remove from scene
        window.scene.remove(this.mesh);
        window.scene.remove(this.light);
        
        // Mark as inactive
        this.isActive = false;
        
        // Remove from game state
        const index = window.gameState.projectiles.indexOf(this);
        if (index !== -1) {
            window.gameState.projectiles.splice(index, 1);
        }
    }
}

// Function to fire projectile from a ship
function fireProjectile(ship) {
    if (!ship || !ship.isLoaded) return;
    
    // Calculate projectile starting position at the tip of the cannon
    // For the fallback model, the cannon is positioned at (0, 4, 8) with length 10
    // and rotated 90 degrees on X axis, so the tip is at z = 13
    const offset = new THREE.Vector3(0, 4, 13); // Position at the tip of the cannon
    offset.applyEuler(ship.model.rotation);
    
    const position = ship.model.position.clone().add(offset);
    
    // Calculate direction (forward direction of the ship)
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(ship.model.rotation);
    
    // Create projectile
    return new Projectile(
        position,
        direction,
        ship.type === 'player' ? 8 : 5, // Player projectiles are faster
        ship.type
    );
}

// Function to update all projectiles
function updateProjectiles(delta) {
    // Create a copy of the array to safely iterate while potentially removing items
    const projectiles = [...window.gameState.projectiles];
    
    for (let i = 0; i < projectiles.length; i++) {
        if (projectiles[i].isActive) {
            projectiles[i].update(delta);
        }
    }
}

// Function to handle enemy AI and firing
function updateEnemyAI(delta) {
    // Process each enemy ship
    for (let i = 0; i < window.gameState.ships.length; i++) {
        const ship = window.gameState.ships[i];
        
        // Skip if not an enemy or not loaded
        if (ship.type !== 'enemy' || !ship.isLoaded) continue;
        
        // Skip if player ship doesn't exist or isn't loaded
        if (!window.gameState.playerShip || !window.gameState.playerShip.isLoaded) continue;
        
        // Calculate distance to player
        const distanceToPlayer = ship.position.distanceTo(window.gameState.playerShip.position);
        
        // If within range, turn towards player and fire
        if (distanceToPlayer < 200) {
            // Calculate direction to player
            const directionToPlayer = new THREE.Vector3()
                .subVectors(window.gameState.playerShip.position, ship.position)
                .normalize();
            
            // Calculate angle to player
            const shipForward = new THREE.Vector3(0, 0, -1).applyEuler(ship.model.rotation);
            const angleToPlayer = shipForward.angleTo(directionToPlayer);
            
            // Determine turn direction (left or right)
            const cross = new THREE.Vector3().crossVectors(shipForward, directionToPlayer);
            const turnDirection = cross.y > 0 ? 1 : -1;
            
            // Turn towards player
            ship.model.rotation.y += turnDirection * ship.turnSpeed;
            ship.rotation.copy(ship.model.rotation);
            
            // Move forward
            ship.moveForward();
            
            // Fire at player if facing them
            if (angleToPlayer < 0.3) { // About 17 degrees
                // Random chance to fire based on distance
                const fireChance = 0.01 * (1 - distanceToPlayer / 200);
                
                if (Math.random() < fireChance) {
                    fireProjectile(ship);
                }
            }
        } else {
            // Move randomly if not in range
            if (Math.random() < 0.01) {
                ship.model.rotation.y += (Math.random() - 0.5) * 0.2;
                ship.rotation.copy(ship.model.rotation);
            }
            
            // Move forward
            ship.moveForward();
        }
    }
}

// Make functions available globally
window.Projectile = Projectile;
window.fireProjectile = fireProjectile;
window.updateProjectiles = updateProjectiles;
window.updateEnemyAI = updateEnemyAI; 