// Sea Objects - Bombs, Skittles and Powerups
class SeaObject {
    constructor(position, type) {
        this.position = position.clone();
        this.type = type; // 'bomb', 'skittle', or 'powerup'
        this.isActive = true;
        this.mesh = null;
        this.boundingBox = null;
        this.rotationSpeed = Math.random() * 0.01 + 0.005;
        this.bobSpeed = Math.random() * 0.5 + 0.5;
        this.bobHeight = Math.random() * 0.5 + 0.5;
        this.initialY = position.y;
        this.age = 0;
        this.lifespan = type === 'bomb' ? 60 : type === 'powerup' ? 30 : 120; // seconds
        
        // For powerups, randomly select a type
        if (type === 'powerup') {
            const powerupTypes = ['speed', 'shield', 'rapidfire', 'health'];
            this.powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        }
        
        // Create the mesh
        this.createMesh();
    }
    
    createMesh() {
        let geometry, material;
        
        if (this.type === 'bomb') {
            // Create a bomb (sphere with spikes)
            const bombGroup = new THREE.Group();
            
            // Main sphere
            geometry = new THREE.SphereGeometry(5, 16, 16);
            material = new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                shininess: 30
            });
            const sphere = new THREE.Mesh(geometry, material);
            bombGroup.add(sphere);
            
            // Add spikes
            const spikeGeometry = new THREE.ConeGeometry(1, 3, 8);
            const spikeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
            
            const spikePositions = [
                [0, 5, 0], [0, -5, 0], [5, 0, 0], 
                [-5, 0, 0], [0, 0, 5], [0, 0, -5]
            ];
            
            spikePositions.forEach(pos => {
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                spike.position.set(pos[0], pos[1], pos[2]);
                // Orient spike outward
                spike.lookAt(pos[0] * 2, pos[1] * 2, pos[2] * 2);
                bombGroup.add(spike);
            });
            
