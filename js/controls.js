// Key states
const keyStates = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false
};

// Firing cooldown
let lastFireTime = 0;
const fireCooldown = 0.3; // seconds

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
            keyStates.fire = true;
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
    }
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
    
    // Handle movement
    if (keyStates.forward) {
        playerShip.moveForward();
    } else if (keyStates.backward) {
        playerShip.moveBackward();
    } else {
        playerShip.stopMoving();
    }
    
    // Handle turning
    if (keyStates.left) {
        playerShip.turnLeft();
    }
    
    if (keyStates.right) {
        playerShip.turnRight();
    }
    
    // Handle firing
    if (keyStates.fire) {
        const currentTime = performance.now() / 1000;
        if (currentTime - lastFireTime >= fireCooldown) {
            window.fireProjectile(playerShip);
            lastFireTime = currentTime;
        }
    }
    
    // Update camera to follow player
    updateCameraPosition(playerShip);
    
    // Debug output to console if controls are active
    if (window.debugControls) {
        console.log("Control states:", keyStates);
        console.log("Ship speed:", playerShip.speed);
    }
}

// Update camera position to follow player
function updateCameraPosition(playerShip) {
    if (!playerShip || !playerShip.isLoaded) return;
    
    // Position camera behind and above the ship
    const offset = new THREE.Vector3(0, 30, 80);
    offset.applyEuler(new THREE.Euler(0, playerShip.model.rotation.y, 0));
    
    const targetPosition = playerShip.model.position.clone().add(offset);
    
    // Smoothly move camera to target position
    window.camera.position.lerp(targetPosition, 0.05);
    
    // Make camera look at the ship
    window.camera.lookAt(playerShip.model.position);
}

// Make functions available globally
window.initControls = initControls;
window.updatePlayerControls = updatePlayerControls;
window.keyStates = keyStates; 