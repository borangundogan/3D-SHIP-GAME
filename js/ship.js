// Ship class
class Ship {
    constructor(isPlayer = false) {
        this.isPlayer = isPlayer;
        this.maxSpeed = isPlayer ? 1.5 : 0.8;
        this.originalMaxSpeed = isPlayer ? 1.5 : 0.8; // Store the original max speed
        this.turnSpeed = isPlayer ? 0.03 : 0.015;
        this.rotation = 0;
        this.speed = 0;
        this.targetSpeed = 0;
        this.direction = 0;
        this.health = 100;
        this.position = new THREE.Vector3(0, 0, 0);
        this.mesh = null;
        this.model = null;
        this.boundingBox = null;
        this.isLoaded = false;
        this.speedRestoreTimeout = null; // For tracking the speed restoration timeout
        
        // Acceleration and deceleration rates
        this.accelerationRate = 0.05;  // How quickly the ship accelerates
        this.decelerationRate = 0.03;  // How quickly the ship decelerates when no keys are pressed
        this.brakingRate = 0.08;       // How quickly the ship decelerates when braking (pressing opposite direction)
        
        // Turning acceleration and deceleration
        this.currentTurnRate = 0;      // Current turning rate (positive = left, negative = right)
        this.targetTurnRate = 0;       // Target turning rate
        this.maxTurnRate = isPlayer ? 0.02 : 0.01; // Maximum turn rate (reduced from original turnSpeed)
        this.turnAccelerationRate = 0.001; // How quickly turning accelerates
        this.turnDecelerationRate = 0.002; // How quickly turning decelerates when no keys are pressed
        
        // Collision handling
        this.lastValidPosition = new THREE.Vector3(0, 0, 0);
        this.collisionCooldown = 0; // Cooldown timer for collision feedback
    }
    
    init() {
        // Create the ship model directly with vertices
        this.createShipModel();
        return this;
    }
    
