document.addEventListener('DOMContentLoaded', () => {
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

    // Game Constants
    const LANE_COUNT = 3;
    let ROAD_WIDTH_PERCENT = 0.75; 
    let GRASS_WIDTH_PERCENT = (1 - ROAD_WIDTH_PERCENT) / 2;

    let gameSpeed = 0;
    const INITIAL_SPEED = 2.5; // Slightly slower start
    const MAX_SPEED = 18;
    const SPEED_INCREMENT = 0.0015; 
    const OBSTACLE_SPAWN_INTERVAL_INITIAL = 130; 
    let obstacleSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
    let obstacleSpawnTimer = 0;

    const playerCar = {
        width: 0, 
        height: 0,
        lane: 1, 
        x: 0,
        y: 0,
        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--player-car-body-color').trim(),
        windowColor: getComputedStyle(document.documentElement).getPropertyValue('--player-car-window-color').trim(),
        lightsColor: getComputedStyle(document.documentElement).getPropertyValue('--player-car-lights-color').trim()
    };

    let obstacles = [];
    const OBSTACLE_BODY_COLORS = [
        getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-body-color-1').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-body-color-2').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-body-color-3').trim(),
    ];
    const OBSTACLE_WINDOW_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--obstacle-car-window-color').trim();


    let roadLines = [];
    const ROAD_LINE_HEIGHT_INITIAL = 35; // Base height
    const ROAD_LINE_GAP_INITIAL = 25;    // Base gap
    let roadLineHeight = ROAD_LINE_HEIGHT_INITIAL;
    let roadLineGap = ROAD_LINE_GAP_INITIAL;


    let rumbleStrips = [];
    const RUMBLE_STRIP_HEIGHT_INITIAL = 18; // Base height
    const RUMBLE_STRIP_GAP_INITIAL = 12;    // Base gap
    let rumbleStripHeight = RUMBLE_STRIP_HEIGHT_INITIAL;
    let rumbleStripGap = RUMBLE_STRIP_GAP_INITIAL;


    let score = 0;
    let highScore = localStorage.getItem('neonDriveXHighScore') || 0; // Updated key
    let animationFrameId;
    let isGameOver = true;

    let CANVAS_WIDTH, CANVAS_HEIGHT;
    let LANE_WIDTH;
    let ROAD_WIDTH_ACTUAL;
    let GRASS_WIDTH_ACTUAL;
    let OBSTACLE_WIDTH, OBSTACLE_HEIGHT;

    function calculateSizes() {
        const screenContainer = document.getElementById('gameScreenContainer');
        CANVAS_WIDTH = screenContainer.clientWidth;
        CANVAS_HEIGHT = screenContainer.clientHeight;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        ROAD_WIDTH_ACTUAL = CANVAS_WIDTH * ROAD_WIDTH_PERCENT;
        GRASS_WIDTH_ACTUAL = CANVAS_WIDTH * GRASS_WIDTH_PERCENT;
        LANE_WIDTH = ROAD_WIDTH_ACTUAL / LANE_COUNT;

        // Reduced car size relative to lane width
        playerCar.width = LANE_WIDTH * 0.35; 
        playerCar.height = playerCar.width * 1.9; 
        playerCar.y = CANVAS_HEIGHT - playerCar.height - (CANVAS_HEIGHT * 0.05); // Lower on screen

        OBSTACLE_WIDTH = LANE_WIDTH * 0.4;
        OBSTACLE_HEIGHT = OBSTACLE_WIDTH * 2.0;

        // Scale road features with canvas height for perspective
        roadLineHeight = ROAD_LINE_HEIGHT_INITIAL * (CANVAS_HEIGHT / 600); // 600 is a reference height
        roadLineGap = ROAD_LINE_GAP_INITIAL * (CANVAS_HEIGHT / 600);
        rumbleStripHeight = RUMBLE_STRIP_HEIGHT_INITIAL * (CANVAS_HEIGHT / 600);
        rumbleStripGap = RUMBLE_STRIP_GAP_INITIAL * (CANVAS_HEIGHT / 600);
    }

    function drawRect(x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }

    function drawCarShape(x, y, width, height, bodyColor, windowColor, lightsColor, isPlayer = false) {
        const w = width;
        const h = height;

        // Main Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(x, y + h * 0.1, w, h * 0.8); // Main chassis slightly inset from top/bottom

        // Roof/Cabin (slightly narrower)
        const cabinWidth = w * 0.85;
        const cabinX = x + (w - cabinWidth) / 2;
        ctx.fillRect(cabinX, y + h * 0.15, cabinWidth, h * 0.5);
        
        // Windshield
        ctx.fillStyle = windowColor;
        ctx.beginPath();
        ctx.moveTo(cabinX, y + h * 0.15); // Top-left of cabin
        ctx.lineTo(cabinX + cabinWidth, y + h * 0.15); // Top-right of cabin
        ctx.lineTo(x + w * 0.8, y + h * 0.45); // Bottom-right of windshield (angled)
        ctx.lineTo(x + w * 0.2, y + h * 0.45); // Bottom-left of windshield (angled)
        ctx.closePath();
        ctx.fill();

        // Rear Window (simpler rectangle)
        ctx.fillRect(cabinX + cabinWidth * 0.05, y + h * 0.55, cabinWidth * 0.9, h * 0.08);


        if (isPlayer) {
            // Headlights
            ctx.fillStyle = lightsColor;
            drawRect(x + w * 0.15, y + h * 0.12, w * 0.2, h * 0.08, lightsColor);
            drawRect(x + w * 0.65, y + h * 0.12, w * 0.2, h * 0.08, lightsColor);
            // Small detail - maybe a grill or bumper line
            ctx.fillStyle = windowColor; // Use window color for contrast
            ctx.fillRect(x + w*0.1, y + h * 0.05, w*0.8, h*0.03);
        } else {
            // Taillights for obstacles
            ctx.fillStyle = '#FF4444'; // Brighter red for taillights
            drawRect(x + w * 0.15, y + h * 0.75, w * 0.2, h * 0.07, '#FF4444');
            drawRect(x + w * 0.65, y + h * 0.75, w * 0.2, h * 0.07, '#FF4444');
        }
    }


    function drawPlayer() {
        playerCar.x = GRASS_WIDTH_ACTUAL + (playerCar.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (playerCar.width / 2);
        drawCarShape(playerCar.x, playerCar.y, playerCar.width, playerCar.height, playerCar.bodyColor, playerCar.windowColor, playerCar.lightsColor, true);
    }

    function drawObstacle(obstacle) {
        drawCarShape(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.bodyColor, obstacle.windowColor, '', false);
    }


    function spawnObstacle() {
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const x = GRASS_WIDTH_ACTUAL + (lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (OBSTACLE_WIDTH / 2);
        const bodyColor = OBSTACLE_BODY_COLORS[Math.floor(Math.random() * OBSTACLE_BODY_COLORS.length)];
        obstacles.push({
            x: x,
            y: -OBSTACLE_HEIGHT,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            lane: lane,
            bodyColor: bodyColor,
            windowColor: OBSTACLE_WINDOW_COLOR
        });
    }

    function updateObstacles() {
        obstacleSpawnTimer++;
        if (obstacleSpawnTimer >= obstacleSpawnInterval) {
            spawnObstacle();
            obstacleSpawnTimer = 0;
            obstacleSpawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL_INITIAL - gameSpeed * 4, 40); // Adjusted difficulty scaling
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y += gameSpeed * (CANVAS_HEIGHT / 600); // Scale speed with reference height
            if (obstacles[i].y > CANVAS_HEIGHT) {
                obstacles.splice(i, 1);
            }
        }
    }

    function initRoadLines() {
        roadLines = [];
        for (let y = 0; y < CANVAS_HEIGHT + roadLineHeight; y += roadLineHeight + roadLineGap) {
            roadLines.push({ y: y });
        }
    }
     function initRumbleStrips() {
        rumbleStrips = [];
        for (let y = 0; y < CANVAS_HEIGHT + rumbleStripHeight; y += rumbleStripHeight + rumbleStripGap) {
            rumbleStrips.push({ y: y, colorToggle: Math.random() > 0.5 }); // Randomize initial toggle
        }
    }

    function drawRoad() {
        drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.35, getComputedStyle(document.documentElement).getPropertyValue('--sky-color').trim()); // Slightly larger sky
        drawRect(0, 0, GRASS_WIDTH_ACTUAL, CANVAS_HEIGHT, getComputedStyle(document.documentElement).getPropertyValue('--grass-color').trim());
        drawRect(GRASS_WIDTH_ACTUAL + ROAD_WIDTH_ACTUAL, 0, GRASS_WIDTH_ACTUAL, CANVAS_HEIGHT, getComputedStyle(document.documentElement).getPropertyValue('--grass-color').trim());
        drawRect(GRASS_WIDTH_ACTUAL, 0, ROAD_WIDTH_ACTUAL, CANVAS_HEIGHT, getComputedStyle(document.documentElement).getPropertyValue('--road-color').trim());

        const markerColor = getComputedStyle(document.documentElement).getPropertyValue('--lane-marker-color').trim();
        const markerWidth = Math.max(3, LANE_WIDTH * 0.025); // Thinner markers
        for (let i = 0; i < roadLines.length; i++) {
            roadLines[i].y += gameSpeed * (CANVAS_HEIGHT / 600);
            if (roadLines[i].y > CANVAS_HEIGHT + roadLineHeight) {
                roadLines[i].y = -roadLineHeight - roadLineGap * Math.random(); // Add some randomness to gap
            }
            if (LANE_COUNT > 1) {
                 for (let j = 1; j < LANE_COUNT; j++) {
                    drawRect(GRASS_WIDTH_ACTUAL + (j * LANE_WIDTH) - markerWidth / 2, roadLines[i].y, markerWidth, roadLineHeight, markerColor);
                }
            }
        }

        const rumbleColor1 = getComputedStyle(document.documentElement).getPropertyValue('--rumble-strip-color-1').trim();
        const rumbleColor2 = getComputedStyle(document.documentElement).getPropertyValue('--rumble-strip-color-2').trim();
        const rumbleWidth = Math.max(6, GRASS_WIDTH_ACTUAL * 0.08);

        for (let i = 0; i < rumbleStrips.length; i++) {
            rumbleStrips[i].y += gameSpeed * (CANVAS_HEIGHT / 600);
            if (rumbleStrips[i].y > CANVAS_HEIGHT + rumbleStripHeight) {
                rumbleStrips[i].y = -rumbleStripHeight - rumbleStripGap * Math.random();
                rumbleStrips[i].colorToggle = !rumbleStrips[i].colorToggle; 
            }
            const currentColor = rumbleStrips[i].colorToggle ? rumbleColor1 : rumbleColor2;
            drawRect(GRASS_WIDTH_ACTUAL - rumbleWidth, rumbleStrips[i].y, rumbleWidth, rumbleStripHeight, currentColor);
            drawRect(GRASS_WIDTH_ACTUAL + ROAD_WIDTH_ACTUAL, rumbleStrips[i].y, rumbleWidth, rumbleStripHeight, currentColor);
        }
    }


    function checkCollision() {
        const carHitboxYOffset = playerCar.height * 0.1; // Collide with main body, not very top
        const carEffectiveHeight = playerCar.height * 0.8;
        for (let obstacle of obstacles) {
            if (playerCar.lane === obstacle.lane) { 
                if (playerCar.y + carHitboxYOffset < obstacle.y + obstacle.height &&
                    playerCar.y + carHitboxYOffset + carEffectiveHeight > obstacle.y) {
                    return true; 
                }
            }
        }
        return false;
    }

    function updateScoreAndSpeed() {
        score += Math.floor(gameSpeed); 
        scoreDisplay.textContent = score;

        if (gameSpeed < MAX_SPEED) {
            gameSpeed += SPEED_INCREMENT * (1 + score/8000); 
            gameSpeed = Math.min(gameSpeed, MAX_SPEED);
        }
        speedUiDisplay.textContent = Math.floor(gameSpeed);
    }


    function gameLoop() {
        if (isGameOver) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawRoad();
        updateObstacles();
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
            localStorage.setItem('neonDriveXHighScore', highScore);
            highScoreDisplay.textContent = highScore;
        }
        finalScoreDisplay.textContent = score;
        gameOverText.textContent = "CRASHED!"; // Or "WIPEOUT!"
        gameOverScreen.style.display = 'flex';
    }

    function resetGame() {
        calculateSizes(); 
        gameSpeed = INITIAL_SPEED;
        score = 0;
        playerCar.lane = 1; 
        obstacles = [];
        obstacleSpawnTimer = 0;
        obstacleSpawnInterval = OBSTACLE_SPAWN_INTERVAL_INITIAL;
        isGameOver = false;

        initRoadLines();
        initRumbleStrips();

        scoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
        speedUiDisplay.textContent = Math.floor(gameSpeed);

        gameMessageScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
    }

    function startGame() {
        resetGame();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    window.addEventListener('keydown', (e) => {
        if (isGameOver) {
            if (e.key === 'Enter' || e.key === ' ') {
                if (gameMessageScreen.style.display === 'flex' || gameOverScreen.style.display === 'flex') {
                    startGame();
                }
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            if (playerCar.lane > 0) playerCar.lane--;
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            if (playerCar.lane < LANE_COUNT - 1) playerCar.lane++;
        }
    });

    document.getElementById('leftButton')?.addEventListener('click', () => {
        if (!isGameOver && playerCar.lane > 0) playerCar.lane--;
    });
    document.getElementById('rightButton')?.addEventListener('click', () => {
        if (!isGameOver && playerCar.lane < LANE_COUNT - 1) playerCar.lane++;
    });

    function initializeUI() {
        calculateSizes();
        highScoreDisplay.textContent = highScore;
        scoreDisplay.textContent = 0;
        speedUiDisplay.textContent = 0;
        messageText.textContent = "GET READY!";
        gameMessageScreen.style.display = 'flex';
        gameOverScreen.style.display = 'none';

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        initRoadLines(); // Initialize for preview
        initRumbleStrips(); // Initialize for preview
        drawRoad(); 
        playerCar.lane = 1; 
        drawPlayer(); 
    }
    
    window.addEventListener('resize', () => {
        if (isGameOver) {
            initializeUI();
        } else { 
            const oldPlayerLane = playerCar.lane; // Preserve lane
            calculateSizes();
            playerCar.lane = oldPlayerLane; // Restore lane
            playerCar.x = GRASS_WIDTH_ACTUAL + (playerCar.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (playerCar.width / 2);
            // Road lines and rumble strips will be re-initialized if game restarts or re-drawn by game loop
        }
    });

    // Particles.js Setup
    if (window.particlesJS) {
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        const buttonColor = getComputedStyle(document.documentElement).getPropertyValue('--button-main-color').trim();
        particlesJS('particles-js-racer', {
            "particles": {
                "number": { "value": 70, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": [accentColor, buttonColor, "#ffffff"] }, // Use theme colors
                "shape": {
                    "type": ["line", "triangle"], // Techy shapes
                    "stroke": { "width": 0, "color": "#000000" },
                },
                "opacity": { "value": 0.3, "random": true, "anim": { "enable": true, "speed": 0.2, "opacity_min": 0.05, "sync": false } },
                "size": { "value": 4, "random": true, "anim": { "enable": false } }, // Static size for lines/triangles often looks better
                "line_linked": { "enable": false },
                "move": {
                    "enable": true, "speed": 1.5, "direction": "bottom", "random": false, "straight": true, // Move downwards
                    "out_mode": "out", "bounce": false,
                    "attract": { "enable": false }
                }
            },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": false }, "onclick": { "enable": false }, "resize": true }, "modes": {} },
            "retina_detect": true
        });
    } else {
        console.warn("Particles.js library not loaded.");
    }

    initializeUI();
});