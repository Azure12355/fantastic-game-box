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
    const launchButton = document.getElementById('launchButton');

    // --- Game Settings & Colors ---
    // Base settings (for desktop/reference)
    const PADDLE_WIDTH_BASE = 80;
    const PADDLE_HEIGHT = 12;
    const PADDLE_Y_OFFSET_BASE = 30;
    const PADDLE_SPEED_BASE = 6;
    const BALL_RADIUS = 6;
    const INITIAL_BALL_SPEED_Y_BASE = -4.5;
    const INITIAL_BALL_SPEED_X_MAX_BASE = 2.5;
    const PLAYER_INITIAL_LIVES = 3;

    // Desktop Brick Layout
    const DESKTOP_BRICK_ROW_COUNT = 8;
    const DESKTOP_BRICK_COLUMN_COUNT = 10;
    // Mobile Brick Layout (Portrait)
    const MOBILE_BRICK_ROW_COUNT = 10; // More rows for vertical space
    const MOBILE_BRICK_COLUMN_COUNT = 7; // Fewer columns for narrow screens

    // Dynamic Brick Layout Variables
    let currentBrickRowCount = DESKTOP_BRICK_ROW_COUNT;
    let currentBrickColumnCount = DESKTOP_BRICK_COLUMN_COUNT;

    // Base Brick Dimensions (relative to 480px width and column count)
    const BRICK_PADDING_BASE = 4;
    const BRICK_OFFSET_TOP_BASE = 50;
    const BRICK_OFFSET_LEFT_BASE = 30;
    // Brick width/height are calculated dynamically based on current layout and scale

    const BRICK_COLORS = [ "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#f5a2e8", "#cccccc" ]; // Added more colors for more rows
    const PADDLE_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--paddle-color').trim() || '#9a8c98';
    const BALL_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--ball-color').trim() || '#f2e9e4';
    const SCREEN_BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim() || '#1a1b26';

    // --- Game State Variables ---
    let paddle = {}; let ball = {}; let bricks = [];
    let score = 0; let lives = 0; let highScore = 0; let currentLevel = 1;
    let bricksLeft = 0;
    let gameLoopId = null; let lastFrameTime = 0;
    let isPaused = false; let isGameOver = true; let ballIsAttached = true;
    let isMobileLayout = false; // Flag to track layout mode

    const keysPressed = { ArrowLeft: false, ArrowRight: false, Space: false };

    // --- Utility Functions --- (Keep checkCollisionCircleRect, darkenColor, lightenColor as before)
     function checkCollisionCircleRect(circle, rect) { if (!rect || !rect.active) return false; let testX = circle.x; let testY = circle.y; if (circle.x < rect.x) testX = rect.x; else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width; if (circle.y < rect.y) testY = rect.y; else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height; let distX = circle.x - testX; let distY = circle.y - testY; return (distX * distX) + (distY * distY) <= circle.radius * circle.radius; }
     function darkenColor(hex, factor) { if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') return '#000000'; let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16); r = Math.max(0, Math.min(255, Math.floor(r * factor))); g = Math.max(0, Math.min(255, Math.floor(g * factor))); b = Math.max(0, Math.min(255, Math.floor(b * factor))); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; }
     function lightenColor(hex, factor) { if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') return '#ffffff'; let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16); r = Math.max(0, Math.min(255, Math.floor(r * factor))); g = Math.max(0, Math.min(255, Math.floor(g * factor))); b = Math.max(0, Math.min(255, Math.floor(b * factor))); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; }


    // --- Drawing Functions --- (Keep drawPaddle, drawBall, drawBricks as before)
     function drawPaddle() { if (!paddle || !paddle.width) return; context.fillStyle = PADDLE_COLOR; context.fillRect(paddle.x, paddle.y, paddle.width, paddle.height); context.strokeStyle = darkenColor(PADDLE_COLOR, 0.7); context.lineWidth = 1; context.strokeRect(paddle.x + 0.5, paddle.y + 0.5, paddle.width - 1, paddle.height - 1); context.strokeStyle = lightenColor(PADDLE_COLOR, 1.2); context.strokeRect(paddle.x + 1.5, paddle.y + 1.5, paddle.width - 3, paddle.height - 3); }
     function drawBall() { if (!ball || !ball.radius) return; context.beginPath(); context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); context.fillStyle = BALL_COLOR; context.fill(); context.closePath(); context.beginPath(); context.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2); context.fillStyle = 'rgba(255, 255, 255, 0.5)'; context.fill(); context.closePath(); }
     function drawBricks() { bricks.forEach(column => { if (column) { column.forEach(brick => { if (brick && brick.active) { context.fillStyle = brick.color; context.fillRect(brick.x, brick.y, brick.width, brick.height); context.strokeStyle = darkenColor(brick.color, 0.7); context.lineWidth = 1; context.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1); } }); } }); }


    // --- Game Setup & Scaling ---

    function updateLayoutMode() {
        // Use window inner width and a threshold (e.g., 768px used in CSS)
        // Also consider orientation for finer control if needed
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        // Simple check: if width is less than height (portrait) and less than 768px
        isMobileLayout = screenWidth < 768 && screenWidth < screenHeight;

        if (isMobileLayout) {
            currentBrickColumnCount = MOBILE_BRICK_COLUMN_COUNT;
            currentBrickRowCount = MOBILE_BRICK_ROW_COUNT;
        } else {
            currentBrickColumnCount = DESKTOP_BRICK_COLUMN_COUNT;
            currentBrickRowCount = DESKTOP_BRICK_ROW_COUNT;
        }
         console.log(`Layout Mode: ${isMobileLayout ? 'Mobile' : 'Desktop'}, Bricks: ${currentBrickColumnCount}x${currentBrickRowCount}`);
    }

    function resizeCanvas() {
        const gameScreenContainer = document.getElementById('gameScreenContainer');
        const containerStyle = getComputedStyle(gameScreenContainer);
        const containerWidth = parseFloat(containerStyle.width);
        const containerHeight = parseFloat(containerStyle.height);

        // Check for valid dimensions
        if (isNaN(containerWidth) || isNaN(containerHeight) || containerWidth <= 0 || containerHeight <= 0) {
            console.warn("Invalid container dimensions for canvas:", containerWidth, containerHeight);
            // Set a fallback or wait? For now, just return.
            return;
        }

        // Set canvas logical size to match its CSS display size
        canvas.width = containerWidth;
        canvas.height = containerHeight;

        // Update layout mode based on window size AFTER resizing canvas container
        updateLayoutMode();

        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    }

    function getScaleFactor() {
        // Base width reference remains 480 for scaling calculations
        // but actual scaling depends on the *current* canvas width.
        return canvas.width / 480;
    }

    function createBricks() {
        bricks = [];
        bricksLeft = 0;
        const scale = getScaleFactor();

        // Use current layout settings
        const cols = currentBrickColumnCount;
        const rows = currentBrickRowCount;

        // Scale base offsets and padding
        const scaledOffsetLeft = BRICK_OFFSET_LEFT_BASE * scale;
        const scaledOffsetTop = BRICK_OFFSET_TOP_BASE * scale;
        const scaledPadding = BRICK_PADDING_BASE * scale;

        // Calculate available width and height for bricks
        const availableWidth = canvas.width - (scaledOffsetLeft * 2);
        // Base brick height needs scaling too
        const scaledBaseBrickHeight = (isMobileLayout ? 15 : 18) * scale; // Slightly smaller bricks on mobile?

        // Calculate brick width based on available space and current column count
        let brickWidth = Math.max(5, (availableWidth - (scaledPadding * (cols - 1))) / cols);
        // Ensure bricks don't exceed canvas width (safety check)
        if (cols * (brickWidth + scaledPadding) - scaledPadding + scaledOffsetLeft * 2 > canvas.width) {
             brickWidth = Math.max(5, (canvas.width - (scaledOffsetLeft * 2) - (scaledPadding * (cols - 1))) / cols);
             console.warn("Brick width adjusted to fit canvas width.");
        }
        let brickHeight = scaledBaseBrickHeight; // Use scaled base height

        console.log(`Creating ${cols}x${rows} bricks. W: ${brickWidth.toFixed(2)}, H: ${brickHeight.toFixed(2)}, Pad: ${scaledPadding.toFixed(2)}, OffL: ${scaledOffsetLeft.toFixed(2)}, OffT: ${scaledOffsetTop.toFixed(2)}`);

        for (let c = 0; c < cols; c++) {
            bricks[c] = [];
            for (let r = 0; r < rows; r++) {
                const brickX = c * (brickWidth + scaledPadding) + scaledOffsetLeft;
                const brickY = r * (brickHeight + scaledPadding) + scaledOffsetTop;
                const colorIndex = r % BRICK_COLORS.length;
                // Adjust points based on potentially more rows
                const brickPoints = (rows - r) * 5 + (currentLevel - 1) * 5;

                 // Check if brick placement is valid (within canvas bounds)
                 if (brickY + brickHeight > canvas.height - (PADDLE_Y_OFFSET_BASE * scale + PADDLE_HEIGHT + 20*scale)) { // Leave space above paddle
                    console.log(`Skipping brick at [${c},${r}] due to y-position: ${brickY + brickHeight} > ${canvas.height - 50}`);
                    bricks[c][r] = { active: false }; // Mark as inactive if out of bounds
                    continue; // Skip creating this brick if it's too low
                 }


                bricks[c][r] = {
                    x: brickX,
                    y: brickY,
                    width: brickWidth,
                    height: brickHeight,
                    color: BRICK_COLORS[colorIndex],
                    points: brickPoints,
                    active: true
                };
                bricksLeft++;
            }
        }
        console.log(`Bricks created. Total active: ${bricksLeft}`);
    }

    function resetPaddleAndBall() {
        const scale = getScaleFactor();

        paddle.width = PADDLE_WIDTH_BASE * scale;
        paddle.height = PADDLE_HEIGHT; // Keep height constant? Or scale slightly: PADDLE_HEIGHT * Math.min(1, scale)?
        paddle.dx = PADDLE_SPEED_BASE * scale;
        const scaledPaddleYOffset = PADDLE_Y_OFFSET_BASE * scale;

        paddle.x = (canvas.width - paddle.width) / 2;
        paddle.y = canvas.height - paddle.height - scaledPaddleYOffset;

        ball.radius = BALL_RADIUS; // Keep radius constant
        ball.speed = Math.abs(INITIAL_BALL_SPEED_Y_BASE) * Math.min(1.5, Math.max(0.8, scale)); // Scale speed, but cap/floor it
        ball.initialDy = INITIAL_BALL_SPEED_Y_BASE * Math.min(1.5, Math.max(0.8, scale));
        ball.initialDxMax = INITIAL_BALL_SPEED_X_MAX_BASE * Math.min(1.5, Math.max(0.8, scale));

        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 1;
        ball.dx = 0;
        ball.dy = 0;
        ballIsAttached = true;

        // Safety check: Ensure paddle/ball are within bounds after reset
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
        paddle.y = Math.max(0, Math.min(canvas.height - paddle.height, paddle.y));
        ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
        ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));

        console.log(`Paddle/Ball reset. Paddle: x=${paddle.x.toFixed(1)}, y=${paddle.y.toFixed(1)}, w=${paddle.width.toFixed(1)}. Ball: x=${ball.x.toFixed(1)}, y=${ball.y.toFixed(1)}`);
    }

    function launchBall() {
        if (ballIsAttached && !isGameOver && !isPaused) {
            ballIsAttached = false;
            ball.dx = (Math.random() * ball.initialDxMax * 2) - ball.initialDxMax;
            ball.dy = ball.initialDy;
            console.log(`Ball launched: dx=${ball.dx.toFixed(2)}, dy=${ball.dy.toFixed(2)}`);
        }
    }

    // --- Initialization ---
    function initGame(level = 1) {
        console.log("Initializing game, level:", level);
        if (gameLoopId !== null) cancelAnimationFrame(gameLoopId);

        // 1. Update layout mode FIRST based on window size
        updateLayoutMode();

        // 2. Resize canvas based on container (CSS might have changed layout)
        resizeCanvas(); // This now also calls updateLayoutMode again, which is fine

        // 3. Reset game state
        currentLevel = level;
        score = (level === 1) ? 0 : score;
        lives = (level === 1) ? PLAYER_INITIAL_LIVES : lives;
        isPaused = false;
        isGameOver = false;
        lastFrameTime = performance.now();
        ballIsAttached = true;

        // 4. Initialize objects
        paddle = { x: 0, y: 0, width: 0, height: PADDLE_HEIGHT, dx: 0 };
        ball = { x: 0, y: 0, radius: BALL_RADIUS, dx: 0, dy: 0, speed: 0, initialDy: 0, initialDxMax: 0 };

        // 5. Create Bricks (uses current layout mode)
        createBricks();

        // 6. Reset Paddle/Ball Position & Size (based on current canvas/scale)
        resetPaddleAndBall();

        // 7. Reset keys & Update UI
        for (const key in keysPressed) { keysPressed[key] = false; }
        loadHighScore();
        updateScoreDisplay();
        updateLivesDisplay();
        updateLevelDisplay();
        gameMessageScreen.style.display = 'none';
        gamePauseScreen.style.display = 'none';
        levelCompleteScreen.style.display = 'none';
        launchButton.textContent = 'FIRE'; // Set button text

        // 8. Start game loop
        gameLoopId = requestAnimationFrame(animationLoop);
        console.log("Game initialized.");
    }

    // --- Animation Loop --- (Keep animationLoop as before)
    function animationLoop(timestamp) { if (isGameOver) { gameLoopId = null; return; } if (isPaused) { lastFrameTime = timestamp; gameLoopId = requestAnimationFrame(animationLoop); return; } if (!lastFrameTime) lastFrameTime = timestamp; const deltaTime = timestamp - lastFrameTime; lastFrameTime = timestamp; const maxDeltaTime = 100; const cappedDeltaTime = Math.min(deltaTime, maxDeltaTime); try { gameLogic(cappedDeltaTime); } catch (error) { console.error("游戏循环出错:", error); gameOver(false, true); return; } gameLoopId = requestAnimationFrame(animationLoop); }

    // --- Game Logic --- (Keep gameLogic structure, collision calls as before)
    function gameLogic(deltaTime) {
        const dtFactor = deltaTime / 16.67;

        // --- Update Paddle ---
        if (keysPressed.ArrowLeft && paddle.x > 0) { paddle.x -= paddle.dx * dtFactor; }
        if (keysPressed.ArrowRight && paddle.x < canvas.width - paddle.width) { paddle.x += paddle.dx * dtFactor; }
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));

        // --- Update Ball ---
        if (ballIsAttached) {
            ball.x = paddle.x + paddle.width / 2; ball.y = paddle.y - ball.radius - 1;
            if (keysPressed.Space) launchBall();
        } else {
            ball.x += ball.dx * dtFactor; ball.y += ball.dy * dtFactor;
            // Wall Collision
            if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) { ball.dx = -ball.dx; ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x)); }
            // Top Collision
            if (ball.y - ball.radius < 0) { ball.dy = -ball.dy; ball.y = ball.radius; }
            // Bottom Collision (Life Lost)
            if (ball.y + ball.radius > canvas.height) { handleLifeLost(); return; }
            // Paddle Collision
            const paddleBox = {x: paddle.x, y: paddle.y, width: paddle.width, height: paddle.height, active: true};
            if (ball.dy > 0 && checkCollisionCircleRect(ball, paddleBox)) {
                let collidePoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2); collidePoint = Math.max(-0.9, Math.min(0.9, collidePoint));
                let angle = collidePoint * (Math.PI / 2.6);
                const currentSpeed = Math.hypot(ball.dx, ball.dy) || ball.speed; // Use ball.speed if dx/dy are 0
                ball.dx = currentSpeed * Math.sin(angle); ball.dy = -currentSpeed * Math.cos(angle);
                ball.y = paddle.y - ball.radius - 0.1;
            }
            // Brick Collision
            brickCollisionDetection();
        }

        // --- Clear & Draw ---
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
        drawPaddle(); drawBall(); drawBricks();
    }


    // --- Brick Collision --- (Use current layout variables)
    function brickCollisionDetection() {
         const cols = currentBrickColumnCount;
         const rows = currentBrickRowCount;
         for (let c = 0; c < cols; c++) {
             // Check if column exists
             if (!bricks[c]) continue;
             for (let r = 0; r < rows; r++) {
                 // Check if brick exists
                 const brick = bricks[c][r];
                 if (!brick || !brick.active) continue; // Skip if brick doesn't exist or is inactive

                 if (checkCollisionCircleRect(ball, brick)) {
                     brick.active = false;

                     const ballCenterX = ball.x; const ballCenterY = ball.y;
                     const brickCenterX = brick.x + brick.width / 2; const brickCenterY = brick.y + brick.height / 2;
                     const deltaX = ballCenterX - brickCenterX; const deltaY = ballCenterY - brickCenterY;
                     const overlapX = (ball.radius + brick.width / 2) - Math.abs(deltaX);
                     const overlapY = (ball.radius + brick.height / 2) - Math.abs(deltaY);

                     if (overlapX >= overlapY) {
                         ball.dy = -ball.dy; ball.y += (deltaY > 0 ? overlapY : -overlapY);
                     } else {
                         ball.dx = -ball.dx; ball.x += (deltaX > 0 ? overlapX : -overlapX);
                     }

                     score += brick.points; bricksLeft--; updateScoreDisplay();
                     if (bricksLeft <= 0) { levelComplete(); return; }
                     return; // Process one brick hit per frame
                 }
             }
         }
    }

    // --- Game State Functions --- (Keep handleLifeLost, levelComplete, gameOver, togglePause as before)
    function handleLifeLost() { lives--; updateLivesDisplay(); if (lives <= 0) { gameOver(false); } else { resetPaddleAndBall(); } }
    function levelComplete() { isPaused = true; if(gameLoopId) cancelAnimationFrame(gameLoopId); gameLoopId = null; levelCompleteScreen.style.display = 'flex'; }
    function gameOver(isWin, isError = false) { if (isGameOver) return; isGameOver = true; if (gameLoopId !== null) { cancelAnimationFrame(gameLoopId); gameLoopId = null; } if (score > highScore) { highScore = score; saveHighScore(); } updateScoreDisplay(); updateLivesDisplay(); if (isError) { messageText.textContent = `Error!`; } else if (isWin) { messageText.textContent = "Win!"; } else { messageText.textContent = "GAME OVER!"; } startButton.style.display = 'none'; launchButton.textContent = isWin ? "Again" : "Resume"; gameMessageScreen.style.display = 'flex'; }
    function togglePause() { if (isGameOver) return; isPaused = !isPaused; if (isPaused) { gamePauseScreen.style.display = 'flex'; } else { gamePauseScreen.style.display = 'none'; lastFrameTime = performance.now(); if (gameLoopId === null) { gameLoopId = requestAnimationFrame(animationLoop); } } }


    // --- UI Update Functions --- (Keep updateScoreDisplay, updateLivesDisplay, updateLevelDisplay, saveHighScore, loadHighScore as before)
     function updateScoreDisplay() { scoreElement.textContent = score; highScoreElement.textContent = highScore; }
     function updateLivesDisplay() { livesContainer.innerHTML = ''; for (let i = 0; i < lives; i++) { const lifeIcon = document.createElement('div'); lifeIcon.classList.add('life-icon-paddle'); livesContainer.appendChild(lifeIcon); } }
     function updateLevelDisplay() { levelDisplayElement.textContent = currentLevel; }
     function saveHighScore() { try { localStorage.setItem('pixelBrickHighScore', highScore); } catch (e) { console.warn("无法保存最高分:", e); } }
     function loadHighScore() { try { const savedScore = localStorage.getItem('pixelBrickHighScore'); highScore = savedScore ? parseInt(savedScore, 10) : 0; } catch (e) { console.warn("无法加载最高分:", e); highScore = 0; } }

    // --- Event Listeners --- (Keep keyboard listeners as before)
    document.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'p' || e.key === "Escape") { togglePause(); return; } if (!isPaused && !isGameOver) { if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = true; if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = true; if (e.key === ' ') { keysPressed.Space = true; launchBall(); e.preventDefault(); } } });
    document.addEventListener('keyup', (e) => { if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = false; if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = false; if (e.key === ' ') keysPressed.Space = false; });

    // Button hold/touch logic (Keep setupButtonHold as before)
    function setupButtonHold(buttonElement, keyName) { const handlePress = (e) => { e.preventDefault(); if (!isPaused && !isGameOver) { keysPressed[keyName] = true; } buttonElement.classList.add('active-touch'); }; const handleRelease = (e) => { e.preventDefault(); keysPressed[keyName] = false; buttonElement.classList.remove('active-touch'); }; buttonElement.addEventListener('mousedown', handlePress); buttonElement.addEventListener('mouseup', handleRelease); buttonElement.addEventListener('mouseleave', handleRelease); buttonElement.addEventListener('touchstart', handlePress, { passive: false }); buttonElement.addEventListener('touchend', handleRelease); buttonElement.addEventListener('touchcancel', handleRelease); }
    setupButtonHold(leftButton, 'ArrowLeft'); setupButtonHold(rightButton, 'ArrowRight');

    // Other Button Listeners (Launch, Pause, Start, Restart, Next Level)
    // Keep the click/touchstart logic as before, ensuring preventDefault and active-touch class toggling
     launchButton.addEventListener('click', handleLaunchAction);
     launchButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleLaunchAction(); launchButton.classList.add('active-touch'); setTimeout(() => launchButton.classList.remove('active-touch'), 150); }, { passive: false });
     function handleLaunchAction() { if (isGameOver) { initGame(1); } else if (ballIsAttached) { launchBall(); } }

     pauseActionButton.addEventListener('click', togglePause);
     pauseActionButton.addEventListener('touchstart', (e) => { e.preventDefault(); togglePause(); pauseActionButton.classList.add('active-touch'); setTimeout(() => pauseActionButton.classList.remove('active-touch'), 150); }, { passive: false });

     startButton.addEventListener('click', () => initGame(1));
     startButton.addEventListener('touchstart', (e) => { e.preventDefault(); initGame(1); }, { passive: false });

     restartButtonPanel.addEventListener('click', () => initGame(1));
     restartButtonPanel.addEventListener('touchstart', (e) => { e.preventDefault(); initGame(1); restartButtonPanel.classList.add('active-touch'); setTimeout(() => restartButtonPanel.classList.remove('active-touch'), 150); }, { passive: false });

     nextLevelButton.addEventListener('click', () => initGame(currentLevel + 1));
     nextLevelButton.addEventListener('touchstart', (e) => { e.preventDefault(); initGame(currentLevel + 1); }, { passive: false });


    // Prevent canvas default touch actions
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    // --- Window Resize Logic ---
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize); // Also handle orientation changes

    let resizeTimeout;
    function handleResize() {
        // Debounce resize event to avoid excessive recalcs
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized or orientation changed");

            // 1. Update layout mode first
            updateLayoutMode();
            // 2. Resize canvas based on CSS container size
            resizeCanvas();

            // 3. Re-initialize elements based on new size/layout
            if (!isGameOver) {
                // Game is running, re-create bricks and reset paddle/ball
                createBricks();
                resetPaddleAndBall();
                // If paused, force a redraw of the current state
                if (isPaused) {
                    context.fillStyle = SCREEN_BG_COLOR;
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    drawPaddle();
                    drawBall();
                    drawBricks();
                }
            } else {
                // Game is over or not started, redraw the initial UI preview
                initializeUI(); // This will also handle drawing preview bricks/paddle
            }
        }, 100); // Wait 100ms after last resize event
    }

    // --- Initial UI Setup ---
    function initializeUI() {
        // 1. Set layout mode based on initial window size
        updateLayoutMode();
        // 2. Set initial canvas size
        resizeCanvas();

        // 3. Reset state variables
        loadHighScore(); score = 0; lives = PLAYER_INITIAL_LIVES; currentLevel = 1; isGameOver = true; isPaused = false;
        updateScoreDisplay(); updateLivesDisplay(); updateLevelDisplay();

        // 4. Setup message screen
        messageText.textContent = "Ready？";
        startButton.style.display = 'inline-block';
        launchButton.textContent = 'Launch';
        gameMessageScreen.style.display = 'flex'; gamePauseScreen.style.display = 'none'; levelCompleteScreen.style.display = 'none';

        // 5. Draw initial preview on canvas
        context.fillStyle = SCREEN_BG_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Create temporary brick layout for preview
        createBricks(); // Use current layout mode
        drawBricks();

        // Draw paddle/ball preview using scaled values
        const scale = getScaleFactor();
        const tempPaddleWidth = PADDLE_WIDTH_BASE * scale;
        const tempPaddleHeight = PADDLE_HEIGHT;
        const tempPaddleYOffset = PADDLE_Y_OFFSET_BASE * scale;
        const tempPaddleX = (canvas.width - tempPaddleWidth) / 2;
        const tempPaddleY = canvas.height - tempPaddleHeight - tempPaddleYOffset;
        const tempBallRadius = BALL_RADIUS;

        context.fillStyle = PADDLE_COLOR; context.fillRect(tempPaddleX, tempPaddleY, tempPaddleWidth, tempPaddleHeight);
        context.beginPath(); context.arc(tempPaddleX + tempPaddleWidth/2, tempPaddleY - tempBallRadius - 1, tempBallRadius, 0, Math.PI*2); context.fillStyle = BALL_COLOR; context.fill(); context.closePath();
        console.log("Initial UI drawn.");
    }

    // --- Particles Setup --- (Keep as before)
     if (window.particlesJS) { particlesJS('particles-js-bricks', { "particles": {"number": {"value": 40,"density": {"enable": true,"value_area": 800}},"color": {"value": ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff"]}, "shape": {"type": "edge"}, "opacity": {"value": 0.5,"random": true,"anim": {"enable": true,"speed": 0.2,"opacity_min": 0.1}},"size": {"value": 3,"random": true,"anim": {"enable": false}},"line_linked": {"enable": false},"move": {"enable": true,"speed": 0.8,"direction": "bottom","random": true,"straight": false,"out_mode": "out","bounce": false}}, "interactivity": {"enable": false},"retina_detect": true }); } else { console.warn("未加载 particles.js 库。"); }

    // --- Initialize ---
    initializeUI(); // Setup the initial screen

}); // End DOMContentLoaded