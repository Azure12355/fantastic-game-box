document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('racerCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('highScore');
    const speedUiDisplay = document.getElementById('speedDisplay');
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const startButton = document.getElementById('startButton');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverText = document.getElementById('gameOverText');
    const finalScoreDisplay = document.getElementById('finalScore');
    const restartButton = document.getElementById('restartButton');
    // Control Buttons
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');

    // --- Game Constants ---
    const LANE_COUNT = 3;
    const ROAD_WIDTH_PERCENT = 0.75; // Percentage of canvas width for the road
    const GRASS_WIDTH_PERCENT = (1 - ROAD_WIDTH_PERCENT) / 2;
    const INITIAL_SPEED = 2.5;
    const MAX_SPEED = 18;
    const SPEED_INCREMENT = 0.0015;
    const OBSTACLE_SPAWN_INTERVAL_INITIAL = 130; // Frames initially
    const ROAD_LINE_HEIGHT_INITIAL = 35; // Base height for scaling
    const ROAD_LINE_GAP_INITIAL = 25;    // Base gap for scaling
    const RUMBLE_STRIP_HEIGHT_INITIAL = 18; // Base height for scaling
    const RUMBLE_STRIP_GAP_INITIAL = 12;    // Base gap for scaling
    const REFERENCE_HEIGHT = 600; // Reference canvas height for scaling speed/features

    // --- Game State Variables ---
    let gameSpeed = 0;
    let obstacleSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
    let obstacleSpawnTimer = 0;
    let playerCar = { width: 0, height: 0, lane: 1, x: 0, y: 0, /* Colors fetched below */ };
    let obstacles = [];
    let roadLines = [];
    let rumbleStrips = [];
    let score = 0;
    let highScore = 0;
    let animationFrameId;
    let isGameOver = true;
    // Dynamic Size Variables
    let CANVAS_WIDTH, CANVAS_HEIGHT;
    let LANE_WIDTH, ROAD_WIDTH_ACTUAL, GRASS_WIDTH_ACTUAL;
    let OBSTACLE_WIDTH, OBSTACLE_HEIGHT;
    let roadLineHeight, roadLineGap, rumbleStripHeight, rumbleStripGap;

    // Fetch Colors from CSS Variables
    function fetchColors() {
        playerCar.bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--player-car-body-color').trim() || '#00f5d4';
        playerCar.windowColor = getComputedStyle(document.documentElement).getPropertyValue('--player-car-window-color').trim() || '#10101f';
        playerCar.lightsColor = getComputedStyle(document.documentElement).getPropertyValue('--player-car-lights-color').trim() || '#ffffff';
    }
    const OBSTACLE_BODY_COLORS = [ /* Fetched dynamically */ ];
    let OBSTACLE_WINDOW_COLOR;

    function fetchObstacleColors() {
         OBSTACLE_BODY_COLORS.length = 0; // Clear existing
         OBSTACLE_BODY_COLORS.push(getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-body-color-1').trim() || '#ff8c00');
         OBSTACLE_BODY_COLORS.push(getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-body-color-2').trim() || '#9d00ff');
         OBSTACLE_BODY_COLORS.push(getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-body-color-3').trim() || '#e0e0e0');
         OBSTACLE_WINDOW_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-window-color').trim() || '#181818';
    }


    // --- Resizing and Calculation ---
    function resizeCanvas() {
        const screenContainer = document.getElementById('gameScreenContainer');
        if (!screenContainer) return; // Exit if container not found

        const containerStyle = getComputedStyle(screenContainer);
        const newWidth = parseFloat(containerStyle.width);
        const newHeight = parseFloat(containerStyle.height);

        if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
            console.warn("Invalid container dimensions for canvas:", newWidth, newHeight);
            return; // Don't resize if dimensions are invalid
        }

        CANVAS_WIDTH = newWidth;
        CANVAS_HEIGHT = newHeight;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        console.log(`Canvas resized to: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);

        calculateSizes(); // Recalculate all other sizes based on new canvas dimensions
    }

    function calculateSizes() {
        // Canvas dimensions are now set by resizeCanvas()
        if (!CANVAS_WIDTH || !CANVAS_HEIGHT) return; // Ensure canvas dimensions are valid

        ROAD_WIDTH_ACTUAL = CANVAS_WIDTH * ROAD_WIDTH_PERCENT;
        GRASS_WIDTH_ACTUAL = CANVAS_WIDTH * GRASS_WIDTH_PERCENT;
        LANE_WIDTH = ROAD_WIDTH_ACTUAL / LANE_COUNT;

        // Scale car size based on lane width, but also consider canvas height?
        // Let's keep it relative to lane width for simplicity, maybe adjust factor slightly.
        playerCar.width = LANE_WIDTH * 0.38; // Slightly larger factor?
        playerCar.height = playerCar.width * 1.9;
        // Ensure player car Y position is always relative to the *current* canvas height
        playerCar.y = CANVAS_HEIGHT - playerCar.height - (CANVAS_HEIGHT * 0.05);

        OBSTACLE_WIDTH = LANE_WIDTH * 0.4; // Slightly larger obstacles?
        OBSTACLE_HEIGHT = OBSTACLE_WIDTH * 2.0;

        // Scale road features based on *current* canvas height relative to reference
        const heightScale = CANVAS_HEIGHT / REFERENCE_HEIGHT;
        roadLineHeight = ROAD_LINE_HEIGHT_INITIAL * heightScale;
        roadLineGap = ROAD_LINE_GAP_INITIAL * heightScale;
        rumbleStripHeight = RUMBLE_STRIP_HEIGHT_INITIAL * heightScale;
        rumbleStripGap = RUMBLE_STRIP_GAP_INITIAL * heightScale;
    }

    // --- Drawing Functions (Keep drawRect, drawCarShape, drawPlayer, drawObstacle as before) ---
    function drawRect(x, y, width, height, color) { /* ... Keep implementation ... */ ctx.fillStyle = color; ctx.fillRect(x, y, width, height); }
    function drawCarShape(x, y, width, height, bodyColor, windowColor, lightsColor, isPlayer = false) { /* ... Keep implementation ... */ const w = width; const h = height; ctx.fillStyle = bodyColor; ctx.fillRect(x, y + h * 0.1, w, h * 0.8); const cabinWidth = w * 0.85; const cabinX = x + (w - cabinWidth) / 2; ctx.fillRect(cabinX, y + h * 0.15, cabinWidth, h * 0.5); ctx.fillStyle = windowColor; ctx.beginPath(); ctx.moveTo(cabinX, y + h * 0.15); ctx.lineTo(cabinX + cabinWidth, y + h * 0.15); ctx.lineTo(x + w * 0.8, y + h * 0.45); ctx.lineTo(x + w * 0.2, y + h * 0.45); ctx.closePath(); ctx.fill(); ctx.fillRect(cabinX + cabinWidth * 0.05, y + h * 0.55, cabinWidth * 0.9, h * 0.08); if (isPlayer) { ctx.fillStyle = lightsColor; drawRect(x + w * 0.15, y + h * 0.12, w * 0.2, h * 0.08, lightsColor); drawRect(x + w * 0.65, y + h * 0.12, w * 0.2, h * 0.08, lightsColor); ctx.fillStyle = windowColor; ctx.fillRect(x + w*0.1, y + h * 0.05, w*0.8, h*0.03); } else { ctx.fillStyle = '#FF4444'; drawRect(x + w * 0.15, y + h * 0.75, w * 0.2, h * 0.07, '#FF4444'); drawRect(x + w * 0.65, y + h * 0.75, w * 0.2, h * 0.07, '#FF4444'); } }
    function drawPlayer() { /* ... Keep implementation, ensures X is calculated correctly ... */ if (!CANVAS_WIDTH || !LANE_WIDTH || !playerCar.width) return; playerCar.x = GRASS_WIDTH_ACTUAL + (playerCar.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (playerCar.width / 2); drawCarShape(playerCar.x, playerCar.y, playerCar.width, playerCar.height, playerCar.bodyColor, playerCar.windowColor, playerCar.lightsColor, true); }
    function drawObstacle(obstacle) { /* ... Keep implementation ... */ drawCarShape(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.bodyColor, obstacle.windowColor, '', false); }

    // --- Game Logic (Spawning, Updates, Collision) ---
    function spawnObstacle() {
        if (!CANVAS_WIDTH || !LANE_WIDTH || !OBSTACLE_WIDTH) return; // Need dimensions
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const x = GRASS_WIDTH_ACTUAL + (lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (OBSTACLE_WIDTH / 2);
        const bodyColor = OBSTACLE_BODY_COLORS[Math.floor(Math.random() * OBSTACLE_BODY_COLORS.length)];
        obstacles.push({ x: x, y: -OBSTACLE_HEIGHT, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT, lane: lane, bodyColor: bodyColor, windowColor: OBSTACLE_WINDOW_COLOR });
    }

    function updateObstacles() {
        if (!CANVAS_HEIGHT) return; // Need height for scaling/removal
        obstacleSpawnTimer++;
        if (obstacleSpawnTimer >= obstacleSpawnInterval) {
            spawnObstacle();
            obstacleSpawnTimer = 0;
            // Adjust spawn rate based on speed and maybe current height scale
            obstacleSpawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL_INITIAL / Math.max(1, (gameSpeed / INITIAL_SPEED)), 40);
        }

        const speedScale = CANVAS_HEIGHT / REFERENCE_HEIGHT; // How much faster/slower due to height
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y += gameSpeed * speedScale; // Scale vertical movement
            if (obstacles[i].y > CANVAS_HEIGHT) {
                obstacles.splice(i, 1);
            }
        }
    }

    function initRoadLines() {
        roadLines = [];
        if (!CANVAS_HEIGHT || !roadLineHeight) return;
        for (let y = -roadLineHeight; y < CANVAS_HEIGHT; y += roadLineHeight + roadLineGap) { // Start slightly above
            roadLines.push({ y: y });
        }
    }
     function initRumbleStrips() {
        rumbleStrips = [];
        if (!CANVAS_HEIGHT || !rumbleStripHeight) return;
        for (let y = -rumbleStripHeight; y < CANVAS_HEIGHT; y += rumbleStripHeight + rumbleStripGap) {
            rumbleStrips.push({ y: y, colorToggle: Math.random() > 0.5 });
        }
    }

    function drawRoad() {
        if (!CANVAS_WIDTH || !CANVAS_HEIGHT || !roadLineHeight || !rumbleStripHeight) return; // Need dimensions

        // Fetch colors dynamically in case CSS variables changed (unlikely but possible)
        const skyColor = getComputedStyle(document.documentElement).getPropertyValue('--sky-color').trim();
        const grassColor = getComputedStyle(document.documentElement).getPropertyValue('--grass-color').trim();
        const roadColor = getComputedStyle(document.documentElement).getPropertyValue('--road-color').trim();
        const markerColor = getComputedStyle(document.documentElement).getPropertyValue('--lane-marker-color').trim();
        const rumbleColor1 = getComputedStyle(document.documentElement).getPropertyValue('--rumble-strip-color-1').trim();
        const rumbleColor2 = getComputedStyle(document.documentElement).getPropertyValue('--rumble-strip-color-2').trim();

        // Draw Background Elements
        drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.35, skyColor); // Sky
        drawRect(0, 0, GRASS_WIDTH_ACTUAL, CANVAS_HEIGHT, grassColor); // Left Grass
        drawRect(GRASS_WIDTH_ACTUAL + ROAD_WIDTH_ACTUAL, 0, GRASS_WIDTH_ACTUAL, CANVAS_HEIGHT, grassColor); // Right Grass
        drawRect(GRASS_WIDTH_ACTUAL, 0, ROAD_WIDTH_ACTUAL, CANVAS_HEIGHT, roadColor); // Road

        // Draw Road Lines
        const markerWidth = Math.max(3, LANE_WIDTH * 0.025);
        const speedScale = CANVAS_HEIGHT / REFERENCE_HEIGHT;
        for (let i = roadLines.length - 1; i >= 0; i--) { // Iterate backwards for safe removal/reset
            roadLines[i].y += gameSpeed * speedScale;
            if (roadLines[i].y > CANVAS_HEIGHT) {
                 roadLines[i].y = -roadLineHeight - (roadLineGap * Math.random()); // Reset position above screen
            }
            // Draw markers if line is within view
            if (roadLines[i].y > -roadLineHeight && roadLines[i].y < CANVAS_HEIGHT && LANE_COUNT > 1) {
                 for (let j = 1; j < LANE_COUNT; j++) {
                    drawRect(GRASS_WIDTH_ACTUAL + (j * LANE_WIDTH) - markerWidth / 2, roadLines[i].y, markerWidth, roadLineHeight, markerColor);
                }
            }
        }

        // Draw Rumble Strips
        const rumbleWidth = Math.max(6, GRASS_WIDTH_ACTUAL * 0.08);
        for (let i = rumbleStrips.length - 1; i >= 0; i--) {
             rumbleStrips[i].y += gameSpeed * speedScale;
             if (rumbleStrips[i].y > CANVAS_HEIGHT) {
                rumbleStrips[i].y = -rumbleStripHeight - (rumbleStripGap * Math.random());
                rumbleStrips[i].colorToggle = !rumbleStrips[i].colorToggle;
            }
             if (rumbleStrips[i].y > -rumbleStripHeight && rumbleStrips[i].y < CANVAS_HEIGHT) {
                const currentColor = rumbleStrips[i].colorToggle ? rumbleColor1 : rumbleColor2;
                drawRect(GRASS_WIDTH_ACTUAL - rumbleWidth, rumbleStrips[i].y, rumbleWidth, rumbleStripHeight, currentColor);
                drawRect(GRASS_WIDTH_ACTUAL + ROAD_WIDTH_ACTUAL, rumbleStrips[i].y, rumbleWidth, rumbleStripHeight, currentColor);
            }
        }
    }

    function checkCollision() {
        // Use calculated player car dimensions
        if (!playerCar.height || !playerCar.y) return false;
        const carHitboxYOffset = playerCar.height * 0.1;
        const carEffectiveHeight = playerCar.height * 0.8;
        const playerTop = playerCar.y + carHitboxYOffset;
        const playerBottom = playerTop + carEffectiveHeight;

        for (let obstacle of obstacles) {
            // Check lane first
            if (playerCar.lane === obstacle.lane) {
                // Basic AABB collision check (Axis-Aligned Bounding Box)
                if (playerTop < obstacle.y + obstacle.height && playerBottom > obstacle.y) {
                    return true; // Collision detected
                }
            }
        }
        return false; // No collision
    }

    function updateScoreAndSpeed() {
        // Only increase score if game speed is positive
        if (gameSpeed > 0) {
             score += Math.floor(gameSpeed * 0.5); // Slower score increase
        }
        scoreDisplay.textContent = score;

        if (gameSpeed < MAX_SPEED) {
            // Slower acceleration, make it depend less directly on score
            gameSpeed += SPEED_INCREMENT * Math.max(1, gameSpeed / 4);
            gameSpeed = Math.min(gameSpeed, MAX_SPEED);
        }
        // Display speed level (1-based index for UI)
        const speedLevel = Math.max(1, Math.ceil((gameSpeed / MAX_SPEED) * 10)); // Example scaling
        speedUiDisplay.textContent = speedLevel;
    }


    function gameLoop() {
        if (isGameOver) return;

        // Clear canvas using the calculated dimensions
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawRoad();
        updateObstacles(); // Updates positions and spawns new ones
        obstacles.forEach(drawObstacle);
        drawPlayer();

        if (checkCollision()) {
            triggerGameOver();
        } else {
            updateScoreAndSpeed();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function triggerGameOver() {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        if (score > highScore) {
            highScore = score;
            try { localStorage.setItem('neonDriveXHighScoreMobile', highScore); } catch(e) {} // Use new key
            highScoreDisplay.textContent = highScore;
        }
        finalScoreDisplay.textContent = score;
        gameOverText.textContent = "CRASHED!"; // English text
        gameOverScreen.style.display = 'flex';
    }

    function resetGame() {
        // Fetch colors again in case CSS was reloaded/changed
        fetchColors();
        fetchObstacleColors();

        // Recalculate sizes based on current canvas dimensions
        // resizeCanvas() calls calculateSizes() internally
        resizeCanvas(); // This ensures all sizes are up-to-date before reset

        gameSpeed = INITIAL_SPEED;
        score = 0;
        playerCar.lane = 1; // Center lane
        obstacles = [];
        obstacleSpawnTimer = 0;
        obstacleSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
        isGameOver = false;

        // Initialize road features based on *current* calculated sizes
        initRoadLines();
        initRumbleStrips();

        // Update UI
        scoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore; // Display loaded/updated high score
        speedUiDisplay.textContent = 1; // Start at level 1

        // Hide overlays
        gameMessageScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
    }

    function startGame() {
        resetGame();
        // Ensure the loop starts only if reset was successful and game isn't over
        if (!isGameOver) {
            animationFrameId = requestAnimationFrame(gameLoop);
        } else {
             console.error("Failed to reset game state properly.");
        }
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    // Keyboard Input
    window.addEventListener('keydown', (e) => {
        if (isGameOver) {
            // Allow starting game with Enter/Space from overlays
            if (e.key === 'Enter' || e.key === ' ') {
                // Check which overlay is visible
                if (window.getComputedStyle(gameMessageScreen).display === 'flex' ||
                    window.getComputedStyle(gameOverScreen).display === 'flex') {
                    startGame();
                }
            }
            return; // Ignore game input when game is over
        }

        // Game controls
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            if (playerCar.lane > 0) playerCar.lane--;
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            if (playerCar.lane < LANE_COUNT - 1) playerCar.lane++;
        }
    });

    // Touch Input for Buttons
    function setupButtonTouch(buttonElement, action) {
         const handlePress = (e) => {
             e.preventDefault();
             if (!isGameOver) { // Only allow lane changes during game
                 action();
             }
             buttonElement.classList.add('active-touch');
        };
        const handleRelease = (e) => {
             e.preventDefault();
             buttonElement.classList.remove('active-touch');
        };
        // Use touchend for action to avoid repeated calls on hold
        buttonElement.addEventListener('touchstart', handlePress, { passive: false });
        buttonElement.addEventListener('touchend', (e) => {
            handleRelease(e); // Remove visual feedback
            // Action is already called in the game loop based on lane state
            // We just need to trigger the lane change once on press/tap
            // Let's perform the action on touchend for a tap-like feel
             if (!isGameOver) {
                 action();
             }
        });
        buttonElement.addEventListener('touchcancel', handleRelease);

        // Add click listener for mouse users as well
        buttonElement.addEventListener('click', () => {
             if (!isGameOver) {
                 action();
             }
        });
    }

    if (leftButton) setupButtonTouch(leftButton, () => { if (playerCar.lane > 0) playerCar.lane--; });
    if (rightButton) setupButtonTouch(rightButton, () => { if (playerCar.lane < LANE_COUNT - 1) playerCar.lane++; });


    // --- Window Resize Handling ---
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized or orientation changed");
            const oldPlayerLane = playerCar.lane; // Preserve lane

            resizeCanvas(); // This now recalculates all sizes

            playerCar.lane = oldPlayerLane; // Restore lane after resize
            // Update player's X position immediately based on new sizes
            if (!isGameOver && LANE_WIDTH && playerCar.width) {
                 playerCar.x = GRASS_WIDTH_ACTUAL + (playerCar.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (playerCar.width / 2);
            }

            // If game is over or not started, redraw the static UI
            if (isGameOver) {
                initializeUI(false); // Redraw UI without resetting score etc.
            } else {
                // If game is running/paused, re-init road lines based on new height
                initRoadLines();
                initRumbleStrips();
                 // Game loop will handle drawing based on new sizes
            }
        }, 150); // Debounce resize events
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // --- Initial UI Setup ---
    function initializeUI(isFirstLoad = true) {
        console.log("Initializing UI...");
        fetchColors(); // Get initial colors
        fetchObstacleColors();

        resizeCanvas(); // Set initial canvas size & calculate dependent sizes

        if (isFirstLoad) {
             try { highScore = localStorage.getItem('neonDriveXHighScoreMobile') || 0; } catch(e) { highScore = 0;} // Use new key
        }
        // Update UI elements
        highScoreDisplay.textContent = highScore;
        scoreDisplay.textContent = 0;
        speedUiDisplay.textContent = 0; // Show 0 speed initially
        messageText.textContent = "GET READY!";
        gameMessageScreen.style.display = 'flex';
        gameOverScreen.style.display = 'none';

        // Draw initial preview on canvas
        if (CANVAS_WIDTH > 0 && CANVAS_HEIGHT > 0) {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            initRoadLines(); // Need road lines data for drawRoad
            initRumbleStrips();
            drawRoad();
            playerCar.lane = 1; // Center lane for preview
            drawPlayer(); // Draw player in initial position
        } else {
             console.warn("Canvas dimensions not ready for initial draw.");
        }
        console.log("Initial UI drawn.");
    }

    // --- Particles Setup --- (Keep as is)
    if (window.particlesJS) { const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(); const buttonColor = getComputedStyle(document.documentElement).getPropertyValue('--button-main-color').trim(); particlesJS('particles-js-racer', { "particles": { "number": { "value": 70, "density": { "enable": true, "value_area": 800 } }, "color": { "value": [accentColor, buttonColor, "#ffffff"] }, "shape": { "type": ["line", "triangle"], "stroke": { "width": 0, "color": "#000000" }, }, "opacity": { "value": 0.3, "random": true, "anim": { "enable": true, "speed": 0.2, "opacity_min": 0.05, "sync": false } }, "size": { "value": 4, "random": true, "anim": { "enable": false } }, "line_linked": { "enable": false }, "move": { "enable": true, "speed": 1.5, "direction": "bottom", "random": false, "straight": true, "out_mode": "out", "bounce": false, "attract": { "enable": false } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": false }, "onclick": { "enable": false }, "resize": true }, "modes": {} }, "retina_detect": true }); } else { console.warn("Particles.js library not loaded."); }


    // --- Start ---
    initializeUI(true); // Initial setup on page load

}); // End DOMContentLoaded