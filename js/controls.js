// Key states
const keyStates = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false,
    superTurbo: false,
    toggleCamera: false,
    muteSound: false
};

// Firing cooldown
let lastFireTime = 0;
const fireCooldown = 0.3; // seconds

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
        case 'f':
            keyStates.fire = true;
            break;
        // New controls
        case 'shift':
            if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                keyStates.superTurbo = true;
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
            keyStates.fire = false;
            break;
        // New controls
        case 'shift':
            if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                keyStates.superTurbo = false;
            }
            break;
        case 'v':
            keyStates.toggleCamera = false;
            break;
        case 'm':
            keyStates.muteSound = false;
            break;
    }
}

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
        }, { passive: false });
        
        // Backward button
        backwardBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.backward = true;
        }, { passive: false });
        
        backwardBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.backward = false;
        }, { passive: false });
        
        // Left button
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.left = true;
        }, { passive: false });
        
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.left = false;
        }, { passive: false });
        
        // Right button
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.right = true;
        }, { passive: false });
        
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default behavior
            keyStates.right = false;
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
            superTurbo: keyStates.superTurbo
        });
    }
    
    // Apply super turbo if active
    const speedMultiplier = keyStates.superTurbo ? 2.0 : 1.0;
    
    // Handle movement
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
    
    // Handle turning
    if (keyStates.left) {
        playerShip.turnLeft(speedMultiplier);
    }
    
    if (keyStates.right) {
        playerShip.turnRight(speedMultiplier);
    }
    
    // Handle firing
    if (keyStates.fire) {
        const currentTime = performance.now() / 1000;
        if (currentTime - lastFireTime >= fireCooldown) {
            window.fireProjectile(playerShip);
            lastFireTime = currentTime;
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
            // Standard follow camera
            const followDistance = 50; // Distance behind the ship
            const followHeight = 30;   // Height above the ship
            
            // Calculate position behind the ship based on its rotation
            const followOffsetX = Math.sin(playerShip.rotation) * -followDistance;
            const followOffsetZ = Math.cos(playerShip.rotation) * -followDistance;
            
            // Set camera position
            window.camera.position.set(
                playerShip.position.x + followOffsetX,
                playerShip.position.y + followHeight,
                playerShip.position.z + followOffsetZ
            );
            
            // Look at the ship
            window.camera.lookAt(playerShip.position);
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
            // Top-down view
            const topHeight = 100; // Height above the ship
            
            // Set camera position directly above the ship
            window.camera.position.set(
                playerShip.position.x,
                playerShip.position.y + topHeight,
                playerShip.position.z
            );
            
            // Look down at the ship
            window.camera.lookAt(playerShip.position);
            break;
    }
}

// Make functions available globally
window.initControls = initControls;
window.updatePlayerControls = updatePlayerControls;
window.keyStates = keyStates; 