// Use the global THREE object instead of imports
// Game state
const gameState = {
    score: 0,
    health: 100,
    isLoading: true,
    ships: [],
    projectiles: [],
    seaObjects: [], // Add array for sea objects
    playerShip: null,
    enemySpawnTimer: 0,
    enemySpawnInterval: 10, // seconds
    seaObjectSpawnTimer: 0, // Add timer for sea objects
    seaObjectSpawnInterval: 2.5, // seconds - reduced from 5 seconds for more frequent spawns
    powerupSpawnTimer: 0, // Add timer for powerups
    powerupSpawnInterval: 15, // seconds - less frequent than other objects
    gameStarted: false,
    gameOver: false,
    fps: 0,
    lastFpsUpdate: 0,
    frameCount: 0,
    balloonsHit: 0,
    activePowerups: [], // Track active powerups
    serverStartTime: Date.now(),
    username: 'Player', // Default username
    mountainsGenerated: false, // Track if mountains have been generated
    shipTypes: ['standard', 'destroyer', 'battleship', 'cruiser', 'submarine', 'carrier'], // Available ship types
    shipTypeCounts: {}, // Track how many of each ship type are spawned
    initialShipsSpawned: false // Track if initial ships have been spawned
};

// DOM elements
const loginScreen = document.getElementById('login-screen');
const scoreStatValue = document.getElementById('score-stat-value');
const healthStatValue = document.getElementById('health-stat-value');
const canvas = document.getElementById('game-canvas');

// Three.js variables
let scene, camera, renderer, water, sun, sky, controls;
let clock = new THREE.Clock();
let lastFrameTime = performance.now() / 1000;
let mountainGenerator; // Mountain generator

// Make variables available globally first
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.gameState = gameState;
window.updateUI = updateUI;
window.gameOver = gameOver;

// Initialize the game
init();

function init() {
    // Create scene
    scene = new THREE.Scene();
    window.scene = scene; // Update global reference
    
    // Create camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.set(0, 25, 100);
    camera.lookAt(0, 10, 0); // Look slightly above the horizon
    window.camera = camera; // Update global reference
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    window.renderer = renderer; // Update global reference
    
    // Add orbit controls for development
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.minDistance = 30;
    controls.maxDistance = 500;
    controls.enabled = false; // Disable orbit controls when game starts
    
    // Create lighting
    createLighting();
    
    // Create environment (sky and water)
    createEnvironment();
    
    // Initialize mountain generator
    mountainGenerator = new MountainGenerator(scene);
    window.mountainGenerator = mountainGenerator; // Make available globally
    
    // Initialize login screen
    initLoginScreen();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start the game loop
    lastFrameTime = performance.now() / 1000;
    animate();
}

function initLoginScreen() {
    const usernameInput = document.getElementById('username-input');
    const joinGameBtn = document.getElementById('join-game-btn');
    
    // Focus on the username input
    usernameInput.focus();
    
    // Handle join game button click
    joinGameBtn.addEventListener('click', () => {
        startGame();
    });
    
    // Handle enter key press in username input
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    function startGame() {
        // Get username from input
        const username = usernameInput.value.trim();
        
        // Set default username if empty
        if (username) {
            gameState.username = username;
        }
        
        // Create player ship
        gameState.playerShip = createPlayerShip();
        gameState.playerShip.init(); // Initialize the ship now that scene exists
        
        // Add username label above player ship
        createUsernameLabel(gameState.playerShip, gameState.username);
        
        // Initialize controls
        initControls(gameState.playerShip);
        
        // Generate mountains
        generateMountains();
        
        // Hide login screen
        loginScreen.style.opacity = 0;
        
        setTimeout(() => {
            loginScreen.style.display = 'none';
            gameState.isLoading = false;
            gameState.gameStarted = true;
            
            // Disable orbit controls when game starts
            controls.enabled = false;
        }, 1000);
    }
}

