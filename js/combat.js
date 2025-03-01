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
            if (!ship.isLoaded || 
                (this.owner === 'player' && ship.isPlayer) || 
                (this.owner === 'enemy' && !ship.isPlayer)) {
                continue;
            }
            
            // Skip if ship has shield (is invulnerable)
            if (ship.isInvulnerable) {
                // If projectile is close to the shield, create a shield impact effect and destroy the projectile
                if (ship.boundingBox && 
                    this.position.distanceTo(ship.position) < 20) {
                    // Create shield impact effect
                    createShieldImpactEffect(ship, this.position);
                    
                    // Destroy projectile
                    this.destroy();
                    break;
                }
                continue;
            }
            
            // Check if projectile is within ship's bounding box
            if (ship.boundingBox && ship.boundingBox.containsPoint(this.position)) {
                // Hit detected
                ship.takeDamage(this.damage);
                
                // Update score if player hit an enemy
                if (this.owner === 'player' && !ship.isPlayer) {
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
                return;
            }
        }
        
        // Check collision with sea objects (bombs and skittles)
        if (this.owner === 'player') { // Only player projectiles can destroy sea objects
            for (let i = 0; i < window.gameState.seaObjects.length; i++) {
                const seaObject = window.gameState.seaObjects[i];
                
                // Skip if sea object is not active or if it's a powerup (can't destroy powerups)
                if (!seaObject.isActive || seaObject.type === 'powerup') {
                    continue;
                }
                
                // Check if projectile is within sea object's bounding box
                if (seaObject.boundingBox && seaObject.boundingBox.containsPoint(this.position)) {
                    // Hit detected - destroy the sea object
                    
                    // Add points based on object type
                    if (seaObject.type === 'bomb') {
                        // More points for destroying bombs as they're dangerous
                        window.gameState.score += 25;
                        
                        // Create explosion effect
                        createExplosionEffect(seaObject.position.clone());
                        
                        // Play explosion sound if available
                        if (window.playSound && typeof window.playSound === 'function') {
                            window.playSound('explosion');
                        }
                    } else if (seaObject.type === 'skittle') {
                        // Fewer points for skittles
                        window.gameState.score += 5;
                        
                        // Create smaller effect for skittles
                        createSkittleDestroyEffect(seaObject.position.clone());
                    }
                    
                    // Update UI
                    window.updateUI();
                    
                    // Destroy the sea object
                    seaObject.destroy();
                    
                    // Destroy projectile
                    this.destroy();
                    return;
                }
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
    const cannonLength = 5; // Length of the cannon from its base
    const cannonOffset = new THREE.Vector3(0, 4, 8 + cannonLength); // Position at the tip of the cannon
    
    // Apply ship's rotation to the offset
    const rotatedOffset = cannonOffset.clone();
    rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.rotation);
    
    // Calculate position (ship position + rotated offset)
    const position = ship.position.clone().add(rotatedOffset);
    
    // Calculate direction (forward direction of the ship)
    const direction = new THREE.Vector3(0, 0, 1); // Forward direction
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.rotation);
    
    // Create projectile
    return new Projectile(
        position,
        direction,
        ship.isPlayer ? 8 : 5, // Player projectiles are faster
        ship.isPlayer ? 'player' : 'enemy'
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
        if (ship.isPlayer || !ship.isLoaded) continue;
        
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
            const shipForward = new THREE.Vector3(0, 0, 1);
            shipForward.applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.rotation);
            const angleToPlayer = shipForward.angleTo(directionToPlayer);
            
            // Determine turn direction (left or right)
            const cross = new THREE.Vector3().crossVectors(shipForward, directionToPlayer);
            const turnDirection = cross.y > 0 ? 1 : -1;
            
            // Turn towards player using the new turning system
            if (turnDirection > 0) {
                ship.turnLeft(0.8); // Turn left at 80% speed for smoother enemy movement
            } else {
                ship.turnRight(0.8); // Turn right at 80% speed
            }
            
            // Move forward with speed based on distance
            // Slow down when getting closer to player for better combat
            const speedFactor = Math.min(1.0, distanceToPlayer / 100);
            ship.moveForward(speedFactor);
            
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
                // Random turning
                const randomTurn = Math.random();
                if (randomTurn < 0.33) {
                    ship.turnLeft(0.5);
                } else if (randomTurn < 0.66) {
                    ship.turnRight(0.5);
                } else {
                    ship.stopTurning();
                }
            }
            
            // Move forward at full speed when far from player
            ship.moveForward();
        }
    }
}