            // Add fuse
            const fuseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4);
            const fuseMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial);
            fuse.position.set(0, 7, 0);
            bombGroup.add(fuse);
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(5.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            bombGroup.add(glow);
            
            this.mesh = bombGroup;
            
            // Add a point light to make it glow
            this.light = new THREE.PointLight(0xff0000, 1, 20);
            this.light.position.copy(this.position);
            window.scene.add(this.light);
            
        } else if (this.type === 'skittle') {
            // Create a skittle (colorful cone)
            const skittleGroup = new THREE.Group();
            
            // Random color for the skittle
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Cone body
            geometry = new THREE.ConeGeometry(3, 10, 16);
            material = new THREE.MeshPhongMaterial({ 
                color: color,
                shininess: 70
            });
            const cone = new THREE.Mesh(geometry, material);
            cone.rotation.x = Math.PI; // Flip it so the point is down
            skittleGroup.add(cone);
            
            // Add a small sphere on top
            const topGeometry = new THREE.SphereGeometry(3, 16, 16);
            const topMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                shininess: 70
            });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.y = 5;
            skittleGroup.add(top);
            
            this.mesh = skittleGroup;
            this.color = color; // Store the color for later use
        } else if (this.type === 'powerup') {
            // Create a powerup (floating star or cube)
            const powerupGroup = new THREE.Group();
            
            // Different colors for different powerup types
            let color;
            switch (this.powerupType) {
                case 'speed':
                    color = 0xffff00; // Yellow for speed boost
                    break;
                case 'shield':
                    color = 0x00ffff; // Cyan for shield
                    break;
                case 'rapidfire':
                    color = 0xff0000; // Red for rapid fire
                    break;
                case 'health':
                    color = 0x00ff00; // Green for health
                    break;
                default:
                    color = 0xffffff; // White as fallback
            }
            
            // Create a star shape for the powerup
            if (this.powerupType === 'speed' || this.powerupType === 'rapidfire') {
                // Star shape for speed and rapid fire
                const starPoints = [];
                const outerRadius = 5;
                const innerRadius = 2.5;
                const numPoints = 5;
                
                for (let i = 0; i < numPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i / numPoints) * Math.PI;
                    starPoints.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
                }
                
                const starShape = new THREE.Shape(starPoints);
                const extrudeSettings = {
                    depth: 1,
                    bevelEnabled: false
                };
                
                geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    shininess: 100,
                    emissive: color,
                    emissiveIntensity: 0.5
                });
                
                const star = new THREE.Mesh(geometry, material);
                star.rotation.x = Math.PI / 2; // Lay flat
                powerupGroup.add(star);
            } else {
                // Cube for shield and health
                geometry = new THREE.BoxGeometry(4, 4, 4);
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    shininess: 100,
                    emissive: color,
                    emissiveIntensity: 0.5
                });
                
                const cube = new THREE.Mesh(geometry, material);
                powerupGroup.add(cube);
            }
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(6, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            powerupGroup.add(glow);
            
            this.mesh = powerupGroup;
            
            // Add a point light to make it glow
            this.light = new THREE.PointLight(color, 1, 15);
            this.light.position.copy(this.position);
            window.scene.add(this.light);
        }
        
        // Position the mesh
        this.mesh.position.copy(this.position);
        
        // Create a bounding box for collision detection
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Add to scene
        window.scene.add(this.mesh);
        
        // Add to game state
        window.gameState.seaObjects.push(this);
    }
    
    update(delta) {
        if (!this.isActive) return;
        
        // Update age
        this.age += delta;
        
        // Check if object has expired
        if (this.age >= this.lifespan) {
            this.destroy();
            return;
        }
        
        // Rotate the object
        this.mesh.rotation.y += this.rotationSpeed;
        
        // Bob up and down in the water
        const bobOffset = Math.sin(this.age * this.bobSpeed) * this.bobHeight;
        this.mesh.position.y = this.initialY + bobOffset;
        
        // Update the bounding box
        this.boundingBox.setFromObject(this.mesh);
        
        // Update light position for bombs and powerups
        if ((this.type === 'bomb' || this.type === 'powerup') && this.light) {
            this.light.position.copy(this.mesh.position);
        }
        
        // Make bombs pulse if they're about to explode
        if (this.type === 'bomb' && this.age > this.lifespan - 10) {
            const pulseIntensity = 0.5 + Math.sin(this.age * 5) * 0.5;
            this.light.intensity = pulseIntensity;
            
            // Find the glow mesh and update its opacity
            this.mesh.children.forEach(child => {
                if (child.material && child.material.transparent) {
                    child.material.opacity = 0.2 + pulseIntensity * 0.3;
                }
            });
        }
        
        // Make powerups spin faster and pulse
        if (this.type === 'powerup') {
            this.mesh.rotation.y += this.rotationSpeed * 2;
            
            // Pulse the glow
            const pulseIntensity = 0.5 + Math.sin(this.age * 3) * 0.5;
            this.light.intensity = pulseIntensity;
            
            // Find the glow mesh and update its opacity
            this.mesh.children.forEach(child => {
                if (child.material && child.material.transparent) {
                    child.material.opacity = 0.2 + pulseIntensity * 0.3;
                }
            });
        }
    }
    
    handleCollision(ship) {
        if (!this.isActive) return;
        
        if (this.type === 'bomb') {
            // Bombs explode and damage the ship
            this.explode();
            ship.takeDamage(30);
            
            // Add explosion effect
            createExplosion(this.position);
        } else if (this.type === 'skittle') {
            // Skittles slow down the ship
            if (ship.isPlayer) {
                // Store the original max speed if not already stored
                if (!ship.originalMaxSpeed) {
                    ship.originalMaxSpeed = ship.maxSpeed;
                }
                
                // Reduce player ship speed by 50% for 3 seconds
                ship.maxSpeed = ship.originalMaxSpeed * 0.5;
                
                // Clear any existing timeout to prevent conflicts
                if (ship.speedRestoreTimeout) {
                    clearTimeout(ship.speedRestoreTimeout);
                }
                
                // Remove any existing slow effect
                if (ship.slowEffect && ship.slowEffect.parent) {
                    ship.slowEffect.parent.remove(ship.slowEffect);
                }
                
                // Create visual effect to show the ship is slowed
                ship.slowEffect = createSlowEffect(ship);
                
                // Reset speed after 3 seconds
                ship.speedRestoreTimeout = setTimeout(() => {
                    // Restore the original max speed
                    ship.maxSpeed = ship.originalMaxSpeed;
                    
                    // Remove slow effect
                    if (ship.slowEffect && ship.slowEffect.parent) {
                        ship.slowEffect.parent.remove(ship.slowEffect);
                        ship.slowEffect = null;
                    }
                    
                    console.log("Ship speed restored to:", ship.maxSpeed);
                }, 3000);
                
                // Add points for hitting a skittle
                window.gameState.score += 5;
                window.gameState.balloonsHit++;
                window.updateUI();
            }
            
            // Skittles don't get destroyed on collision, they just get knocked away
            // Apply a force away from the ship
            const direction = new THREE.Vector3()
                .subVectors(this.position, ship.position)
                .normalize();
            
            // Move the skittle away
            this.position.add(direction.multiplyScalar(10));
            this.mesh.position.copy(this.position);
            
            // Update the bounding box
            this.boundingBox.setFromObject(this.mesh);
        } else if (this.type === 'powerup' && ship.isPlayer) {
            // Apply powerup effect
            switch (this.powerupType) {
                case 'speed':
                    // Speed boost for 10 seconds
                    if (!ship.originalMaxSpeed) {
                        ship.originalMaxSpeed = ship.maxSpeed;
                    }
                    
                    // Clear any existing speed boost timeout
                    if (ship.speedBoostTimeout) {
                        clearTimeout(ship.speedBoostTimeout);
                    }
                    
                    // Double the ship's speed
                    ship.maxSpeed = ship.originalMaxSpeed * 2;
                    
                    // Create visual effect
                    ship.speedBoostEffect = createSpeedBoostEffect(ship);
                    
                    // Reset after 10 seconds
                    ship.speedBoostTimeout = setTimeout(() => {
                        ship.maxSpeed = ship.originalMaxSpeed;
                        
                        // Remove effect
                        if (ship.speedBoostEffect && ship.speedBoostEffect.parent) {
                            ship.speedBoostEffect.parent.remove(ship.speedBoostEffect);
                            ship.speedBoostEffect = null;
                        }
                        
                        console.log("Speed boost ended");
                    }, 10000);
                    
                    console.log("Speed boost activated!");
                    break;
                    
                case 'shield':
                    // Shield for 15 seconds
                    // Clear any existing shield timeout
                    if (ship.shieldTimeout) {
                        clearTimeout(ship.shieldTimeout);
                    } else {
                        // Only add the invulnerability property if it didn't exist before
                        ship.isInvulnerable = true;
                    }
                    
                    // Create shield effect if it doesn't exist
                    if (!ship.shieldEffect) {
                        ship.shieldEffect = createShieldEffect(ship);
                    }
                    
                    // Reset after 15 seconds
                    ship.shieldTimeout = setTimeout(() => {
                        ship.isInvulnerable = false;
                        
                        // Remove effect
                        if (ship.shieldEffect && ship.shieldEffect.parent) {
                            ship.shieldEffect.parent.remove(ship.shieldEffect);
                            ship.shieldEffect = null;
                        }
                        
                        console.log("Shield deactivated");
                    }, 15000);
                    
                    console.log("Shield activated!");
                    break;
                    
                case 'rapidfire':
                    // Rapid fire for 8 seconds
                    // Clear any existing rapid fire timeout
                    if (ship.rapidFireTimeout) {
                        clearTimeout(ship.rapidFireTimeout);
                    } else {
                        // Only set the property if it didn't exist before
                        ship.hasRapidFire = true;
                        // Store the original cooldown
                        ship.originalFireCooldown = window.fireCooldown || 0.5;
                        // Set a shorter cooldown
                        window.fireCooldown = 0.1;
                    }
                    
                    // Create rapid fire effect
                    ship.rapidFireEffect = createRapidFireEffect(ship);
                    
                    // Reset after 8 seconds
                    ship.rapidFireTimeout = setTimeout(() => {
                        ship.hasRapidFire = false;
                        window.fireCooldown = ship.originalFireCooldown;
                        
                        // Remove effect
                        if (ship.rapidFireEffect && ship.rapidFireEffect.parent) {
                            ship.rapidFireEffect.parent.remove(ship.rapidFireEffect);
                            ship.rapidFireEffect = null;
                        }
                        
                        console.log("Rapid fire ended");
                    }, 8000);
                    
                    console.log("Rapid fire activated!");
                    break;
                    
                case 'health':
                    // Restore health
                    ship.health = Math.min(100, ship.health + 30);
                    
                    // Create healing effect
                    createHealingEffect(ship);
                    
                    // Update UI
                    window.updateUI();
                    
                    console.log("Health restored!");
                    break;
            }
            
            // Add points for collecting a powerup
            window.gameState.score += 20;
            window.updateUI();
            
            // Play a sound effect
            // TODO: Add sound effect for powerup collection
            
            // Destroy the powerup
            this.destroy();
        }
    }
    
    explode() {
        // Create explosion effect
        createExplosion(this.position);
        
        // Destroy the bomb
        this.destroy();
    }
    
    destroy() {
        if (!this.isActive) return;
        
        // Remove from scene
        window.scene.remove(this.mesh);
        
        // Remove light if it exists
        if (this.light) {
            window.scene.remove(this.light);
        }
        
        // Mark as inactive
        this.isActive = false;
        
        // Remove from game state
        const index = window.gameState.seaObjects.indexOf(this);
        if (index !== -1) {
            window.gameState.seaObjects.splice(index, 1);
        }
    }
}

