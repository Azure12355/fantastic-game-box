document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('brickCanvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const livesContainer = document.getElementById('livesContainer');
    const highScoreElement = document.getElementById('highScore');
    const levelDisplayElement = document.getElementById('levelDisplay');
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const startButton = document.getElementById('startButton');
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const restartButtonPanel = document.getElementById('restartButtonPanel');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const pauseActionButton = document.getElementById('pauseActionButton');
    const gamePauseScreen = document.getElementById('pauseScreen');

    canvas.width = 480;
    canvas.height = 500;

    // --- Game Settings & Colors ---
    const PADDLE_WIDTH = 80;
    const PADDLE_HEIGHT = 12;
    const PADDLE_Y_OFFSET = 30; // Increased offset from bottom
    const PADDLE_SPEED = 6;
    const BALL_RADIUS = 6;
    const INITIAL_BALL_SPEED_Y = -4.5; // Slightly faster initial speed
    const INITIAL_BALL_SPEED_X_MAX = 2.5;

    const BRICK_ROW_COUNT = 8;
    const BRICK_COLUMN_COUNT = 10;
    const BRICK_PADDING = 4;
    const BRICK_OFFSET_TOP = 50; // Increased top offset
    const BRICK_OFFSET_LEFT = 30; // Increased left offset
    // Calculate brick width dynamically based on new offsets and padding
    const availableWidth = canvas.width - (BRICK_OFFSET_LEFT * 2);
    const BRICK_WIDTH = Math.floor((availableWidth - (BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / BRICK_COLUMN_COUNT);
    const BRICK_HEIGHT = 18; // Slightly taller bricks

    const PLAYER_INITIAL_LIVES = 3;

    const BRICK_COLORS = [ "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff" ]; // Fallback if CSS vars fail
    const PADDLE_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--paddle-color').trim() || '#9a8c98';
    const BALL_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--ball-color').trim() || '#f2e9e4';
    const SCREEN_BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim() || '#1a1b26';

    // --- Game State Variables ---
    let paddle = {}; let ball = {}; let bricks = [];
    let score = 0; let lives = 0; let highScore = 0; let currentLevel = 1;
    let bricksLeft = 0;
    let gameLoopId = null; let lastFrameTime = 0;
    let isPaused = false; let isGameOver = true; let ballIsAttached = true;

    const keysPressed = { ArrowLeft: false, ArrowRight: false, Space: false }; // Added Space for launching

    // --- Utility Functions ---
    function checkCollisionCircleRect(circle, rect) {
        if (!rect || !rect.active) return false;
        let testX = circle.x; let testY = circle.y;
        if (circle.x < rect.x) testX = rect.x; else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;
        if (circle.y < rect.y) testY = rect.y; else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;
        let distX = circle.x - testX; let distY = circle.y - testY;
        return (distX * distX) + (distY * distY) <= circle.radius * circle.radius;
    }
    function darkenColor(hex, factor) { /* ... (same implementation) ... */
        if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') return '#000000'; let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, Math.floor(r * factor))); g = Math.max(0, Math.min(255, Math.floor(g * factor))); b = Math.max(0, Math.min(255, Math.floor(b * factor)));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    function lightenColor(hex, factor) { /* ... (same implementation) ... */
         if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') return '#ffffff'; let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16);
         r = Math.max(0, Math.min(255, Math.floor(r * factor))); g = Math.max(0, Math.min(255, Math.floor(g * factor))); b = Math.max(0, Math.min(255, Math.floor(b * factor)));
         return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // --- Drawing Functions ---
    function drawPaddle() {
        if (!paddle) return;
        context.fillStyle = PADDLE_COLOR; context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        context.strokeStyle = darkenColor(PADDLE_COLOR, 0.7); context.lineWidth = 1; context.strokeRect(paddle.x + 0.5, paddle.y + 0.5, paddle.width - 1, paddle.height - 1);
        context.strokeStyle = lightenColor(PADDLE_COLOR, 1.2); context.strokeRect(paddle.x + 1.5, paddle.y + 1.5, paddle.width - 3, paddle.height - 3);
    }
    function drawBall() {
        if (!ball) return;
        context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); context.fillStyle = BALL_COLOR; context.fill(); context.closePath();
        context.beginPath(); context.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2); context.fillStyle = 'rgba(255, 255, 255, 0.5)'; context.fill(); context.closePath();
    }
    function drawBricks() {
        bricks.forEach(column => { column.forEach(brick => { if (brick.active) {
            context.fillStyle = brick.color; context.fillRect(brick.x, brick.y, brick.width, brick.height);
            context.strokeStyle = darkenColor(brick.color, 0.7); context.lineWidth = 1; context.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1);
        }})});
    }

    // --- Game Setup ---
    function createBricks() {
        bricks = []; bricksLeft = 0;
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) { bricks[c] = [];
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                const colorIndex = r % BRICK_COLORS.length;
                const brickPoints = (BRICK_ROW_COUNT - r) * 10 + (currentLevel - 1) * 5; // Points increase with level
                bricks[c][r] = { x: brickX, y: brickY, width: BRICK_WIDTH, height: BRICK_HEIGHT, color: BRICK_COLORS[colorIndex], points: brickPoints, active: true };
                bricksLeft++;
            }
        }
    }
    function resetPaddleAndBall() {
        paddle.x = (canvas.width - PADDLE_WIDTH) / 2; paddle.y = canvas.height - PADDLE_HEIGHT - PADDLE_Y_OFFSET;
        ball.x = paddle.x + paddle.width / 2; ball.y = paddle.y - BALL_RADIUS - 1;
        ball.dx = 0; // Start stationary horizontally until launch
        ball.dy = 0; // Start stationary vertically until launch
        ballIsAttached = true;
    }
    function launchBall() {
        if (ballIsAttached) {
            ballIsAttached = false;
            ball.dx = (Math.random() * INITIAL_BALL_SPEED_X_MAX * 2) - INITIAL_BALL_SPEED_X_MAX;
            ball.dy = INITIAL_BALL_SPEED_Y;
        }
    }

    // --- Initialization ---
    function initGame(level = 1) {
        if (gameLoopId !== null) cancelAnimationFrame(gameLoopId);
        currentLevel = level; score = (level === 1) ? 0 : score; lives = (level === 1) ? PLAYER_INITIAL_LIVES : lives;
        isPaused = false; isGameOver = false; lastFrameTime = performance.now();
        paddle = { x: 0, y: 0, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, dx: PADDLE_SPEED };
        ball = { x: 0, y: 0, radius: BALL_RADIUS, dx: 0, dy: 0, speed: Math.abs(INITIAL_BALL_SPEED_Y) };
        createBricks(); resetPaddleAndBall();
        for (const key in keysPressed) { keysPressed[key] = false; }
        updateScoreDisplay(); updateLivesDisplay(); loadHighScore(); updateLevelDisplay();
        gameMessageScreen.style.display = 'none'; gamePauseScreen.style.display = 'none'; levelCompleteScreen.style.display = 'none';
        gameLoopId = requestAnimationFrame(animationLoop);
    }

    // --- Animation Loop ---
    function animationLoop(timestamp) {
        if (isGameOver) { gameLoopId = null; return; }
        if (isPaused) { lastFrameTime = timestamp; gameLoopId = requestAnimationFrame(animationLoop); return; }
        if (!lastFrameTime) lastFrameTime = timestamp;
        const deltaTime = timestamp - lastFrameTime;
        if (deltaTime < 8) { gameLoopId = requestAnimationFrame(animationLoop); return; }
        lastFrameTime = timestamp;
        const cappedDeltaTime = Math.min(deltaTime, 33);
        try { gameLogic(cappedDeltaTime); }
        catch (error) { console.error("Game loop error:", error); gameOver(false, true); return; }
        gameLoopId = requestAnimationFrame(animationLoop);
    }

    // --- Game Logic ---
    function gameLogic(deltaTime) {
        const dtFactor = deltaTime / 16.67;

        // --- Update Paddle ---
        if (keysPressed.ArrowLeft && paddle.x > 0) { paddle.x -= paddle.dx * dtFactor; }
        if (keysPressed.ArrowRight && paddle.x < canvas.width - paddle.width) { paddle.x += paddle.dx * dtFactor; }
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));

        // --- Update Ball ---
        if (ballIsAttached) {
            ball.x = paddle.x + paddle.width / 2; ball.y = paddle.y - ball.radius - 1;
            if (keysPressed.Space) launchBall(); // Launch on Space
        } else {
            ball.x += ball.dx * dtFactor; ball.y += ball.dy * dtFactor;
            // Wall Collision
            if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) { ball.dx = -ball.dx; ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x)); }
            if (ball.y - ball.radius < 0) { ball.dy = -ball.dy; ball.y = ball.radius; }
            // Bottom Collision (Life Lost)
            if (ball.y + ball.radius > canvas.height) { handleLifeLost(); return; }
            // Paddle Collision
            const paddleBox = {x: paddle.x, y: paddle.y, width: paddle.width, height: paddle.height, active: true};
            if (ball.dy > 0 && checkCollisionCircleRect(ball, paddleBox)) {
                let collidePoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); collidePoint = Math.max(-0.9, Math.min(0.9, collidePoint)); // Limit extreme angles slightly
                let angle = collidePoint * (Math.PI / 2.5); // Max ~72 degrees angle
                const currentSpeed = Math.hypot(ball.dx, ball.dy); // Maintain speed
                ball.dx = currentSpeed * Math.sin(angle); ball.dy = -currentSpeed * Math.cos(angle);
                ball.y = paddle.y - ball.radius - 0.1; // Prevent sticking
            }
            // Brick Collision
            brickCollisionDetection();
        }

        // --- Clear & Draw ---
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
        drawPaddle(); drawBall(); drawBricks();
    }

    // --- Brick Collision ---
    function brickCollisionDetection() {
         for (let c = 0; c < BRICK_COLUMN_COUNT; c++) { for (let r = 0; r < BRICK_ROW_COUNT; r++) {
             const brick = bricks[c][r];
             if (brick.active && checkCollisionCircleRect(ball, brick)) {
                 brick.active = false;
                 // Basic reflection - could be more sophisticated (corner hits etc.)
                 // Determine if hit was more horizontal or vertical
                 const overlapX = (ball.radius + brick.width / 2) - Math.abs(ball.x - (brick.x + brick.width / 2));
                 const overlapY = (ball.radius + brick.height / 2) - Math.abs(ball.y - (brick.y + brick.height / 2));

                 if (overlapX >= overlapY) { // Hit top or bottom
                     ball.dy = -ball.dy;
                      ball.y += (ball.dy > 0 ? 0.1 : -0.1); // Nudge slightly away
                 } else { // Hit side
                     ball.dx = -ball.dx;
                      ball.x += (ball.dx > 0 ? 0.1 : -0.1); // Nudge slightly away
                 }

                 score += brick.points; bricksLeft--; updateScoreDisplay();
                 if (bricksLeft <= 0) { levelComplete(); return; }
                 return; // Only break one brick per frame for simplicity
             }
         }}
    }

    // --- Game State Functions ---
    function handleLifeLost() {
        lives--; updateLivesDisplay();
        if (lives <= 0) { gameOver(false); }
        else { resetPaddleAndBall(); }
    }
    function levelComplete() {
        isPaused = true; // Use pause state to stop logic
        if(gameLoopId) cancelAnimationFrame(gameLoopId); gameLoopId = null;
        levelCompleteScreen.style.display = 'flex';
    }
    function gameOver(isWin, isError = false) {
        if (isGameOver) return; isGameOver = true;
        if (gameLoopId !== null) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
        if (score > highScore) { highScore = score; saveHighScore(); }
        updateScoreDisplay(); updateLivesDisplay();
        messageText.textContent = isError ? `Error!` : (isWin ? "YOU WIN!" : "GAME OVER!");
        startButton.textContent = isWin ? "PLAY AGAIN" : "RETRY";
        gameMessageScreen.style.display = 'flex';
    }
    function togglePause() {
        if (isGameOver) return; isPaused = !isPaused;
        if (isPaused) { gamePauseScreen.style.display = 'flex'; }
        else { gamePauseScreen.style.display = 'none'; lastFrameTime = performance.now(); if (gameLoopId === null) { gameLoopId = requestAnimationFrame(animationLoop); } }
    }

    // --- UI Update Functions ---
    function updateScoreDisplay() { scoreElement.textContent = score; highScoreElement.textContent = highScore; }
    function updateLivesDisplay() {
        livesContainer.innerHTML = '';
        for (let i = 0; i < lives; i++) {
            const lifeIcon = document.createElement('div');
            lifeIcon.classList.add('life-icon-paddle');
            livesContainer.appendChild(lifeIcon);
        }
    }
    function updateLevelDisplay() { levelDisplayElement.textContent = currentLevel; }
    function saveHighScore() { localStorage.setItem('pixelBrickHighScore', highScore); }
    function loadHighScore() { const savedScore = localStorage.getItem('pixelBrickHighScore'); highScore = savedScore ? parseInt(savedScore, 10) : 0; }

    // --- Event Listeners ---
    document.addEventListener('keydown', (e) => {
        if (isGameOver && (e.key === 'Enter' || e.key === ' ')) { initGame(1); return; }
        if (e.key.toLowerCase() === 'p' || e.key === "Escape") { togglePause(); return; }
        if (!isPaused && !isGameOver) {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = true;
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = true;
            if (e.key === ' ') { keysPressed.Space = true; launchBall(); e.preventDefault(); }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = false;
        if (e.key === ' ') keysPressed.Space = false;
    });

    function setupButtonHold(buttonElement, keyName) {
        buttonElement.addEventListener('mousedown', (e) => { e.preventDefault(); if(!isPaused && !isGameOver) keysPressed[keyName] = true; });
        buttonElement.addEventListener('mouseup', () => { keysPressed[keyName] = false; });
        buttonElement.addEventListener('mouseleave', () => { keysPressed[keyName] = false; });
        buttonElement.addEventListener('touchstart', (e) => { e.preventDefault(); if(!isPaused && !isGameOver) keysPressed[keyName] = true; });
        buttonElement.addEventListener('touchend', (e) => { e.preventDefault(); keysPressed[keyName] = false; });
    }
    setupButtonHold(leftButton, 'ArrowLeft'); setupButtonHold(rightButton, 'ArrowRight');

    pauseActionButton.addEventListener('click', togglePause);
    startButton.addEventListener('click', () => initGame(1));
    restartButtonPanel.addEventListener('click', () => initGame(1));
    nextLevelButton.addEventListener('click', () => initGame(currentLevel + 1));

    // --- Initial UI Setup ---
    function initializeUI() {
        loadHighScore(); score = 0; lives = PLAYER_INITIAL_LIVES; currentLevel = 1; isGameOver = true; isPaused = false;
        updateScoreDisplay(); updateLivesDisplay(); updateLevelDisplay();
        messageText.textContent = "GET READY!"; startButton.textContent = 'START GAME';
        gameMessageScreen.style.display = 'flex'; gamePauseScreen.style.display = 'none'; levelCompleteScreen.style.display = 'none';
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
        // Draw initial state preview
        const tempPaddleX = (canvas.width - PADDLE_WIDTH) / 2; const tempPaddleY = canvas.height - PADDLE_HEIGHT - PADDLE_Y_OFFSET;
        context.fillStyle = PADDLE_COLOR; context.fillRect(tempPaddleX, tempPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
        context.beginPath(); context.arc(tempPaddleX + PADDLE_WIDTH/2, tempPaddleY - BALL_RADIUS - 1, BALL_RADIUS, 0, Math.PI*2); context.fillStyle = BALL_COLOR; context.fill(); context.closePath();
    }

    // --- Particles Setup ---
    if (window.particlesJS) {
        particlesJS('particles-js-bricks', {
             "particles": {"number": {"value": 50,"density": {"enable": true,"value_area": 800}},"color": {"value": ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff"]}, "shape": {"type": "edge"}, "opacity": {"value": 0.6,"random": true,"anim": {"enable": true,"speed": 0.3,"opacity_min": 0.1}},"size": {"value": 4,"random": true,"anim": {"enable": false}},"line_linked": {"enable": false},"move": {"enable": true,"speed": 1,"direction": "bottom","random": true,"straight": false,"out_mode": "out","bounce": false}},
            "interactivity": {"enable": false},"retina_detect": true
        });
    } else { console.error("particles.js library not loaded."); }

    // --- Initialize ---
    initializeUI();

}); // End DOMContentLoaded