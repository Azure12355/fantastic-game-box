document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('tetrisCanvas');
    const context = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('nextPieceCanvas');
    const nextPieceContext = nextPieceCanvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const restartButton = document.getElementById('restartButton'); // From game over screen
    const gameOverScreen = document.getElementById('gameOverScreen');
    const pauseScreen = document.getElementById('pauseScreen');
    // D-Pad buttons
    const rotateButton = document.getElementById('rotateButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const downButton = document.getElementById('downButton');

    // --- Game Constants ---
    const COLS = 10;
    const ROWS = 20;
    let BLOCK_SIZE; // Calculated dynamically
    let NEXT_PIECE_BLOCK_SIZE; // Calculated for preview

    const PIECES = [ /* ... (Keep PIECES array as is) ... */ { shape: [[1, 1, 1, 1]], color: '#00FFFF' }, { shape: [[1, 1], [1, 1]], color: '#FFFF00' }, { shape: [[0, 1, 0], [1, 1, 1]], color: '#FF00FF' }, { shape: [[1, 1, 0], [0, 1, 1]], color: '#00FF00' }, { shape: [[0, 1, 1], [1, 1, 0]], color: '#FF0000' }, { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' }, { shape: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' } ];

    // --- Game State ---
    let board = [];
    let currentPiece;
    let nextPiece;
    let score = 0;
    let level = 1;
    let linesCleared = 0;
    let gameInterval;
    let dropSpeed = 1000;
    let isPaused = false;
    let isGameOver = false;

    // --- Canvas Setup & Resizing ---
    function resizeCanvases() {
        const gameScreenContainer = document.getElementById('gameScreenContainer');
        const containerStyle = getComputedStyle(gameScreenContainer);
        let containerWidth = parseFloat(containerStyle.width);
        let containerHeight = parseFloat(containerStyle.height);

        if (isNaN(containerWidth) || isNaN(containerHeight) || containerWidth <= 0 || containerHeight <= 0) {
            console.warn("Invalid container dimensions for Tetris canvas:", containerWidth, containerHeight);
            // Fallback to a default if CSS dimensions aren't ready (e.g., during initial load very quickly)
            containerWidth = 200; containerHeight = 400; // Default aspect
        }

        // Calculate BLOCK_SIZE for main canvas based on container and COLS/ROWS ratio
        const blockW = containerWidth / COLS;
        const blockH = containerHeight / ROWS;
        BLOCK_SIZE = Math.min(blockW, blockH); // Use smaller dimension to fit

        canvas.width = COLS * BLOCK_SIZE;
        canvas.height = ROWS * BLOCK_SIZE;
        // context.scale(BLOCK_SIZE, BLOCK_SIZE); // Scaling is now problematic with dynamic BLOCK_SIZE
        // Instead of scaling context, we'll multiply by BLOCK_SIZE in draw functions.

        // Next piece canvas (fixed size defined by CSS: 60x60, or 40x40 on mobile)
        const nextCanvasStyle = getComputedStyle(nextPieceCanvas);
        nextPieceCanvas.width = parseFloat(nextCanvasStyle.width);
        nextPieceCanvas.height = parseFloat(nextCanvasStyle.height);
        NEXT_PIECE_BLOCK_SIZE = nextPieceCanvas.width / 4; // Assuming a 4x4 grid for preview

        console.log(`Main Canvas: ${canvas.width}x${canvas.height}, BLOCK_SIZE: ${BLOCK_SIZE.toFixed(2)}`);
        console.log(`Next Piece Canvas: ${nextPieceCanvas.width}x${nextPieceCanvas.height}, NEXT_BLOCK_SIZE: ${NEXT_PIECE_BLOCK_SIZE.toFixed(2)}`);

        // Update CSS variables for aspect ratio (if using them in CSS)
        document.body.style.setProperty('--cols', COLS);
        document.body.style.setProperty('--rows', ROWS);

        // Redraw if game is active but paused, or if game over/not started
        if ((!isGameOver && isPaused) || isGameOver || !gameInterval) {
            draw(); // This will now use the new BLOCK_SIZE
            drawNextPiece();
        }
    }


    // --- Game Logic (Functions need to use BLOCK_SIZE for drawing) ---
    function createBoard() { /* ... (Keep as is) ... */ return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
    function getRandomPiece() { /* ... (Keep as is) ... */ const randomIndex = Math.floor(Math.random() * PIECES.length); const pieceData = PIECES[randomIndex]; return { shape: pieceData.shape.map(row => row.slice()), color: pieceData.color, x: Math.floor(COLS / 2) - Math.floor(pieceData.shape[0].length / 2), y: 0 }; }

    function spawnNewPiece() {
        currentPiece = nextPiece || getRandomPiece();
        nextPiece = getRandomPiece();
        if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameOver();
        }
    }

    function draw() { // Modified for dynamic BLOCK_SIZE
        if (isGameOver && gameOverScreen.style.display === 'none') return; // Don't draw if game over screen is not yet shown
        if (isPaused && pauseScreen.style.display === 'none') return;

        // Clear main canvas
        context.fillStyle = '#1a1c1e';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw board
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = value;
                    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    context.strokeStyle = '#000';
                    context.lineWidth = Math.max(0.5, BLOCK_SIZE * 0.025); // Scaled outline
                    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });

        // Draw current piece
        if (currentPiece) {
            drawPiece(currentPiece, context, BLOCK_SIZE);
        }
        // No need to call drawNextPiece here, it's called separately or after spawn
    }

    function drawPiece(piece, ctx, blockSize) { // Added blockSize parameter
        ctx.fillStyle = piece.color;
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize, blockSize);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = Math.max(0.5, blockSize * 0.025);
                    ctx.strokeRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize, blockSize);
                }
            });
        });
    }

    function drawNextPiece() { // Modified for dynamic NEXT_PIECE_BLOCK_SIZE
        nextPieceContext.fillStyle = '#1a1c1e';
        nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        if (nextPiece) {
            const shape = nextPiece.shape;
            const shapeWidth = shape[0].length;
            const shapeHeight = shape.length;
            // Center in a 4x4 grid conceptual space
            const offsetX = (4 - shapeWidth) / 2;
            const offsetY = (4 - shapeHeight) / 2;

            nextPieceContext.fillStyle = nextPiece.color;
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        nextPieceContext.fillRect(
                            (offsetX + x) * NEXT_PIECE_BLOCK_SIZE,
                            (offsetY + y) * NEXT_PIECE_BLOCK_SIZE,
                            NEXT_PIECE_BLOCK_SIZE, NEXT_PIECE_BLOCK_SIZE
                        );
                        nextPieceContext.strokeStyle = '#000';
                        nextPieceContext.lineWidth = Math.max(0.5, NEXT_PIECE_BLOCK_SIZE * 0.05);
                        nextPieceContext.strokeRect(
                            (offsetX + x) * NEXT_PIECE_BLOCK_SIZE,
                            (offsetY + y) * NEXT_PIECE_BLOCK_SIZE,
                            NEXT_PIECE_BLOCK_SIZE, NEXT_PIECE_BLOCK_SIZE
                        );
                    }
                });
            });
        }
    }

    // --- Logic Functions (movePiece, rotatePiece, checkCollision, lockPiece, clearLines, calculateScore, updateScoreAndLevel, dropPiece - Keep their internal logic, ensure they don't directly rely on scaled context) ---
    function movePiece(dx, dy) { /* ... (Keep as is) ... */ if (isGameOver || isPaused || !currentPiece) return false; if (!checkCollision(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) { currentPiece.x += dx; currentPiece.y += dy; return true; } return false; }
    function rotatePiece() { /* ... (Keep as is, wall kick logic might need review with dynamic BLOCK_SIZE if it used it for pixel offsets) ... */ if (isGameOver || isPaused || !currentPiece) return; const shape = currentPiece.shape; const N = shape.length; const M = shape[0].length; let newShape = Array.from({ length: M }, () => Array(N).fill(0)); for (let r = 0; r < N; r++) { for (let c = 0; c < M; c++) { if (shape[r][c]) { newShape[c][N - 1 - r] = shape[r][c]; } } } let originalX = currentPiece.x; if (checkCollision(newShape, currentPiece.x, currentPiece.y)) { if (!checkCollision(newShape, currentPiece.x + 1, currentPiece.y)) { currentPiece.x += 1; } else if (!checkCollision(newShape, currentPiece.x - 1, currentPiece.y)) { currentPiece.x -= 1; } else if (M > 2 && !checkCollision(newShape, currentPiece.x + 2, currentPiece.y)) { currentPiece.x += 2; } else if (M > 2 && !checkCollision(newShape, currentPiece.x - 2, currentPiece.y)) { currentPiece.x -= 2; } else { currentPiece.x = originalX; return; } } currentPiece.shape = newShape; }
    function checkCollision(shape, x, y) { /* ... (Keep as is) ... */ for (let r = 0; r < shape.length; r++) { for (let c = 0; c < shape[r].length; c++) { if (shape[r][c]) { let newX = x + c; let newY = y + r; if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >=0 && board[newY] && board[newY][newX] !== 0)) { return true; } } } } return false; }
    function lockPiece() { /* ... (Keep as is) ... */ if (!currentPiece) return; currentPiece.shape.forEach((row, r) => { row.forEach((value, c) => { if (value) { if (currentPiece.y + r < 0) { gameOver(); return; } if(board[currentPiece.y + r]) board[currentPiece.y + r][currentPiece.x + c] = currentPiece.color; else { gameOver(); return;} } }); }); clearLines(); spawnNewPiece(); drawNextPiece(); /* Update preview after spawn */ }
    function clearLines() { /* ... (Keep as is) ... */ let linesClearedThisTurn = 0; for (let r = ROWS - 1; r >= 0; r--) { if (board[r].every(cell => cell !== 0)) { board.splice(r, 1); board.unshift(Array(COLS).fill(0)); linesClearedThisTurn++; r++; } } if (linesClearedThisTurn > 0) { linesCleared += linesClearedThisTurn; score += calculateScore(linesClearedThisTurn); updateScoreAndLevel(); } }
    function calculateScore(clearedCount) { /* ... (Keep as is) ... */ let points = 0; switch (clearedCount) { case 1: points = 100 * level; break; case 2: points = 300 * level; break; case 3: points = 500 * level; break; case 4: points = 800 * level; break; } return points; }
    function updateScoreAndLevel() { /* ... (Keep as is) ... */ scoreElement.textContent = score; const newLevel = Math.floor(linesCleared / 10) + 1; if (newLevel > level) { level = newLevel; levelElement.textContent = level; dropSpeed = Math.max(100, 1000 - (level - 1) * 50); if (gameInterval && !isPaused && !isGameOver) { clearInterval(gameInterval); gameInterval = setInterval(gameTick, dropSpeed); } } }
    function dropPiece() { /* ... (Keep as is) ... */ if (!movePiece(0, 1)) { lockPiece(); } }

    function gameTick() { // Renamed from gameLoop to avoid confusion with the interval setup
        if (isPaused || isGameOver) return;
        dropPiece();
        draw();
    }

    function startGame() {
        console.log("Starting game...");
        if (gameInterval) clearInterval(gameInterval);
        resizeCanvases(); // Ensure canvases are sized before game starts

        board = createBoard();
        score = 0; level = 1; linesCleared = 0;
        dropSpeed = 1000;
        isPaused = false; isGameOver = false;

        gameOverScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        startButton.textContent = 'START'; // Or disable during game
        pauseButton.textContent = 'PAUSE';


        updateScoreAndLevel();
        nextPiece = getRandomPiece(); // Pre-populate nextPiece
        spawnNewPiece();      // Sets currentPiece from nextPiece, generates new nextPiece
        drawNextPiece();      // Draw the new nextPiece

        gameInterval = setInterval(gameTick, dropSpeed);
        draw(); // Initial draw of board and current piece
        console.log("Game started.");
    }

    function togglePause() { /* ... (Keep as is, ensure button text changes) ... */ if (isGameOver) return; isPaused = !isPaused; if (isPaused) { clearInterval(gameInterval); pauseScreen.style.display = 'flex'; pauseButton.textContent = 'RESUME'; } else { gameInterval = setInterval(gameTick, dropSpeed); pauseScreen.style.display = 'none'; pauseButton.textContent = 'PAUSE'; draw(); } }
    function gameOver() { /* ... (Keep as is, ensure button text changes) ... */ isGameOver = true; clearInterval(gameInterval); gameOverScreen.style.display = 'flex'; startButton.textContent = 'RETRY'; /* Or a different label */ }

    // --- Event Listeners ---
    // Keyboard
    document.addEventListener('keydown', event => {
        if (event.key === 'Enter' && isGameOver) {startGame(); return; }
        if (event.key.toLowerCase() === 'p' || event.key === "Escape") {togglePause(); return; }
        if (isGameOver || isPaused) return;

        let actionTaken = false;
        switch (event.key.toLowerCase()) {
            case 'arrowleft': case 'a': movePiece(-1, 0); actionTaken = true; break;
            case 'arrowright': case 'd': movePiece(1, 0); actionTaken = true; break;
            case 'arrowdown': case 's': dropPiece(); score += 1 * level; updateScoreAndLevel(); actionTaken = true; break;
            case 'arrowup': case 'w': case ' ': rotatePiece(); actionTaken = true; break;
        }
        if (actionTaken) draw();
    });

    // Touch / Click for Buttons
    function addButtonListener(button, actionFn) {
        button.addEventListener('click', actionFn);
        button.addEventListener('touchstart', (e) => {
            e.preventDefault(); actionFn();
            button.classList.add('active-touch'); // Visual feedback
            setTimeout(() => button.classList.remove('active-touch'), 150);
        }, { passive: false });
    }

    addButtonListener(startButton, () => { if (isGameOver || startButton.textContent.toUpperCase() === 'START') startGame(); });
    addButtonListener(pauseButton, togglePause);
    addButtonListener(restartButton, startGame); // For game over screen

    addButtonListener(leftButton, () => { if (!isPaused && !isGameOver && currentPiece) { movePiece(-1, 0); draw(); } });
    addButtonListener(rightButton, () => { if (!isPaused && !isGameOver && currentPiece) { movePiece(1, 0); draw(); } });
    addButtonListener(downButton, () => { if (!isPaused && !isGameOver && currentPiece) { dropPiece(); score += 1 * level; updateScoreAndLevel(); draw(); } });
    addButtonListener(rotateButton, () => { if (!isPaused && !isGameOver && currentPiece) { rotatePiece(); draw(); } });


    // --- Window Resize Logic ---
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized or orientation changed");
            resizeCanvases(); // This will recalculate BLOCK_SIZE and resize canvases

            if (isGameOver || (!gameInterval && !isPaused)) { // If game not actively running
                initializeUI(false); // Redraw initial UI without resetting scores/level
            } else if (!isPaused) {
                // If game is running and not paused, just redraw everything
                draw();
                drawNextPiece();
            }
            // If paused, draw() is already handled by resizeCanvases if needed
        }, 100); // Debounce
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // --- Initial UI Setup ---
    function initializeUI(isFirstLoad = true) {
        console.log("Initializing UI...");
        resizeCanvases(); // Set canvas sizes first

        if (isFirstLoad) {
            board = createBoard(); // Create an empty board for initial draw
            score = 0; level = 1; linesCleared = 0;
            isGameOver = true; isPaused = false; // Start in a "ready to start" state
            nextPiece = PIECES[Math.floor(Math.random() * PIECES.length)]; // Show a random next piece
        }
        updateScoreAndLevel();
        gameOverScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        startButton.textContent = 'START';
        pauseButton.textContent = 'PAUSE';

        // Draw empty board and preview
        draw(); // Draws the board (empty if first load)
        drawNextPiece();

        // Draw "PRESS START" message if it's the first load and game is over
        if (isFirstLoad && isGameOver && BLOCK_SIZE > 0) {
            context.fillStyle = 'rgba(255,255,255,0.7)';
            const fontSize = Math.max(0.8, BLOCK_SIZE / 20 * 0.8); // Scale font size
            context.font = `${fontSize * BLOCK_SIZE}px "Press Start 2P"`; // Apply BLOCK_SIZE to font
            context.textAlign = 'center';
            context.fillText("PRESS START", canvas.width / 2, canvas.height / 2 - BLOCK_SIZE);
            context.fillText("TO PLAY", canvas.width / 2, canvas.height / 2 + BLOCK_SIZE);
        }
         console.log("Initial UI drawn.");
    }

    // --- Start ---
    initializeUI(true); // Setup the initial screen

}); // End DOMContentLoaded