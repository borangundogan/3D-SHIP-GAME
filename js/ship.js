// Ship class
class Ship {
    constructor(isPlayer = false, shipType = 'standard') {
        this.isPlayer = isPlayer;
        this.shipType = shipType; // Add ship type property
        
        // Set properties based on ship type
        this.setShipProperties();
        
        this.rotation = 0;
        this.speed = 0;
        this.targetSpeed = 0;
        this.direction = 0;
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
        this.turnAccelerationRate = 0.001; // How quickly turning accelerates
        this.turnDecelerationRate = 0.002; // How quickly turning decelerates when no keys are pressed
        
        // Collision handling
        this.lastValidPosition = new THREE.Vector3(0, 0, 0);
        this.collisionCooldown = 0; // Cooldown timer for collision feedback
    }
    
    // Set ship properties based on type
    setShipProperties() {
        // Default properties
        this.maxSpeed = this.isPlayer ? 2.5 : 1.2;
        this.originalMaxSpeed = this.maxSpeed;
        this.turnSpeed = this.isPlayer ? 0.04 : 0.02;
        this.maxTurnRate = this.isPlayer ? 0.03 : 0.015;
        this.health = 100;
        this.accelerationRate = 0.07;
        this.decelerationRate = 0.03;
        this.brakingRate = 0.08;
        this.scale = 1.0;
        this.hullColor = this.isPlayer ? 0x3366ff : 0xff3333;
        
        // Modify properties based on ship type
        if (!this.isPlayer) {
            switch(this.shipType) {
                case 'destroyer':
                    // Fast but fragile ship
                    this.maxSpeed = 1.8;
                    this.originalMaxSpeed = 1.8;
                    this.turnSpeed = 0.035;
                    this.maxTurnRate = 0.025;
                    this.health = 70;
                    this.accelerationRate = 0.09;
                    this.hullColor = 0xff6600; // Orange
                    this.scale = 0.8;
                    break;
                    
                case 'battleship':
                    // Slow but powerful ship
                    this.maxSpeed = 0.9;
                    this.originalMaxSpeed = 0.9;
                    this.turnSpeed = 0.015;
                    this.maxTurnRate = 0.012;
                    this.health = 150;
                    this.accelerationRate = 0.04;
                    this.hullColor = 0x990000; // Dark red
                    this.scale = 1.4;
                    break;
                    
                case 'cruiser':
                    // Balanced ship
                    this.maxSpeed = 1.3;
                    this.originalMaxSpeed = 1.3;
                    this.turnSpeed = 0.025;
                    this.maxTurnRate = 0.018;
                    this.health = 120;
                    this.accelerationRate = 0.06;
                    this.hullColor = 0x009900; // Green
                    this.scale = 1.2;
                    break;
                    
                case 'submarine':
                    // Stealthy ship
                    this.maxSpeed = 1.1;
                    this.originalMaxSpeed = 1.1;
                    this.turnSpeed = 0.03;
                    this.maxTurnRate = 0.022;
                    this.health = 90;
                    this.accelerationRate = 0.055;
                    this.hullColor = 0x333333; // Dark gray
                    this.scale = 0.9;
                    break;
                    
                case 'carrier':
                    // Large support ship
                    this.maxSpeed = 0.8;
                    this.originalMaxSpeed = 0.8;
                    this.turnSpeed = 0.012;
                    this.maxTurnRate = 0.009;
                    this.health = 180;
                    this.accelerationRate = 0.03;
                    this.hullColor = 0x0066cc; // Blue
                    this.scale = 1.6;
                    break;
            }
        }
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
            color: this.hullColor,
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
            // Add ship-type specific details for enemy ships
            switch(this.shipType) {
                case 'destroyer':
                    // Sleek, fast destroyer with dual cannons
                    // Make hull more streamlined
                    hull.scale.set(0.8, 0.8, 1.1);
                    
                    // Smaller bridge
                    bridge.scale.set(0.8, 0.8, 0.8);
                    bridge.position.y = 4;
                    
                    // Dual smaller cannons
                    const destroyerLeftCannonGeometry = new THREE.CylinderGeometry(0.5, 0.6, 12);
                    const destroyerLeftCannon = new THREE.Mesh(destroyerLeftCannonGeometry, cannonMaterial);
                    destroyerLeftCannon.rotation.x = Math.PI / 2;
                    destroyerLeftCannon.position.set(-2, 3, 8);
                    shipGroup.add(destroyerLeftCannon);
                    
                    const destroyerRightCannonGeometry = new THREE.CylinderGeometry(0.5, 0.6, 12);
                    const destroyerRightCannon = new THREE.Mesh(destroyerRightCannonGeometry, cannonMaterial);
                    destroyerRightCannon.rotation.x = Math.PI / 2;
                    destroyerRightCannon.position.set(2, 3, 8);
                    shipGroup.add(destroyerRightCannon);
                    
                    // Remove the central cannon
                    shipGroup.remove(cannon);
                    break;
                    
                case 'battleship':
                    // Massive battleship with heavy armor and large cannons
                    // Wider, taller hull
                    hull.scale.set(1.3, 1.2, 1.2);
                    
                    // Larger bridge
                    bridge.scale.set(1.2, 1.3, 1.2);
                    bridge.position.y = 6;
                    
                    // Triple heavy cannons
                    const mainCannonGeometry = new THREE.CylinderGeometry(1.2, 1.5, 14);
                    const mainCannon = new THREE.Mesh(mainCannonGeometry, cannonMaterial);
                    mainCannon.rotation.x = Math.PI / 2;
                    mainCannon.position.set(0, 5, 10);
                    shipGroup.add(mainCannon);
                    
                    const leftHeavyCannonGeometry = new THREE.CylinderGeometry(1, 1.2, 12);
                    const leftHeavyCannon = new THREE.Mesh(leftHeavyCannonGeometry, cannonMaterial);
                    leftHeavyCannon.rotation.x = Math.PI / 2;
                    leftHeavyCannon.position.set(-4, 4, 6);
                    shipGroup.add(leftHeavyCannon);
                    
                    const rightHeavyCannonGeometry = new THREE.CylinderGeometry(1, 1.2, 12);
                    const rightHeavyCannon = new THREE.Mesh(rightHeavyCannonGeometry, cannonMaterial);
                    rightHeavyCannon.rotation.x = Math.PI / 2;
                    rightHeavyCannon.position.set(4, 4, 6);
                    shipGroup.add(rightHeavyCannon);
                    
                    // Remove the original cannon
                    shipGroup.remove(cannon);
                    
                    // Add armor plates
                    const armorGeometry = new THREE.BoxGeometry(12, 4, 28);
                    const armorMaterial = new THREE.MeshPhongMaterial({ 
                        color: 0x555555,
                        shininess: 10
                    });
                    const armor = new THREE.Mesh(armorGeometry, armorMaterial);
                    armor.position.y = 1;
                    armor.scale.set(0.95, 0.5, 0.95);
                    shipGroup.add(armor);
                    break;
                    
                case 'cruiser':
                    // Medium-sized cruiser with balanced features
                    // Slightly larger hull
                    hull.scale.set(1.1, 1, 1.1);
                    
                    // Modified bridge
                    bridge.scale.set(1, 1.2, 1);
                    bridge.position.y = 5.5;
                    
                    // Dual medium cannons
                    const frontCannonGeometry = new THREE.CylinderGeometry(0.9, 1.1, 12);
                    const frontCannon = new THREE.Mesh(frontCannonGeometry, cannonMaterial);
                    frontCannon.rotation.x = Math.PI / 2;
                    frontCannon.position.set(0, 4, 10);
                    shipGroup.add(frontCannon);
                    
                    const rearCannonGeometry = new THREE.CylinderGeometry(0.9, 1.1, 10);
                    const rearCannon = new THREE.Mesh(rearCannonGeometry, cannonMaterial);
                    rearCannon.rotation.x = Math.PI / 2;
                    rearCannon.position.set(0, 4, -8);
                    shipGroup.add(rearCannon);
                    
                    // Remove the original cannon
                    shipGroup.remove(cannon);
                    
                    // Add radar tower
                    const radarTowerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4);
                    const radarTowerMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
                    const radarTower = new THREE.Mesh(radarTowerGeometry, radarTowerMaterial);
                    radarTower.position.set(0, 8, -4);
                    shipGroup.add(radarTower);
                    
                    const cruiserRadarGeometry = new THREE.SphereGeometry(1, 8, 8, 0, Math.PI);
                    const cruiserRadarMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
                    const cruiserRadar = new THREE.Mesh(cruiserRadarGeometry, cruiserRadarMaterial);
                    cruiserRadar.rotation.x = Math.PI / 2;
                    cruiserRadar.position.set(0, 10, -4);
                    shipGroup.add(cruiserRadar);
                    break;
                    
                case 'submarine':
                    // Low-profile submarine with torpedo tubes
                    // Lower, sleeker hull
                    hull.scale.set(0.9, 0.7, 1.2);
                    hull.position.y = 0.5;
                    
                    // Conning tower instead of bridge
                    bridge.scale.set(0.6, 1.5, 0.6);
                    bridge.position.y = 3;
                    
                    // Torpedo tubes instead of cannon
                    const torpedoTubeGeometry = new THREE.BoxGeometry(8, 2, 4);
                    const torpedoTubeMaterial = new THREE.MeshPhongMaterial({ 
                        color: 0x444444,
                        shininess: 30
                    });
                    const torpedoTube = new THREE.Mesh(torpedoTubeGeometry, torpedoTubeMaterial);
                    torpedoTube.position.set(0, 1.5, 10);
                    shipGroup.add(torpedoTube);
                    
                    // Remove the original cannon
                    shipGroup.remove(cannon);
                    
                    // Add periscope
                    const periscopeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3);
                    const periscopeMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
                    const periscope = new THREE.Mesh(periscopeGeometry, periscopeMaterial);
                    periscope.position.set(0, 6, -1);
                    shipGroup.add(periscope);
                    break;
                    
