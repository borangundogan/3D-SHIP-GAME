// Key states
const keyStates = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false,
    superTurbo: false,
    toggleCamera: false,
    muteSound: false,
    turboBoost: false
};

// Make keyStates globally accessible
window.keyStates = keyStates;

// Firing cooldown
let lastFireTime = 0;
const fireCooldown = 0.3; // seconds

// Turbo boost properties
let turboBoostActive = false;
let turboBoostCooldown = 0;
const turboBoostDuration = 3; // seconds
const turboBoostCooldownTime = 8; // seconds
const turboBoostSpeedMultiplier = 2.0; // Double speed during boost

// Camera view state
let cameraViewMode = 'follow'; // 'follow', 'cockpit', 'top'

// Sound state
let soundMuted = false;

// Initialize controls
function initControls(playerShip) {
    // Keyboard controls
    window.addEventListener('keydown', (event) => {
        handleKeyDown(event, playerShip);
    });
    
    window.addEventListener('keyup', (event) => {
        handleKeyUp(event, playerShip);
    });
    
    // Mobile controls (touch)
    initMobileControls(playerShip);
}

// Handle key down events
function handleKeyDown(event, playerShip) {
    switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            keyStates.forward = true;
            break;
        case 's':
        case 'arrowdown':
            keyStates.backward = true;
            break;
        case 'a':
        case 'arrowleft':
            keyStates.left = true;
            break;
        case 'd':
        case 'arrowright':
            keyStates.right = true;
            break;
        case ' ':
        case 'p':
            keyStates.fire = true;
            break;
        // New controls
        case 'shift':
            // Activate turbo boost if not on cooldown
            if (!turboBoostActive && turboBoostCooldown <= 0) {
                keyStates.turboBoost = true;
                activateTurboBoost(playerShip);
            }
            break;
        case 'v':
            // Toggle camera view on key press, not hold
            if (!keyStates.toggleCamera) {
                keyStates.toggleCamera = true;
                toggleCameraView();
            }
            break;
        case 'm':
            // Toggle sound on key press, not hold
            if (!keyStates.muteSound) {
                keyStates.muteSound = true;
                toggleSound();
            }
            break;
    }
}

// Handle key up events
function handleKeyUp(event, playerShip) {
    switch(event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            keyStates.forward = false;
            break;
        case 's':
        case 'arrowdown':
            keyStates.backward = false;
            break;
        case 'a':
        case 'arrowleft':
            keyStates.left = false;
            break;
        case 'd':
        case 'arrowright':
            keyStates.right = false;
            break;
        case ' ':
        case 'f':
            keyStates.fire = false;
            break;
        // New controls
        case 'shift':
            keyStates.turboBoost = false;
            break;
        case 'v':
            keyStates.toggleCamera = false;
            break;
        case 'm':
            keyStates.muteSound = false;
            break;
    }
    
    // If the player ship exists and this is a movement key, ensure the ship stops if no movement keys are pressed
    if (playerShip) {
        // Handle forward/backward movement
        if (['w', 's', 'arrowup', 'arrowdown'].includes(event.key.toLowerCase())) {
            if (!keyStates.forward && !keyStates.backward) {
                playerShip.stopMoving();
            }
        }
        
        // Handle turning
        if (['a', 'd', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
            if (!keyStates.left && !keyStates.right) {
                playerShip.stopTurning();
            } else if (keyStates.left) {
                playerShip.turnLeft();
            } else if (keyStates.right) {
                playerShip.turnRight();
            }
        }
    }
}

// Function to activate turbo boost
function activateTurboBoost(playerShip) {
    if (!playerShip || turboBoostActive) return;
    
    turboBoostActive = true;
    
    // Store original max speed
    const originalMaxSpeed = playerShip.maxSpeed;
    
    // Increase max speed
    playerShip.maxSpeed *= turboBoostSpeedMultiplier;
    
    // Create visual effect
    createTurboBoostEffect(playerShip);
    
    // Add to active powerups display
    if (window.gameState && window.gameState.activePowerups) {
        window.gameState.activePowerups.push({
            type: 'turboBoost',
            duration: turboBoostDuration,
            timeRemaining: turboBoostDuration
        });
    }
    
    // Update UI
    if (window.updateActivePowerupsUI) {
        window.updateActivePowerupsUI();
    }
    
    // Play sound if available
    if (window.playSound && typeof window.playSound === 'function') {
        window.playSound('boost');
    }
    
    // Reset after duration
    setTimeout(() => {
        // Reset speed
        playerShip.maxSpeed = originalMaxSpeed;
        
        // Remove from active powerups
        if (window.gameState && window.gameState.activePowerups) {
            const index = window.gameState.activePowerups.findIndex(p => p.type === 'turboBoost');
            if (index !== -1) {
                window.gameState.activePowerups.splice(index, 1);
            }
        }
        
        // Update UI
        if (window.updateActivePowerupsUI) {
            window.updateActivePowerupsUI();
        }
        
        // Set cooldown
        turboBoostActive = false;
        turboBoostCooldown = turboBoostCooldownTime;
        
    }, turboBoostDuration * 1000);
}

// Function to create visual effect for turbo boost
function createTurboBoostEffect(ship) {
    // Create particle trail
    const particleCount = 50;
    const particles = new THREE.Group();
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 1 + 0.5;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Position behind the ship
        particle.position.set(0, 0, -10 - Math.random() * 20);
        
        // Add to group
        particles.add(particle);
        
        // Add random velocity
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            -Math.random() * 5 - 5
        );
        
        // Add random lifetime
        particle.userData.lifetime = Math.random() * 0.5 + 0.5;
        particle.userData.age = 0;
    }
    
    // Add particles to ship
    ship.model.add(particles);
    
    // Add engine glow
    const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 0, -8);
    ship.model.add(glow);
    
    // Animate particles
    function animateParticles() {
        if (!turboBoostActive || !ship.model) {
            // Remove particles and glow when boost ends
            if (ship.model) {
                ship.model.remove(particles);
                ship.model.remove(glow);
            }
            return;
        }
        
        // Update particles
        for (let i = 0; i < particles.children.length; i++) {
            const particle = particles.children[i];
            
            // Update age
            particle.userData.age += 1/60; // Assuming 60fps
            
            // Remove if too old
            if (particle.userData.age >= particle.userData.lifetime) {
                // Reset particle
                particle.position.set(0, 0, -10 - Math.random() * 5);
                particle.userData.age = 0;
                particle.userData.lifetime = Math.random() * 0.5 + 0.5;
                particle.material.opacity = 0.7;
            }
            
            // Move particle
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(1/60));
            
            // Fade out
            particle.material.opacity = 0.7 * (1 - particle.userData.age / particle.userData.lifetime);
        }
        
        // Pulse glow
        glow.material.opacity = 0.5 + Math.sin(Date.now() / 100) * 0.3;
        glow.scale.set(
            1 + Math.sin(Date.now() / 120) * 0.2,
            1 + Math.sin(Date.now() / 120) * 0.2,
            1 + Math.sin(Date.now() / 120) * 0.2
        );
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
}