// Create a shield impact effect
function createShieldImpactEffect(ship, impactPosition) {
    // Calculate impact position relative to ship
    const relativePosition = impactPosition.clone().sub(ship.position);
    relativePosition.normalize().multiplyScalar(17); // Position at shield radius
    
    // Create impact particles
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color(0x00ffff);
    
    for (let i = 0; i < particleCount; i++) {
        // Random position around impact point
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        
        const particlePos = relativePosition.clone().add(offset);
        
        positions[i * 3] = particlePos.x;
        positions[i * 3 + 1] = particlePos.y;
        positions[i * 3 + 2] = particlePos.z;
        
        // Cyan color with slight variation
        colors[i * 3] = 0; // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
        
        // Random size
        sizes[i] = Math.random() * 2 + 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 1.0
    });
    
    const particles = new THREE.Points(geometry, material);
    ship.model.add(particles);
    
    // Add a point light for the impact
    const light = new THREE.PointLight(0x00ffff, 2, 20);
    light.position.copy(relativePosition);
    ship.model.add(light);
    
    // Animate the impact
    const startTime = performance.now();
    const duration = 500; // 0.5 seconds
    
    function animateImpact() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            // Remove particles and light
            ship.model.remove(particles);
            ship.model.remove(light);
            return;
        }
        
        // Expand particles
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] *= 1.05;
            positions[i * 3 + 1] *= 1.05;
            positions[i * 3 + 2] *= 1.05;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        material.opacity = 1 - progress;
        light.intensity = 2 * (1 - progress);
        
        requestAnimationFrame(animateImpact);
    }
    
    animateImpact();
}

// Function to create explosion effect when a bomb is destroyed
function createExplosionEffect(position) {
    // Create particle explosion
    const particleCount = 30;
    const particles = new THREE.Group();
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 2 + 1;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xff5500 : 0xffaa00,
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Random position within explosion radius
        const radius = Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position.set(
            position.x + radius * Math.sin(phi) * Math.cos(theta),
            position.y + radius * Math.sin(phi) * Math.sin(theta),
            position.z + radius * Math.cos(phi)
        );
        
        // Random velocity
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        
        // Add to group
        particles.add(particle);
    }
    
    // Add explosion light
    const explosionLight = new THREE.PointLight(0xff5500, 3, 50);
    explosionLight.position.copy(position);
    window.scene.add(explosionLight);
    
    // Add particles to scene
    window.scene.add(particles);
    
    // Animate explosion
    let age = 0;
    const duration = 1; // seconds
    
    function updateExplosion() {
        age += 1/60; // Assuming 60fps
        
        if (age >= duration) {
            // Remove particles and light
            window.scene.remove(particles);
            window.scene.remove(explosionLight);
            return;
        }
        
        // Update particles
        const progress = age / duration;
        explosionLight.intensity = 3 * (1 - progress);
        
        for (let i = 0; i < particles.children.length; i++) {
            const particle = particles.children[i];
            
            // Move particle
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(1/60));
            
            // Slow down
            particle.userData.velocity.multiplyScalar(0.95);
            
            // Fade out
            particle.material.opacity = 1 - progress;
            
            // Grow slightly
            particle.scale.multiplyScalar(1.01);
        }
        
        requestAnimationFrame(updateExplosion);
    }
    
    updateExplosion();
}

// Function to create effect when a skittle is destroyed
function createSkittleDestroyEffect(position) {
    // Create colorful particle burst
    const particleCount = 15;
    const particles = new THREE.Group();
    
    // Create particles with skittle colors
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    
    for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 1 + 0.5;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Random position within burst radius
        const radius = Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position.set(
            position.x + radius * Math.sin(phi) * Math.cos(theta),
            position.y + radius * Math.sin(phi) * Math.sin(theta),
            position.z + radius * Math.cos(phi)
        );
        
        // Random velocity
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5 + 3, // Slight upward bias
            (Math.random() - 0.5) * 5
        );
        
        // Add to group
        particles.add(particle);
    }
    
    // Add to scene
    window.scene.add(particles);
    
    // Animate burst
    let age = 0;
    const duration = 0.8; // seconds
    
    function updateBurst() {
        age += 1/60; // Assuming 60fps
        
        if (age >= duration) {
            // Remove particles
            window.scene.remove(particles);
            return;
        }
        
        // Update particles
        const progress = age / duration;
        
        for (let i = 0; i < particles.children.length; i++) {
            const particle = particles.children[i];
            
            // Move particle
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(1/60));
            
            // Add gravity
            particle.userData.velocity.y -= 9.8 * (1/60);
            
            // Fade out
            particle.material.opacity = 1 - progress;
        }
        
        requestAnimationFrame(updateBurst);
    }
    
    updateBurst();
}

// Set global fire cooldown
window.fireCooldown = 0.5; // seconds
window.lastFireTime = 0;

// Make functions available globally
window.Projectile = Projectile;
window.fireProjectile = fireProjectile;
window.updateProjectiles = updateProjectiles;
window.updateEnemyAI = updateEnemyAI;
window.createShieldImpactEffect = createShieldImpactEffect;
window.createExplosionEffect = createExplosionEffect;
window.createSkittleDestroyEffect = createSkittleDestroyEffect; 