    createShipModel() {
        // Create a ship model directly with vertices
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
        
        // Gradually adjust speed towards target speed
        if (this.speed !== this.targetSpeed) {
            // Determine if we're accelerating, decelerating naturally, or braking
            if (Math.abs(this.targetSpeed) > Math.abs(this.speed)) {
                // Accelerating
                if (this.targetSpeed > this.speed) {
                    this.speed = Math.min(this.speed + this.accelerationRate * effectiveDelta * 30, this.targetSpeed);
                } else {
                    this.speed = Math.max(this.speed - this.accelerationRate * effectiveDelta * 30, this.targetSpeed);
                }
            } else if (this.targetSpeed === 0) {
                // Natural deceleration (no keys pressed)
                if (this.speed > 0) {
                    this.speed = Math.max(this.speed - this.decelerationRate * effectiveDelta * 30, 0);
                } else if (this.speed < 0) {
                    this.speed = Math.min(this.speed + this.decelerationRate * effectiveDelta * 30, 0);
                }
            } else {
                // Braking (pressing opposite direction)
                if (this.speed > 0 && this.targetSpeed < 0) {
                    this.speed = Math.max(this.speed - this.brakingRate * effectiveDelta * 30, this.targetSpeed);
                } else if (this.speed < 0 && this.targetSpeed > 0) {
                    this.speed = Math.min(this.speed + this.brakingRate * effectiveDelta * 30, this.targetSpeed);
                }
            }
            
            // If speed is very close to target, just set it
            if (Math.abs(this.speed - this.targetSpeed) < 0.01) {
                this.speed = this.targetSpeed;
            }
            
            if (window.debugControls) {
                console.log("Adjusting speed:", this.speed, "Target:", this.targetSpeed);
            }
        }
        
        // Gradually adjust turn rate towards target turn rate
        if (this.currentTurnRate !== this.targetTurnRate) {
            // Calculate turn acceleration based on delta time
            const turnAcceleration = this.turnAccelerationRate * effectiveDelta * 30;
            const turnDeceleration = this.turnDecelerationRate * effectiveDelta * 30;
            
            if (this.targetTurnRate === 0) {
                // Decelerate turning when no turn keys are pressed
                if (this.currentTurnRate > 0) {
                    this.currentTurnRate = Math.max(this.currentTurnRate - turnDeceleration, 0);
                } else if (this.currentTurnRate < 0) {
                    this.currentTurnRate = Math.min(this.currentTurnRate + turnDeceleration, 0);
                }
            } else if (Math.abs(this.targetTurnRate) > Math.abs(this.currentTurnRate)) {
                // Accelerate turning
                if (this.targetTurnRate > this.currentTurnRate) {
                    this.currentTurnRate = Math.min(this.currentTurnRate + turnAcceleration, this.targetTurnRate);
                } else {
                    this.currentTurnRate = Math.max(this.currentTurnRate - turnAcceleration, this.targetTurnRate);
                }
            } else {
                // Decelerate turning (changing direction)
                if (this.targetTurnRate > this.currentTurnRate) {
                    this.currentTurnRate = Math.min(this.currentTurnRate + turnDeceleration, this.targetTurnRate);
                } else {
                    this.currentTurnRate = Math.max(this.currentTurnRate - turnDeceleration, this.targetTurnRate);
                }
            }
            
            // If turn rate is very close to target, just set it
            if (Math.abs(this.currentTurnRate - this.targetTurnRate) < 0.0001) {
                this.currentTurnRate = this.targetTurnRate;
            }
            
            if (window.debugControls) {
                console.log("Adjusting turn rate:", this.currentTurnRate, "Target:", this.targetTurnRate);
            }
        }
        
        // Apply rotation based on current turn rate
        this.rotation += this.currentTurnRate * effectiveDelta * 30;
        
        // Store the current position as the last valid position before moving
        this.lastValidPosition.copy(this.position);
        
        // Move ship based on current speed
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
            
            // Update the bounding box
            if (this.boundingBox && this.model) {
                this.boundingBox.setFromObject(this.model);
            }
            
            // Check for collisions with mountains
            if (window.mountainGenerator && this.checkMountainCollisions()) {
                // If collision detected, revert to last valid position
                this.position.copy(this.lastValidPosition);
                
                // Update the mesh position
                if (this.model) {
                    this.model.position.copy(this.position);
                }
                
                // Update the bounding box
                if (this.boundingBox && this.model) {
                    this.boundingBox.setFromObject(this.model);
                }
                
                // Apply collision feedback (reduce speed)
                this.speed *= 0.5;
                
                // Add visual/audio feedback for collision if it's the player
                if (this.isPlayer && this.collisionCooldown <= 0) {
                    this.collisionCooldown = 0.5; // Set cooldown to 0.5 seconds
                    this.createCollisionEffect();
                }
            }
        } else {
            // Update the bounding box even if not moving
            if (this.boundingBox && this.model) {
                this.boundingBox.setFromObject(this.model);
            }
        }
        
        // Update rotation
        if (this.model) {
            this.model.rotation.y = this.rotation;
        }
        