function generateMountains() {
    // Generate mountains if not already generated
    if (!gameState.mountainsGenerated) {
        mountainGenerator.generate();
        
        // Add standalone rock formations distributed across different sectors
        const rockFormations = 12 + Math.floor(Math.random() * 6); // Increase to 12-18 rock formations
        
        // Create rock formations in different sectors to ensure even distribution
        const sectorsPerRock = Math.floor(mountainGenerator.sectorCount / rockFormations);
        let remainingSectors = mountainGenerator.sectorCount - (sectorsPerRock * rockFormations);
        
        for (let i = 0; i < rockFormations; i++) {
            // Create rock formation
            mountainGenerator.createStandaloneRocks();
            
            // Add extra rock formations in some sectors if we have remaining sectors
            if (remainingSectors > 0 && Math.random() < 0.5) {
                mountainGenerator.createStandaloneRocks();
                remainingSectors--;
            }
        }
        
        // Add additional rock formations specifically in the forward direction (positive Z-axis)
        // This ensures there are always rocks visible ahead of the player
        const forwardRockFormations = 5 + Math.floor(Math.random() * 3); // 5-8 additional forward rock formations
        
        for (let i = 0; i < forwardRockFormations; i++) {
            // Create rock formation in forward direction
            // We'll use the existing createStandaloneRocks method, but the game
            // will start with the player facing the positive Z direction, so
            // more rocks in that area will ensure the player sees mountains ahead
            mountainGenerator.createStandaloneRocks();
        }
        
        gameState.mountainsGenerated = true;
    }
}

function createUsernameLabel(ship, username) {
    // Create a div for the username
    const usernameLabel = document.createElement('div');
    usernameLabel.className = 'username-label';
    usernameLabel.textContent = username;
    usernameLabel.style.position = 'absolute';
    usernameLabel.style.color = 'white';
    usernameLabel.style.fontWeight = 'bold';
    usernameLabel.style.textShadow = '0 0 5px #000, 0 0 5px #000';
    document.body.appendChild(usernameLabel);
    
    // Store the label in the ship object
    ship.usernameLabel = usernameLabel;
    
    // Update the label position in the animation loop
    updateUsernameLabel(ship);
}

function updateUsernameLabel(ship) {
    if (!ship || !ship.usernameLabel || !ship.isLoaded) return;
    
    // Calculate position above the ship
    const position = ship.position.clone();
    position.y += 15; // Position above the ship
    
    // Convert 3D position to screen coordinates
    const screenPosition = position.clone().project(camera);
    
    // Convert to CSS coordinates
    const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPosition.y * 0.5) + 0.5) * window.innerHeight;
    
    // Update label position
    ship.usernameLabel.style.left = x + 'px';
    ship.usernameLabel.style.top = y + 'px';
    ship.usernameLabel.style.transform = 'translate(-50%, -50%)';
}

function createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Directional light (sun)
    sun = new THREE.Vector3();
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