// Reset all key states - can be called when focus is lost or when needed
function resetKeyStates() {
    keyStates.forward = false;
    keyStates.backward = false;
    keyStates.left = false;
    keyStates.right = false;
    keyStates.fire = false;
    keyStates.superTurbo = false;
    keyStates.toggleCamera = false;
    keyStates.muteSound = false;
    keyStates.turboBoost = false;
}

// Add event listener for when window loses focus to reset key states
window.addEventListener('blur', function() {
    resetKeyStates();
    // If player ship exists, stop it from moving
    if (window.gameState && window.gameState.playerShip) {
        window.gameState.playerShip.stopMoving();
    }
});

// Toggle camera view
function toggleCameraView() {
    // Cycle through camera views: follow -> cockpit -> top -> follow
    switch (cameraViewMode) {
        case 'follow':
            cameraViewMode = 'cockpit';
            break;
        case 'cockpit':
            cameraViewMode = 'top';
            break;
        case 'top':
            cameraViewMode = 'follow';
            break;
    }
    
    console.log(`Camera view changed to: ${cameraViewMode}`);
}

// Toggle sound
function toggleSound() {
    soundMuted = !soundMuted;
    console.log(`Sound ${soundMuted ? 'muted' : 'unmuted'}`);
    // Here you would implement actual sound muting logic
}