// Create an explosion effect
function createExplosion(position) {
    // Create explosion particle system
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
        // Random position within sphere
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Color based on position (red/orange/yellow)
        const colorValue = Math.random();
        if (colorValue < 0.3) {
            color.setHex(0xff0000); // Red
        } else if (colorValue < 0.7) {
            color.setHex(0xff6600); // Orange
        } else {
            color.setHex(0xffff00); // Yellow
        }
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
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
    particles.position.copy(position);
    window.scene.add(particles);
    
    // Add a point light for the explosion
    const light = new THREE.PointLight(0xff5500, 3, 50);
    light.position.copy(position);
    window.scene.add(light);
    
    // Animate explosion
    const startTime = performance.now();
    const duration = 1000; // 1 second
    
    function animateExplosion() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            // Remove particles and light
            window.scene.remove(particles);
            window.scene.remove(light);
            return;
        }
        
        // Expand particles
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] *= 1.02;
            positions[i * 3 + 1] *= 1.02;
            positions[i * 3 + 2] *= 1.02;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        material.opacity = 1 - progress;
        light.intensity = 3 * (1 - progress);
        
        requestAnimationFrame(animateExplosion);
    }
    
    animateExplosion();
}

// Create a slow effect for the ship
function createSlowEffect(ship) {
    // Create a blue aura around the ship
    const geometry = new THREE.SphereGeometry(15, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    const slowEffect = new THREE.Mesh(geometry, material);
    ship.model.add(slowEffect);
    
    return slowEffect;
}

// Create a speed boost effect
function createSpeedBoostEffect(ship) {
    // Create yellow trails behind the ship
    const trailGroup = new THREE.Group();
    
    // Create multiple trail particles
    for (let i = 0; i < 2; i++) {
        const trailGeometry = new THREE.ConeGeometry(1, 15, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2; // Point backward
        trail.position.set(i === 0 ? -3 : 3, 0, -15); // Position behind the ship
        trailGroup.add(trail);
    }
    
    ship.model.add(trailGroup);
    
    // Animate the trails
    const animate = () => {
        if (!ship.speedBoostEffect) return;
        
        trailGroup.children.forEach(trail => {
            trail.material.opacity = 0.5 + Math.random() * 0.5;
            trail.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4
            );
        });
        
        requestAnimationFrame(animate);
    };
    
    animate();
    
    return trailGroup;
}

// Create a shield effect
function createShieldEffect(ship) {
    // Create a bubble shield around the ship
    const geometry = new THREE.SphereGeometry(18, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        wireframe: true
    });
    
    const shield = new THREE.Mesh(geometry, material);
    ship.model.add(shield);
    
    // Add a solid inner shield
    const innerGeometry = new THREE.SphereGeometry(17, 32, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.1
    });
    
    const innerShield = new THREE.Mesh(innerGeometry, innerMaterial);
    shield.add(innerShield);
    
    // Animate the shield
    const animate = () => {
        if (!ship.shieldEffect) return;
        
        shield.rotation.y += 0.01;
        shield.rotation.z += 0.005;
        
        // Pulse the opacity
        const pulse = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;
        material.opacity = pulse;
        innerMaterial.opacity = pulse * 0.5;
        
        requestAnimationFrame(animate);
    };
    
    animate();
    
    return shield;
}

