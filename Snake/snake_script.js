document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('snakeCanvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const speedLevelElement = document.getElementById('speedLevel');
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    // const snakeImageElement = document.getElementById('snakeImage'); // Optional
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const pauseScreen = document.getElementById('pauseScreen');
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');

    // --- Game Settings ---
    const GRID_SIZE = 20; // Number of cells in grid
    let BLOCK_SIZE; // Calculated based on canvas size

    const BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim();
    const SNAKE_HEAD_COLOR = '#0f380f';
    const SNAKE_BODY_COLOR = '#306230';
    const SNAKE_EYE_COLOR = '#FFFFFF';
    const FOOD_APPLE_RED = '#e94560';
    const FOOD_APPLE_STEM = '#5C3317';

    // --- Game State ---
    let snake, food, dx, dy, score, highScore = 0, gameLoopTimeout, currentSpeed, speedLevel, isPaused, isGameOver;
    const initialSpeed = 150; // Milliseconds per move
    const speedIncrement = 0.95; // Factor to multiply speed by
    const maxSpeedLevel = 10;

    // --- Canvas Resizing ---
    function resizeCanvas() {
        const gameScreenContainer = document.getElementById('gameScreenContainer'); // The div with class .game-screen
        const containerStyle = getComputedStyle(gameScreenContainer);
        const containerWidth = parseFloat(containerStyle.width);
        const containerHeight = parseFloat(containerStyle.height);

        if (isNaN(containerWidth) || isNaN(containerHeight) || containerWidth <= 0 || containerHeight <= 0) {
            console.warn("Invalid container dimensions for canvas:", containerWidth, containerHeight);
            // Fallback or wait if dimensions are not ready
            canvas.width = 300; // Default fallback
            canvas.height = 300;
        } else {
            // For snake, maintain a square aspect ratio based on the smaller dimension
            const size = Math.min(containerWidth, containerHeight);
            canvas.width = size;
            canvas.height = size;
        }
        BLOCK_SIZE = canvas.width / GRID_SIZE; // Recalculate block size
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}, BLOCK_SIZE: ${BLOCK_SIZE}`);
    }


    // --- Initialization ---
    function initGame() {
        console.log("Initializing game...");
        resizeCanvas(); // Set canvas size first

        snake = [ { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) } ];
        dx = 1; dy = 0; // Start moving right
        score = 0;
        currentSpeed = initialSpeed;
        speedLevel = 1;
        isPaused = false;
        isGameOver = false;

        loadHighScore(); // Load high score first
        updateScoreDisplay();
        updateSpeedDisplay();
        placeFood();

        gameMessageScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        pauseButton.textContent = '暂停'; // Chinese for Pause

        // if (snakeImageElement) snakeImageElement.style.display = 'none';

        clearTimeout(gameLoopTimeout);
        gameLoop(); // Start the game loop
        console.log("Game initialized and loop started.");
    }

    // --- Game Loop ---
    function gameLoop() {
        if (isPaused || isGameOver) return;

        gameLoopTimeout = setTimeout(() => {
            clearCanvas();
            moveSnake(); // Move snake first
            drawFood();  // Draw food
            drawSnake(); // Draw snake on top

            if (checkCollision()) {
                gameOver();
                return; // Important to stop loop
            }
            gameLoop(); // Continue loop
        }, currentSpeed);
    }

    // --- Drawing Functions ---
    function clearCanvas() {
        context.fillStyle = BG_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Optional: Draw grid lines
        context.strokeStyle = 'rgba(15, 56, 15, 0.1)';
        context.lineWidth = Math.max(0.5, BLOCK_SIZE / 20); // Scale line width slightly
        for (let i = 0; i <= GRID_SIZE; i++) {
            context.beginPath();
            context.moveTo(i * BLOCK_SIZE, 0);
            context.lineTo(i * BLOCK_SIZE, canvas.height);
            context.stroke();
            context.beginPath();
            context.moveTo(0, i * BLOCK_SIZE);
            context.lineTo(canvas.width, i * BLOCK_SIZE);
            context.stroke();
        }
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            if (index === 0) { // Head
                context.fillStyle = SNAKE_HEAD_COLOR;
                context.fillRect(segment.x * BLOCK_SIZE, segment.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

                // Eyes (simplified logic for eyes based on direction)
                context.fillStyle = SNAKE_EYE_COLOR;
                const eyeSize = Math.max(1, BLOCK_SIZE / 5);
                const eyeOffsetFactor = 0.25; // Relative offset for eyes

                if (dx === 1) { // Right
                    context.fillRect((segment.x + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, (segment.y + eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, (segment.y + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                } else if (dx === -1) { // Left
                    context.fillRect((segment.x + eyeOffsetFactor) * BLOCK_SIZE, (segment.y + eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + eyeOffsetFactor) * BLOCK_SIZE, (segment.y + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                } else if (dy === 1) { // Down
                    context.fillRect((segment.x + eyeOffsetFactor) * BLOCK_SIZE, (segment.y + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, (segment.y + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                } else if (dy === -1) { // Up
                    context.fillRect((segment.x + eyeOffsetFactor) * BLOCK_SIZE, (segment.y + eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.75 - eyeOffsetFactor) * BLOCK_SIZE, (segment.y + eyeOffsetFactor) * BLOCK_SIZE, eyeSize, eyeSize);
                }

            } else { // Body
                context.fillStyle = SNAKE_BODY_COLOR;
                // Slightly smaller body segments for a "linked" look
                const bodyMargin = Math.max(0.5, BLOCK_SIZE * 0.05);
                context.fillRect(
                    segment.x * BLOCK_SIZE + bodyMargin,
                    segment.y * BLOCK_SIZE + bodyMargin,
                    BLOCK_SIZE - 2 * bodyMargin,
                    BLOCK_SIZE - 2 * bodyMargin
                );
                // Optional: Outline for body segments
                // context.strokeStyle = SNAKE_HEAD_COLOR;
                // context.lineWidth = Math.max(0.5, BLOCK_SIZE * 0.025);
                // context.strokeRect(segment.x * BLOCK_SIZE + bodyMargin/2, segment.y * BLOCK_SIZE + bodyMargin/2, BLOCK_SIZE - bodyMargin, BLOCK_SIZE - bodyMargin);
            }
        });
    }

    function moveSnake() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            updateScoreDisplay();
            placeFood();
            if (score % 50 === 0 && speedLevel < maxSpeedLevel) {
                currentSpeed *= speedIncrement;
                speedLevel++;
                updateSpeedDisplay();
            }
        } else {
            snake.pop();
        }
    }

    function placeFood() {
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * GRID_SIZE);
            foodY = Math.floor(Math.random() * GRID_SIZE);
        } while (snake.some(segment => segment.x === foodX && segment.y === foodY));
        food = { x: foodX, y: foodY };
    }

    function drawFood() {
        context.fillStyle = FOOD_APPLE_RED;
        context.fillRect(food.x * BLOCK_SIZE, food.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

        // Apple stem and highlight (scaled)
        context.fillStyle = FOOD_APPLE_STEM;
        const stemWidth = Math.max(1, BLOCK_SIZE / 4);
        const stemHeight = Math.max(1, BLOCK_SIZE / 3);
        context.fillRect(
            food.x * BLOCK_SIZE + (BLOCK_SIZE / 2) - (stemWidth / 2),
            food.y * BLOCK_SIZE - (stemHeight / 2), // Adjusted for better visual center
            stemWidth, stemHeight
        );

        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        const highlightSize = Math.max(1, BLOCK_SIZE / 4);
        context.fillRect(
            food.x * BLOCK_SIZE + (BLOCK_SIZE / 5),
            food.y * BLOCK_SIZE + (BLOCK_SIZE / 5),
            highlightSize, highlightSize
        );
    }

    // --- Game Logic Functions (Keep checkCollision, gameOver, togglePause, updateScore/SpeedDisplay, save/loadHighScore as before, ensure UI text uses Chinese where appropriate) ---
    function checkCollision() { /* ... (Keep implementation) ... */ const head = snake[0]; if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) { return true; } for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) { return true; } } return false; }
    function gameOver() { /* ... (Keep implementation, ensure text uses Chinese) ... */ isGameOver = true; clearTimeout(gameLoopTimeout); if (score > highScore) { highScore = score; saveHighScore(); } updateScoreDisplay(); messageText.innerHTML = `GAME OVER<br>SCORE: ${score}<br>MAX: ${highScore}`; startButton.textContent = 'AGAIN'; gameMessageScreen.style.display = 'flex'; }
    function togglePause() { /* ... (Keep implementation, ensure text uses Chinese) ... */ if (isGameOver) return; isPaused = !isPaused; if (isPaused) { clearTimeout(gameLoopTimeout); pauseScreen.style.display = 'flex'; pauseButton.textContent = 'RESUME'; } else { pauseScreen.style.display = 'none'; pauseButton.textContent = 'PAUSE'; gameLoop(); } }
    function updateScoreDisplay() { /* ... (Keep implementation) ... */ scoreElement.textContent = score; highScoreElement.textContent = highScore; }
    function updateSpeedDisplay() { /* ... (Keep implementation) ... */ speedLevelElement.textContent = speedLevel; }
    function saveHighScore() { /* ... (Keep implementation) ... */ try { localStorage.setItem('pixelSnakeMobileV1', highScore); } catch(e) { console.warn("FAIL SAVE"); } } // New key for mobile
    function loadHighScore() { /* ... (Keep implementation) ... */ try { const savedScore = localStorage.getItem('pixelSnakeMobileV1'); highScore = savedScore ? parseInt(savedScore, 10) : 0; } catch(e) { highScore = 0; console.warn("FAIL LOAD MAX"); } }

    // --- Input Handling ---
    function changeDirection(newDx, newDy) {
        if (isPaused || isGameOver) return;
        // Prevent 180-degree turns
        const goingUp = dy === -1; const goingDown = dy === 1;
        const goingLeft = dx === -1; const goingRight = dx === 1;

        if (newDx === -1 && goingRight) return; // Trying to go left while going right
        if (newDx === 1 && goingLeft) return;   // Trying to go right while going left
        if (newDy === -1 && goingDown) return;  // Trying to go up while going down
        if (newDy === 1 && goingUp) return;     // Trying to go down while going up

        dx = newDx; dy = newDy;
    }
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (isGameOver && e.key === 'Enter') { initGame(); return; }
        if (e.key.toLowerCase() === 'p' || e.key === "Escape") { togglePause(); return; }
        if (isPaused || isGameOver) return;

        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A': changeDirection(-1, 0); break;
            case 'ArrowUp': case 'w': case 'W': changeDirection(0, -1); break;
            case 'ArrowRight': case 'd': case 'D': changeDirection(1, 0); break;
            case 'ArrowDown': case 's': case 'S': changeDirection(0, 1); break;
        }
    });
    // D-Pad Touch / Click
    function setupDirectionButton(buttonElement, newDx, newDy) {
        const handlePress = (e) => {
            e.preventDefault();
            changeDirection(newDx, newDy);
            buttonElement.classList.add('active-touch');
            setTimeout(() => buttonElement.classList.remove('active-touch'), 150); // Visual feedback
        };
        buttonElement.addEventListener('click', handlePress); // For desktop clicks
        buttonElement.addEventListener('touchstart', handlePress, { passive: false });
    }
    if(upButton) setupDirectionButton(upButton, 0, -1);
    if(downButton) setupDirectionButton(downButton, 0, 1);
    if(leftButton) setupDirectionButton(leftButton, -1, 0);
    if(rightButton) setupDirectionButton(rightButton, 1, 0);

    // Start and Pause Buttons
    startButton.addEventListener('click', initGame);
    startButton.addEventListener('touchstart', (e) => { e.preventDefault(); initGame(); }, { passive: false });
    pauseButton.addEventListener('click', togglePause);
    pauseButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        togglePause();
        pauseButton.classList.add('active-touch');
        setTimeout(() => pauseButton.classList.remove('active-touch'), 150);
    }, { passive: false });

    // --- Window Resize Logic ---
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized or orientation changed");
            resizeCanvas();

            if (isGameOver || !gameLoopTimeout && !isPaused) { // If game not actively running
                initializeUI(false); // Redraw initial UI without resetting scores
            } else if (!isPaused) {
                // If game is running, a full restart might be best for snake due to BLOCK_SIZE change
                // Or, attempt to redraw current state (more complex to scale snake/food positions)
                // For simplicity, let's re-init if game was running
                // This will effectively "restart" the current level if resized mid-game.
                // Alternatively, just clear and redraw, but positions might be off.
                // gameOver(); // End current game
                // messageText.innerHTML = "屏幕尺寸已更改<br>请重新开始";
                // startButton.textContent = "开始";
                // gameMessageScreen.style.display = 'flex';

                // Simpler: just clear and redraw current state. User might need to adapt.
                clearTimeout(gameLoopTimeout); // Stop current loop
                clearCanvas();
                if (food) drawFood(); // Redraw food if it exists
                if (snake) drawSnake(); // Redraw snake if it exists
                if (!isGameOver && !isPaused) gameLoop(); // Restart loop if it was running
            }
        }, 100); // Debounce
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);


    // --- Initial UI Setup ---
    function initializeUI(isFirstLoad = true) {
        console.log("Initializing UI...");
        resizeCanvas(); // Important: size canvas first

        if (isFirstLoad) {
            loadHighScore();
            score = 0;
            speedLevel = 1;
            isGameOver = true; // Game starts in "game over" state, waiting for start
            isPaused = false;
        }
        updateScoreDisplay();
        updateSpeedDisplay();

        messageText.innerHTML = "SNAKE!<br>EAT APPLE!"; // Chinese
        startButton.textContent = 'START';
        pauseButton.textContent = 'PAUSE';
        gameMessageScreen.style.display = 'flex';
        pauseScreen.style.display = 'none';
        // if (snakeImageElement) snakeImageElement.style.display = 'none';

        // Draw initial preview
        clearCanvas(); // Clear with new BLOCK_SIZE
        // Draw a simple preview if canvas is ready
        if (BLOCK_SIZE > 0) {
            context.fillStyle = SNAKE_HEAD_COLOR;
            context.fillRect(Math.floor(GRID_SIZE / 2 - 2) * BLOCK_SIZE, Math.floor(GRID_SIZE / 2) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            context.fillStyle = FOOD_APPLE_RED;
            context.fillRect(Math.floor(GRID_SIZE / 2 + 1) * BLOCK_SIZE, Math.floor(GRID_SIZE / 2) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
        console.log("Initial UI drawn.");
    }

    // --- Particles Setup (Keep as is) ---
    if (window.particlesJS) { /* ... (Keep implementation from original script) ... */ particlesJS('particles-js', { "particles": { "number": { "value": 60, "density": { "enable": true, "value_area": 800 } }, "color": { "value": ["#306230", "#0f380f", "#e94560", "#ffffff"] }, "shape": { "type": "square", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 4 } }, "opacity": { "value": 0.3, "random": true, "anim": { "enable": true, "speed": 0.5, "opacity_min": 0.05, "sync": false } }, "size": { "value": 5, "random": true, "anim": { "enable": false, "speed": 10, "size_min": 2, "sync": false } }, "line_linked": { "enable": false, "distance": 150, "color": "#ffffff", "opacity": 0.1, "width": 1 }, "move": { "enable": true, "speed": 1.5, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 100, "line_linked": { "opacity": 0.3 } }, "bubble": { "distance": 200, "size": 10, "duration": 2, "opacity": 0.8, "speed": 3 }, "repulse": { "distance": 150, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true }); } else { console.error("particles.js library not loaded."); }


    // --- Start ---
    initializeUI(true); // Setup the initial screen

}); // End DOMContentLoaded