// Initialize mobile controls
function initMobileControls(playerShip) {
    // Create mobile control elements if on touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        createMobileControlElements();
        
        // Add touch event listeners
        const forwardBtn = document.getElementById('mobile-forward');
        const backwardBtn = document.getElementById('mobile-backward');
        const leftBtn = document.getElementById('mobile-left');
        const rightBtn = document.getElementById('mobile-right');
        const fireBtn = document.getElementById('mobile-fire');
        
        // Forward button
        forwardBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.forward = true;
        }, { passive: false });
        
        forwardBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.forward = false;
            if (playerShip) {
                if (!keyStates.backward) {
                    playerShip.stopMoving();
                }
            }
        }, { passive: false });
        
        // Backward button
        backwardBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.backward = true;
        }, { passive: false });
        
        backwardBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.backward = false;
            if (playerShip) {
                if (!keyStates.forward) {
                    playerShip.stopMoving();
                }
            }
        }, { passive: false });
        
        // Left button
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.left = true;
        }, { passive: false });
        
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.left = false;
            if (playerShip) {
                if (!keyStates.right) {
                    playerShip.stopTurning();
                } else {
                    playerShip.turnRight();
                }
            }
        }, { passive: false });
        
        // Right button
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.right = true;
        }, { passive: false });
        
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.right = false;
            if (playerShip) {
                if (!keyStates.left) {
                    playerShip.stopTurning();
                } else {
                    playerShip.turnLeft();
                }
            }
        }, { passive: false });
        
        // Fire button
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.fire = true;
        }, { passive: false });
        
        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.fire = false;
        }, { passive: false });
        
        // Also handle touchcancel events
        const handleTouchCancel = (e) => {
            keyStates.forward = false;
            keyStates.backward = false;
            keyStates.left = false;
            keyStates.right = false;
            keyStates.fire = false;
            
            // Stop all movement and turning
            if (playerShip) {
                playerShip.stopMoving();
                playerShip.stopTurning();
            }
        };
        
        forwardBtn.addEventListener('touchcancel', handleTouchCancel);
        backwardBtn.addEventListener('touchcancel', handleTouchCancel);
        leftBtn.addEventListener('touchcancel', handleTouchCancel);
        rightBtn.addEventListener('touchcancel', handleTouchCancel);
        fireBtn.addEventListener('touchcancel', handleTouchCancel);
    }
}

// Create mobile control elements
function createMobileControlElements() {
    const mobileControls = document.createElement('div');
    mobileControls.id = 'mobile-controls';
    
    // Movement controls
    const movementControls = document.createElement('div');
    movementControls.className = 'mobile-control-group';
    
    const forwardBtn = document.createElement('button');
    forwardBtn.id = 'mobile-forward';
    forwardBtn.className = 'mobile-btn';
    forwardBtn.innerHTML = '▲';
    
    const backwardBtn = document.createElement('button');
    backwardBtn.id = 'mobile-backward';
    backwardBtn.className = 'mobile-btn';
    backwardBtn.innerHTML = '▼';
    
    const leftBtn = document.createElement('button');
    leftBtn.id = 'mobile-left';
    leftBtn.className = 'mobile-btn';
    leftBtn.innerHTML = '◄';
    
    const rightBtn = document.createElement('button');
    rightBtn.id = 'mobile-right';
    rightBtn.className = 'mobile-btn';
    rightBtn.innerHTML = '►';
    
    // Fire control
    const actionControls = document.createElement('div');
    actionControls.className = 'mobile-control-group';
    
    const fireBtn = document.createElement('button');
    fireBtn.id = 'mobile-fire';
    fireBtn.className = 'mobile-btn fire-btn';
    fireBtn.innerHTML = 'FIRE';
    
    // Append buttons to control groups
    movementControls.appendChild(forwardBtn);
    movementControls.appendChild(leftBtn);
    movementControls.appendChild(rightBtn);
    movementControls.appendChild(backwardBtn);
    
    actionControls.appendChild(fireBtn);
    
    // Append control groups to mobile controls
    mobileControls.appendChild(movementControls);
    mobileControls.appendChild(actionControls);
    
    // Append mobile controls to body
    document.body.appendChild(mobileControls);
    
    // Add mobile control styles
    const style = document.createElement('style');
    style.textContent = `
        #mobile-controls {
            position: fixed;
            bottom: 20px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 100;
        }
        
        .mobile-control-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 10px;
        }
        
        .mobile-btn {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.5);
            border: 3px solid rgba(255, 255, 255, 0.7);
            color: white;
            font-size: 28px;
            display: flex;
            justify-content: center;
            align-items: center;
            touch-action: manipulation;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        }
        
        .fire-btn {
            width: 90px;
            height: 90px;
            background-color: rgba(255, 0, 0, 0.5);
            border: 3px solid rgba(255, 0, 0, 0.7);
            font-size: 20px;
        }
        
        #mobile-forward {
            grid-column: 1 / 3;
            grid-row: 1;
            margin: 0 auto;
            z-index: 101;
        }
        
        #mobile-backward {
            grid-column: 1 / 3;
            grid-row: 2;
            margin: 0 auto;
            z-index: 101;
        }
        
        #mobile-left {
            grid-column: 1;
            grid-row: 1 / 3;
            align-self: center;
            z-index: 101;
        }
        
        #mobile-right {
            grid-column: 2;
            grid-row: 1 / 3;
            align-self: center;
            z-index: 101;
        }
    `;
    document.head.appendChild(style);
}