// Create a rapid fire effect
function createRapidFireEffect(ship) {
    // Create glowing effect on the cannon
    const cannonGroup = new THREE.Group();
    
    // Find the cannon in the ship model
    let cannon = null;
    ship.model.traverse(child => {
        if (child instanceof THREE.Mesh && child.position.z > 5) {
            cannon = child;
        }
    });
    
    if (cannon) {
        // Create a glow around the cannon
        const glowGeometry = new THREE.CylinderGeometry(1.2, 1.5, 10.5, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(cannon.position);
        glow.rotation.copy(cannon.rotation);
        cannonGroup.add(glow);
    }
    
    ship.model.add(cannonGroup);
    
    // Animate the effect
    const animate = () => {
        if (!ship.rapidFireEffect) return;
        
        cannonGroup.children.forEach(glow => {
            glow.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        });
        
        requestAnimationFrame(animate);
    };
    
    animate();
    
    return cannonGroup;
}

// Create a healing effect
function createHealingEffect(ship) {
    // Create rising green particles
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color(0x00ff00);
    
    for (let i = 0; i < particleCount; i++) {
        // Random position around the ship
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 10;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 5; // Start at different heights
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        
        // Green color with slight variation
        colors[i * 3] = 0.3 + Math.random() * 0.2; // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.3 + Math.random() * 0.2; // B
        
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
    
    // Animate the particles rising and fading
    const startTime = performance.now();
    const duration = 2000; // 2 seconds
    
    function animateHealing() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            // Remove particles
            ship.model.remove(particles);
            return;
        }
        
        // Move particles upward
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] += 0.2; // Move up
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        material.opacity = 1 - progress;
        
        requestAnimationFrame(animateHealing);
    }
    
    animateHealing();
}

