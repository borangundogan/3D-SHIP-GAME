// Use the global THREE object instead of imports
// Game state
const gameState = {
    score: 0,
    health: 100,
    isLoading: true,
    ships: [],
    projectiles: [],
    playerShip: null,
    enemySpawnTimer: 0,
    enemySpawnInterval: 10, // seconds
    gameStarted: false,
    gameOver: false,
    fps: 0,
    lastFpsUpdate: 0,
    frameCount: 0,
    balloonsHit: 0,
    serverStartTime: Date.now()
};

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const scoreStatValue = document.getElementById('score-stat-value');
const healthStatValue = document.getElementById('health-stat-value');
const canvas = document.getElementById('game-canvas');

// Three.js variables
let scene, camera, renderer, water, sun, sky, controls;
let clock = new THREE.Clock();
let lastFrameTime = performance.now() / 1000;

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
    
    // Create player ship
    gameState.playerShip = createPlayerShip();
    gameState.playerShip.init(); // Initialize the ship now that scene exists
    
    // Initialize controls
    initControls(gameState.playerShip);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Add start game button
    createStartGameButton();
    
    // Start the game loop
    lastFrameTime = performance.now() / 1000;
    animate();
}

function createStartGameButton() {
    const startButton = document.createElement('button');
    startButton.id = 'start-game-btn';
    startButton.textContent = 'START GAME';
    startButton.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 15px 30px;
        font-size: 24px;
        background-color: #4a9ff5;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 20;
        font-family: 'Arial', sans-serif;
        box-shadow: 0 0 20px rgba(74, 159, 245, 0.7);
    `;
    
    document.body.appendChild(startButton);
    
    startButton.addEventListener('click', () => {
        // Hide loading screen and start button
        loadingScreen.style.opacity = 0;
        startButton.style.display = 'none';
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            gameState.isLoading = false;
            gameState.gameStarted = true;
            
            // Disable orbit controls when game starts
            controls.enabled = false;
        }, 1000);
    });
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
    
    // Render scene
    renderer.render(scene, camera);
    
    // Update water
    water.material.uniforms['time'].value += 1.0 / 60.0;
}

// Game update function
function updateGame(delta) {
    // Debug output
    if (window.debugControls) {
        console.log("Game update frame, delta:", delta);
    }
    
    // Update player controls
    if (gameState.playerShip) {
        updatePlayerControls(gameState.playerShip, delta);
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
    
    // Update enemy AI
    window.updateEnemyAI(delta);
    
    // Spawn enemies
    gameState.enemySpawnTimer += delta;
    if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
        spawnEnemy();
        gameState.enemySpawnTimer = 0;
        // Make enemies spawn faster as the game progresses
        gameState.enemySpawnInterval = Math.max(3, gameState.enemySpawnInterval * 0.95);
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
        gameState.ships[0].destroy();
    }
    
    while (gameState.projectiles.length > 0) {
        gameState.projectiles[0].destroy();
    }
    
    // Reset game state
    gameState.score = 0;
    gameState.health = 100;
    gameState.gameOver = false;
    gameState.enemySpawnTimer = 0;
    gameState.enemySpawnInterval = 10;
    
    // Create new player ship
    gameState.playerShip = createPlayerShip();
    gameState.playerShip.init(); // Initialize the ship
    
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
        
        // Turn rate (direction and percentage)
        const turnDirection = gameState.playerShip.currentTurnRate > 0 ? 'LEFT' : gameState.playerShip.currentTurnRate < 0 ? 'RIGHT' : 'CENTER';
        const turnPercent = Math.round((Math.abs(gameState.playerShip.currentTurnRate) / gameState.playerShip.maxTurnRate) * 100);
        
        // Update turn indicator if it exists
        const turnElement = document.getElementById('turn-value');
        if (turnElement) {
            turnElement.textContent = turnPercent > 0 ? `${turnDirection} ${turnPercent}%` : 'CENTER';
        }
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

// Make functions and variables available globally
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.gameState = gameState;
window.updateUI = updateUI; 