// Update player ship based on controls
function updatePlayerControls(playerShip, delta) {
    if (!playerShip || !playerShip.isLoaded) return;
    
    // Disable debug output
    window.debugControls = false;
    
    // Log key states for debugging
    if (window.debugControls) {
        console.log("Key States:", {
            forward: keyStates.forward,
            backward: keyStates.backward,
            left: keyStates.left,
            right: keyStates.right,
            fire: keyStates.fire,
            superTurbo: keyStates.superTurbo,
            turboBoost: keyStates.turboBoost
        });
    }
    
    // Update turbo boost cooldown
    if (turboBoostCooldown > 0) {
        turboBoostCooldown -= delta;
    }
    
    // Apply super turbo if active
    const speedMultiplier = keyStates.superTurbo ? 2.0 : 1.0;
    
    // Handle movement - set target speed based on key states
    if (keyStates.forward) {
        if (window.debugControls) console.log("Moving forward");
        playerShip.moveForward(speedMultiplier);
    } else if (keyStates.backward) {
        if (window.debugControls) console.log("Moving backward");
        playerShip.moveBackward(speedMultiplier);
    } else {
        if (window.debugControls) console.log("Stopping movement");
        playerShip.stopMoving();
    }
    
    // Handle turning - set target turn rate based on key states
    if (keyStates.left && !keyStates.right) {
        playerShip.turnLeft(speedMultiplier);
    } else if (keyStates.right && !keyStates.left) {
        playerShip.turnRight(speedMultiplier);
    } else {
        playerShip.stopTurning();
    }
    
    // Handle firing
    if (keyStates.fire) {
        const currentTime = performance.now() / 1000;
        // Use the global fireCooldown which can be modified by powerups
        const cooldown = window.fireCooldown || 0.5;
        if (currentTime - window.lastFireTime >= cooldown) {
            window.fireProjectile(playerShip);
            window.lastFireTime = currentTime;
        }
    }
    
    // Update camera to follow player based on current view mode
    updateCameraPosition(playerShip);
    
    // Debug output to console
    if (window.debugControls) {
        console.log("Ship speed:", playerShip.speed);
        console.log("Ship position:", playerShip.position);
    }
}

// Update camera to follow player ship
function updateCameraPosition(playerShip) {
    if (!playerShip || !playerShip.isLoaded) return;
    
    switch (cameraViewMode) {
        case 'follow':
            // Modified follow camera with better perspective
            const followDistance = 80; // Increased distance behind the ship
            const followHeight = 30;   // Height above the ship
            const followSide = 0;      // Removed side offset for a directly behind view
            
            // Calculate position directly behind the ship based on its rotation
            const followOffsetX = Math.sin(playerShip.rotation) * -followDistance + Math.cos(playerShip.rotation) * followSide;
            const followOffsetZ = Math.cos(playerShip.rotation) * -followDistance - Math.sin(playerShip.rotation) * followSide;
            
            // Set camera position
            window.camera.position.set(
                playerShip.position.x + followOffsetX,
                playerShip.position.y + followHeight,
                playerShip.position.z + followOffsetZ
            );
            
            // Look slightly above the ship to see more of the horizon
            const lookAtPoint = playerShip.position.clone();
            lookAtPoint.y += 8; // Look slightly above the ship
            window.camera.lookAt(lookAtPoint);
            break;
            
        case 'cockpit':
            // First-person/cockpit view
            const cockpitHeight = 5; // Height above the ship deck
            const cockpitForward = 5; // Distance forward from ship center
            
            // Calculate position at the cockpit
            const cockpitOffsetX = Math.sin(playerShip.rotation) * cockpitForward;
            const cockpitOffsetZ = Math.cos(playerShip.rotation) * cockpitForward;
            
            // Set camera position
            window.camera.position.set(
                playerShip.position.x + cockpitOffsetX,
                playerShip.position.y + cockpitHeight,
                playerShip.position.z + cockpitOffsetZ
            );
            
            // Look in the direction the ship is facing
            const lookAtX = playerShip.position.x + Math.sin(playerShip.rotation) * 100;
            const lookAtZ = playerShip.position.z + Math.cos(playerShip.rotation) * 100;
            window.camera.lookAt(new THREE.Vector3(lookAtX, playerShip.position.y + cockpitHeight, lookAtZ));
            break;
            
        case 'top':
            // Modified top-down view with angle
            const topHeight = 120; // Height above the ship
            const topDistance = 80; // Distance behind the ship
            
            // Calculate position above and behind the ship
            const topOffsetX = Math.sin(playerShip.rotation) * -topDistance;
            const topOffsetZ = Math.cos(playerShip.rotation) * -topDistance;
            
            // Set camera position
            window.camera.position.set(
                playerShip.position.x + topOffsetX,
                playerShip.position.y + topHeight,
                playerShip.position.z + topOffsetZ
            );
            
            // Look at the ship
            window.camera.lookAt(playerShip.position);
            break;
    }
}

// Make functions available globally
window.initControls = initControls;
window.updatePlayerControls = updatePlayerControls;
window.activateTurboBoost = activateTurboBoost;
window.createTurboBoostEffect = createTurboBoostEffect; 