// Function to spawn a sea object
function spawnSeaObject(type, position) {
    // If no position is provided, generate a random one
    if (!position) {
        // Get a random position within a certain range of the player
        const playerShip = window.gameState.playerShip;
        if (!playerShip || !playerShip.isLoaded) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200; // Between 100 and 300 units away
        
        position = new THREE.Vector3(
            playerShip.position.x + Math.sin(angle) * distance,
            0, // At water level
            playerShip.position.z + Math.cos(angle) * distance
        );
    }
    
    // Create the sea object
    return new SeaObject(position, type);
}

// Function to update all sea objects
function updateSeaObjects(delta) {
    // Create a copy of the array to safely iterate while potentially removing items
    const seaObjects = [...window.gameState.seaObjects];
    
    for (let i = 0; i < seaObjects.length; i++) {
        if (seaObjects[i].isActive) {
            seaObjects[i].update(delta);
        }
    }
    
    // Check for collisions with ships
    checkSeaObjectCollisions();
}

// Function to check for collisions between sea objects and ships
function checkSeaObjectCollisions() {
    for (let i = 0; i < window.gameState.seaObjects.length; i++) {
        const seaObject = window.gameState.seaObjects[i];
        
        if (!seaObject.isActive) continue;
        
        // Check collision with all ships
        for (let j = 0; j < window.gameState.ships.length; j++) {
            const ship = window.gameState.ships[j];
            
            if (!ship.isLoaded) continue;
            
            // Check if sea object is within ship's bounding box
            if (ship.boundingBox && seaObject.boundingBox && 
                ship.boundingBox.intersectsBox(seaObject.boundingBox)) {
                // Handle collision
                seaObject.handleCollision(ship);
                break;
            }
        }
    }
}

// Make functions available globally
window.SeaObject = SeaObject;
window.spawnSeaObject = spawnSeaObject;
window.updateSeaObjects = updateSeaObjects;
window.createExplosion = createExplosion; 