function createEnvironment() {
    // Sky
    sky = new THREE.Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    // Sun position parameters
    const parameters = {
        elevation: 2,
        azimuth: 180
    };
    
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    
    sun.setFromSphericalCoords(1, phi, theta);
    
    skyUniforms['sunPosition'].value.copy(sun);
    
    // Water
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    water = new THREE.Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg', function(texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    
    // Update the water sun direction
    const waterUniforms = water.material.uniforms;
    waterUniforms['sunDirection'].value.copy(sun).normalize();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const currentTime = performance.now() / 1000;
    const delta = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // Update FPS counter
    gameState.frameCount++;
    if (currentTime - gameState.lastFpsUpdate >= 1.0) { // Update every second
        gameState.fps = Math.round(gameState.frameCount / (currentTime - gameState.lastFpsUpdate));
        gameState.frameCount = 0;
        gameState.lastFpsUpdate = currentTime;
        
        // Update game stats
        updateGameStats();
    }
    
    // Update game if started and not game over
    if (gameState.gameStarted && !gameState.gameOver) {
        updateGame(delta);
    }
    
    // Update username label position
    if (gameState.playerShip && gameState.playerShip.usernameLabel) {
        updateUsernameLabel(gameState.playerShip);
    }
    
    // Update mountains animation
    if (gameState.mountainsGenerated && mountainGenerator) {
        mountainGenerator.update(delta);
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    // Update water
    water.material.uniforms['time'].value += 1.0 / 60.0;
}

// Game update function
function updateGame(delta) {
    // Skip if game is not started or is over
    if (!gameState.gameStarted || gameState.gameOver) return;
    
    // Update player ship
    if (gameState.playerShip && gameState.playerShip.isLoaded) {
        // Update player controls
        updatePlayerControls(gameState.playerShip, delta);
        
        // Update camera position
        updateCameraPosition(gameState.playerShip);
        
        // Update username label position
        updateUsernameLabel(gameState.playerShip);
    }
    
    // Spawn initial ships if not already done
    if (!gameState.initialShipsSpawned && gameState.playerShip && gameState.playerShip.isLoaded) {
        spawnMultipleShips(30); // Spawn 30 ships of different types
    }
    
    // Update enemy spawn timer
    gameState.enemySpawnTimer += delta;
    if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
        spawnEnemy();
        gameState.enemySpawnTimer = 0;
    }
    
    // Update all ships
    if (window.debugControls) {
        console.log("Updating", gameState.ships.length, "ships");
    }
    
    for (let i = 0; i < gameState.ships.length; i++) {
        gameState.ships[i].update(delta);
    }
    
    // Update projectiles
    window.updateProjectiles(delta);
    
    // Update sea objects
    window.updateSeaObjects(delta);
    
    // Update enemy AI
    window.updateEnemyAI(delta);
    
    // Spawn sea objects
    gameState.seaObjectSpawnTimer += delta;
    if (gameState.seaObjectSpawnTimer >= gameState.seaObjectSpawnInterval) {
        spawnRandomSeaObject();
        gameState.seaObjectSpawnTimer = 0;
    }
    
    // Spawn powerups
    gameState.powerupSpawnTimer += delta;
    if (gameState.powerupSpawnTimer >= gameState.powerupSpawnInterval) {
        spawnPowerup();
        gameState.powerupSpawnTimer = 0;
    }
    
    // Update UI
    updateUI();
}

function spawnEnemy() {
    // Spawn enemy at random position around the player
    if (gameState.playerShip && gameState.playerShip.isLoaded) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 200; // Between 300 and 500 units away
        
        const x = gameState.playerShip.position.x + Math.sin(angle) * distance;
        const z = gameState.playerShip.position.z + Math.cos(angle) * distance;
        
        const enemy = createEnemyShip(new THREE.Vector3(x, 0, z));
        enemy.init(); // Initialize the enemy ship
    }
}

// Function to spawn multiple ships of different types
function spawnMultipleShips(count = 30) {
    if (!gameState.playerShip || !gameState.playerShip.isLoaded) return;
    
    console.log("Spawning multiple ships of different types...");
    
    // Reset ship type counts
    gameState.shipTypeCounts = {};
    gameState.shipTypes.forEach(type => {
        gameState.shipTypeCounts[type] = 0;
    });
    
    // Calculate how many of each type to spawn (equal distribution)
    const shipsPerType = Math.floor(count / gameState.shipTypes.length);
    const remainder = count % gameState.shipTypes.length;
    
    // Spawn ships in a grid pattern around the map
    const mapRadius = 1500; // Large area around the player
    const gridSize = Math.ceil(Math.sqrt(count)); // Calculate grid dimensions
    
    let shipIndex = 0;
    
    // Spawn equal numbers of each ship type
    for (let type of gameState.shipTypes) {
        // Determine how many of this type to spawn
        let typeCount = shipsPerType;
        if (remainder > 0 && gameState.shipTypeCounts[type] < shipsPerType) {
            typeCount++;
        }
        
        for (let i = 0; i < typeCount; i++) {
            // Calculate position in a grid pattern
            const row = Math.floor(shipIndex / gridSize);
            const col = shipIndex % gridSize;
            
            // Convert grid position to world coordinates
            const gridSpacing = (mapRadius * 2) / gridSize;
            const x = -mapRadius + col * gridSpacing + Math.random() * 100 - 50;
            const z = -mapRadius + row * gridSpacing + Math.random() * 100 - 50;
            
            // Create the ship
            const position = new THREE.Vector3(x, 0, z);
            const enemy = createSpecificEnemyShip(position, type);
            enemy.init();
            
            // Track the ship type
            gameState.shipTypeCounts[type] = (gameState.shipTypeCounts[type] || 0) + 1;
            
            shipIndex++;
        }
    }
    
    console.log("Spawned ships by type:", gameState.shipTypeCounts);
    gameState.initialShipsSpawned = true;
}