        // Update collision cooldown
        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= effectiveDelta;
        }
    }
    
    moveForward(speedMultiplier = 1.0) {
        if (window.debugControls) {
            console.log("Ship.moveForward() called, setting target speed to", this.maxSpeed * speedMultiplier);
        }
        this.targetSpeed = this.maxSpeed * speedMultiplier;
        this.direction = 1;
    }
    
    moveBackward(speedMultiplier = 1.0) {
        if (window.debugControls) {
            console.log("Ship.moveBackward() called, setting target speed to", -this.maxSpeed * speedMultiplier);
        }
        this.targetSpeed = -this.maxSpeed * speedMultiplier;
        this.direction = -1;
    }
    
    stopMoving() {
        if (window.debugControls) {
            console.log("Ship.stopMoving() called, setting target speed to 0");
        }
        this.targetSpeed = 0;
    }
    
    turnLeft(speedMultiplier = 1.0) {
        if (!this.isLoaded) return;
        this.targetTurnRate = this.maxTurnRate * speedMultiplier;
    }
    
    turnRight(speedMultiplier = 1.0) {
        if (!this.isLoaded) return;
        this.targetTurnRate = -this.maxTurnRate * speedMultiplier;
    }
    
    stopTurning() {
        this.targetTurnRate = 0;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Update UI if this is the player ship
        if (this.isPlayer) {
            window.updateUI();
            
            // Add visual feedback for taking damage
            this.createDamageEffect();
        }
        
        if (this.health <= 0) {
            // If this is the player ship, trigger game over
            if (this.isPlayer) {
                window.gameOver();
            }
            
            this.destroy();
        }
    }
    
    destroy() {
        // Remove from scene
        if (this.model) {
            window.scene.remove(this.model);
        }
        
        // Remove username label if it exists
        if (this.usernameLabel) {
            document.body.removeChild(this.usernameLabel);
            this.usernameLabel = null;
        }
        
        // Remove from game state
        const index = window.gameState.ships.indexOf(this);
        if (index !== -1) {
            window.gameState.ships.splice(index, 1);
        }
        
        // Clear any active timeouts
        if (this.speedRestoreTimeout) {
            clearTimeout(this.speedRestoreTimeout);
            this.speedRestoreTimeout = null;
        }
        
        // Clear any active powerup timeouts
        if (this.speedBoostTimeout) {
            clearTimeout(this.speedBoostTimeout);
            this.speedBoostTimeout = null;
        }
        
        if (this.shieldTimeout) {
            clearTimeout(this.shieldTimeout);
            this.shieldTimeout = null;
        }
        
        if (this.rapidFireTimeout) {
            clearTimeout(this.rapidFireTimeout);
            this.rapidFireTimeout = null;
        }
    }
    
    // Check for collisions with mountains
    checkMountainCollisions() {
        if (!window.mountainGenerator) return false;
        
        return window.mountainGenerator.checkShipCollision(this);
    }
    
    // Create visual effect for collision
    createCollisionEffect() {
        // Create a camera shake effect for mountain collisions
        // This provides feedback without using the red flash (which is reserved for damage)
        
        // 1. Add a subtle screen shake
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.classList.add('screen-shake');
            
            // Remove the class after animation completes
            setTimeout(() => {
                gameContainer.classList.remove('screen-shake');
            }, 500);
        }
        
        // 2. Create a white/blue flash effect to indicate collision with terrain
        const flash = document.createElement('div');
        flash.className = 'collision-flash';
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(180, 220, 255, 0.2);
            pointer-events: none;
            z-index: 1000;
            animation: flash-animation 0.5s ease-out;
        `;
        
        // Add animation styles if they don't exist
        if (!document.getElementById('collision-animation-style')) {
            const style = document.createElement('style');
            style.id = 'collision-animation-style';
            style.textContent = `
                @keyframes flash-animation {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
                
                .screen-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(flash);
        
        // Remove the flash after animation completes
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
        
        // 3. Play a collision sound if available
        if (window.playSound && typeof window.playSound === 'function') {
            window.playSound('collision');
        }
    }
    
    // Create visual effect for taking damage (red flash)
    createDamageEffect() {
        // Create a red flash effect to indicate damage from bullets/bombs
        const flash = document.createElement('div');
        flash.className = 'damage-flash';
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 1000;
            animation: damage-flash-animation 0.5s ease-out;
        `;
        
        // Add animation styles if they don't exist
        if (!document.getElementById('damage-animation-style')) {
            const style = document.createElement('style');
            style.id = 'damage-animation-style';
            style.textContent = `
                @keyframes damage-flash-animation {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(flash);
        
        // Remove the flash after animation completes
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
        
        // Play a damage sound if available
        if (window.playSound && typeof window.playSound === 'function') {
            window.playSound('damage');
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