                case 'carrier':
                    // Large aircraft carrier with flat deck
                    // Wider, longer hull
                    hull.scale.set(1.5, 0.9, 1.4);
                    
                    // Island bridge on the side
                    bridge.scale.set(0.7, 1.5, 0.8);
                    bridge.position.set(4, 6, -5);
                    
                    // Flight deck
                    const flightDeckGeometry = new THREE.BoxGeometry(9, 0.5, 30);
                    const flightDeckMaterial = new THREE.MeshPhongMaterial({ 
                        color: 0x333333,
                        shininess: 10
                    });
                    const flightDeck = new THREE.Mesh(flightDeckGeometry, flightDeckMaterial);
                    flightDeck.position.set(0, 3.5, 0);
                    shipGroup.add(flightDeck);
                    
                    // Remove the original cannon
                    shipGroup.remove(cannon);
                    
                    // Add radar and communications equipment
                    const carrierRadarGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2);
                    const carrierRadarMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
                    const carrierRadar = new THREE.Mesh(carrierRadarGeometry, carrierRadarMaterial);
                    carrierRadar.position.set(4, 9, -5);
                    shipGroup.add(carrierRadar);
                    
                    // Add aircraft on deck (simplified)
                    for (let i = 0; i < 3; i++) {
                        const aircraftGeometry = new THREE.BoxGeometry(2, 0.5, 3);
                        const aircraftMaterial = new THREE.MeshPhongMaterial({ 
                            color: 0x555555,
                            shininess: 20
                        });
                        const aircraft = new THREE.Mesh(aircraftGeometry, aircraftMaterial);
                        aircraft.position.set(Math.random() * 6 - 3, 3.8, i * 8 - 10);
                        aircraft.rotation.y = Math.random() * Math.PI / 4 - Math.PI / 8;
                        shipGroup.add(aircraft);
                    }
                    break;
                    
                default:
                    // Standard enemy ship (original design)
                    // Add a different style bridge for enemy ships
                    const enemyTowerGeometry = new THREE.CylinderGeometry(2, 3, 6);
                    const enemyTowerMaterial = new THREE.MeshPhongMaterial({ color: 0x880000 });
                    const enemyTower = new THREE.Mesh(enemyTowerGeometry, enemyTowerMaterial);
                    enemyTower.position.set(0, 6, -5);
                    shipGroup.add(enemyTower);
                    
                    // Add enemy cannons (two smaller ones)
                    const enemyCannonGeometry = new THREE.CylinderGeometry(0.6, 0.8, 8);
                    const enemyCannonMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
                    
                    const standardLeftCannon = new THREE.Mesh(enemyCannonGeometry, enemyCannonMaterial);
                    standardLeftCannon.rotation.x = Math.PI / 2;
                    standardLeftCannon.position.set(-3, 3, 6);
                    shipGroup.add(standardLeftCannon);
                    
                    const standardRightCannon = new THREE.Mesh(enemyCannonGeometry, enemyCannonMaterial);
                    standardRightCannon.rotation.x = Math.PI / 2;
                    standardRightCannon.position.set(3, 3, 6);
                    shipGroup.add(standardRightCannon);
            }
        }
        
        // Apply overall scaling based on ship type
        shipGroup.scale.set(this.scale, this.scale, this.scale);
        
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
function createEnemyShip(position, shipType) {
    // If no ship type is specified, randomly select one
    if (!shipType) {
        const shipTypes = ['standard', 'destroyer', 'battleship', 'cruiser', 'submarine', 'carrier'];
        shipType = shipTypes[Math.floor(Math.random() * shipTypes.length)];
    }
    
    const ship = new Ship(false, shipType);
    
    // Set position if provided
    if (position) {
        ship.position.copy(position);
    }
    
    return ship;
}

// Function to create a specific type of enemy ship
function createSpecificEnemyShip(position, shipType) {
    return createEnemyShip(position, shipType);
}

// Make functions available globally
window.Ship = Ship;
window.createPlayerShip = createPlayerShip;
window.createEnemyShip = createEnemyShip;
window.createSpecificEnemyShip = createSpecificEnemyShip; 