function gameOver() {
    gameState.gameOver = true;
    
    // Create game over screen
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    gameOverScreen.innerHTML = `
        <div class="game-over-content">
            <h1>YOU DIED</h1>
            <p>Your score: ${gameState.score}</p>
            <button id="restart-btn">START NEW GAME</button>
        </div>
    `;
    
    gameOverScreen.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        animation: fadeIn 2s ease-in-out;
    `;
    
    const gameOverContent = gameOverScreen.querySelector('.game-over-content');
    gameOverContent.style.cssText = `
        text-align: center;
        color: white;
    `;
    
    const gameOverTitle = gameOverScreen.querySelector('h1');
    gameOverTitle.style.cssText = `
        font-size: 5rem;
        margin-bottom: 1rem;
        color: #ff0000;
        text-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
        animation: pulseText 2s infinite;
    `;
    
    const scoreText = gameOverScreen.querySelector('p');
    scoreText.style.cssText = `
        font-size: 2rem;
        margin-bottom: 2rem;
        color: #ffffff;
    `;
    
    const restartBtn = gameOverScreen.querySelector('#restart-btn');
    restartBtn.style.cssText = `
        padding: 15px 30px;
        font-size: 1.5rem;
        background-color: #4a9ff5;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(74, 159, 245, 0.7);
        transition: all 0.3s ease;
        margin-top: 20px;
    `;
    
    // Add hover effect for the button
    restartBtn.addEventListener('mouseover', () => {
        restartBtn.style.backgroundColor = '#2a7fd5';
        restartBtn.style.transform = 'scale(1.05)';
    });
    
    restartBtn.addEventListener('mouseout', () => {
        restartBtn.style.backgroundColor = '#4a9ff5';
        restartBtn.style.transform = 'scale(1)';
    });
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pulseText {
            0% { text-shadow: 0 0 20px rgba(255, 0, 0, 0.7); }
            50% { text-shadow: 0 0 40px rgba(255, 0, 0, 1); }
            100% { text-shadow: 0 0 20px rgba(255, 0, 0, 0.7); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(gameOverScreen);
    
    // Add restart button functionality
    restartBtn.addEventListener('click', () => {
        // Remove game over screen
        document.body.removeChild(gameOverScreen);
        
        // Reset game state
        resetGame();
    });
}

function resetGame() {
    // Clear existing ships and projectiles
    while (gameState.ships.length > 0) {
        // Remove username label if it exists
        if (gameState.ships[0].usernameLabel) {
            document.body.removeChild(gameState.ships[0].usernameLabel);
            gameState.ships[0].usernameLabel = null;
        }
        gameState.ships[0].destroy();
    }
    
    while (gameState.projectiles.length > 0) {
        gameState.projectiles[0].destroy();
    }
    
    // Clear existing sea objects
    while (gameState.seaObjects.length > 0) {
        gameState.seaObjects[0].destroy();
    }
    
    // Reset game state
    gameState.score = 0;
    gameState.health = 100;
    gameState.gameOver = false;
    gameState.enemySpawnTimer = 0;
    gameState.enemySpawnInterval = 10;
    gameState.seaObjectSpawnTimer = 0;
    gameState.seaObjectSpawnInterval = 2.5;
    gameState.powerupSpawnTimer = 0;
    gameState.powerupSpawnInterval = 15;
    gameState.balloonsHit = 0;
    
    // Create new player ship
    gameState.playerShip = createPlayerShip();
    gameState.playerShip.init(); // Initialize the ship
    
    // Add username label above player ship
    createUsernameLabel(gameState.playerShip, gameState.username);
    
    // Update UI
    updateUI();
}

// Function to update game stats panel
function updateGameStats() {
    // Update FPS
    document.getElementById('fps-value').textContent = gameState.fps;
    
    // Update server time (minutes:seconds since start)
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - gameState.serverStartTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    document.getElementById('time-value').textContent = `${minutes}:${seconds}`;
    
    // Update players online (random number between 15-25 for effect)
    document.getElementById('players-value').textContent = Math.floor(Math.random() * 11) + 15;
    
    // Update balloons hit
    document.getElementById('balloons-value').textContent = `${gameState.balloonsHit}/100`;
    
    // Update ship stats if player ship exists
    if (gameState.playerShip && gameState.playerShip.isLoaded) {
        // Speed in knots (1 unit = 1 knot for simplicity)
        const speed = Math.abs(Math.round(gameState.playerShip.speed * 10));
        document.getElementById('speed-value').textContent = `${speed} kts`;
        
        // Throttle (percentage of max speed)
        const throttlePercent = Math.round((Math.abs(gameState.playerShip.targetSpeed) / gameState.playerShip.maxSpeed) * 100);
        document.getElementById('throttle-value').textContent = `${throttlePercent}%`;
        
        // Show if ship is slowed down
        if (gameState.playerShip.maxSpeed < gameState.playerShip.originalMaxSpeed) {
            document.getElementById('speed-value').style.color = '#00AAFF';
            document.getElementById('throttle-value').style.color = '#00AAFF';
        } else if (gameState.playerShip.maxSpeed > gameState.playerShip.originalMaxSpeed) {
            // Show speed boost
            document.getElementById('speed-value').style.color = '#FFFF00';
            document.getElementById('throttle-value').style.color = '#FFFF00';
        } else {
            document.getElementById('speed-value').style.color = '';
            document.getElementById('throttle-value').style.color = '';
        }
        
        // Turn rate (direction and percentage)
        const turnDirection = gameState.playerShip.currentTurnRate > 0 ? 'LEFT' : gameState.playerShip.currentTurnRate < 0 ? 'RIGHT' : 'CENTER';
        const turnPercent = Math.round((Math.abs(gameState.playerShip.currentTurnRate) / gameState.playerShip.maxTurnRate) * 100);
        
        // Update turn indicator if it exists
        const turnElement = document.getElementById('turn-value');
        if (turnElement) {
            turnElement.textContent = turnPercent > 0 ? `${turnDirection} ${turnPercent}%` : 'CENTER';
        }
        
        // Update active powerups
        updateActivePowerupsUI();
    }
}

// Function to update active powerups in the UI
function updateActivePowerupsUI() {
    const powerupsElement = document.getElementById('powerups-value');
    if (!powerupsElement) return;
    
    const activePowerups = [];
    
    // Check for active powerups
    if (gameState.playerShip) {
        if (gameState.playerShip.speedBoostTimeout) {
            activePowerups.push('⚡ SPEED');
        }
        if (gameState.playerShip.shieldTimeout) {
            activePowerups.push('🛡️ SHIELD');
        }
        if (gameState.playerShip.rapidFireTimeout) {
            activePowerups.push('🔥 RAPID FIRE');
        }
    }
    
    // Update the UI
    if (activePowerups.length > 0) {
        powerupsElement.textContent = activePowerups.join(' | ');
        powerupsElement.style.display = 'block';
    } else {
        powerupsElement.textContent = 'NONE';
        powerupsElement.style.display = 'block';
    }
}

// Function to update game UI
function updateUI() {
    // Update score and health in the game stats panel
    scoreStatValue.textContent = gameState.score;
    
    // Update health (remove % sign since it's added in updateGameStats)
    const healthPercent = gameState.playerShip ? gameState.playerShip.health : 100;
    healthStatValue.textContent = `${healthPercent}%`;
    
    // Also update all other game stats
    updateGameStats();
}

// Function to spawn a random sea object
function spawnRandomSeaObject() {
    // Skip if player ship doesn't exist or isn't loaded
    if (!gameState.playerShip || !gameState.playerShip.isLoaded) return;
    
    // Randomly choose between bomb and skittle with higher chance for bombs
    const type = Math.random() < 0.5 ? 'bomb' : 'skittle'; // Increased bomb chance from 0.3 to 0.5
    
    // Spawn the sea object
    window.spawnSeaObject(type);
}

// Function to spawn a powerup
function spawnPowerup() {
    // Skip if player ship doesn't exist or isn't loaded
    if (!gameState.playerShip || !gameState.playerShip.isLoaded) return;
    
    // Spawn a powerup
    window.spawnSeaObject('powerup');
}

// Make functions and variables available globally
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.gameState = gameState;
window.updateUI = updateUI;
window.updateActivePowerupsUI = updateActivePowerupsUI; 