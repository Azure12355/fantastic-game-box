document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetrisCanvas');
    const context = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('nextPieceCanvas');
    const nextPieceContext = nextPieceCanvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const restartButton = document.getElementById('restartButton');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const pauseScreen = document.getElementById('pauseScreen');

    // Game constants
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 20; // Pixel size of each block
    const NEXT_PIECE_BLOCK_SIZE = 15; // For the smaller preview canvas

    // Tetrominoes and their colors
    const PIECES = [
        { shape: [[1, 1, 1, 1]], color: '#00FFFF' }, // I
        { shape: [[1, 1], [1, 1]], color: '#FFFF00' }, // O
        { shape: [[0, 1, 0], [1, 1, 1]], color: '#FF00FF' }, // T
        { shape: [[1, 1, 0], [0, 1, 1]], color: '#00FF00' }, // S
        { shape: [[0, 1, 1], [1, 1, 0]], color: '#FF0000' }, // Z
        { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' }, // J
        { shape: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' }  // L
    ];

    let board = [];
    let currentPiece;
    let nextPiece;
    let score = 0;
    let level = 1;
    let linesCleared = 0;
    let gameInterval;
    let dropSpeed = 1000; // Milliseconds
    let isPaused = false;
    let isGameOver = false;

    // Canvas setup
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    context.scale(BLOCK_SIZE, BLOCK_SIZE); // Scale context for easier drawing

    nextPieceCanvas.width = 4 * NEXT_PIECE_BLOCK_SIZE;
    nextPieceCanvas.height = 4 * NEXT_PIECE_BLOCK_SIZE;
    nextPieceContext.scale(NEXT_PIECE_BLOCK_SIZE, NEXT_PIECE_BLOCK_SIZE);

    // --- Game Logic ---

    function createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function getRandomPiece() {
        const randomIndex = Math.floor(Math.random() * PIECES.length);
        const pieceData = PIECES[randomIndex];
        return {
            shape: pieceData.shape.map(row => row.slice()), // Deep copy
            color: pieceData.color,
            x: Math.floor(COLS / 2) - Math.floor(pieceData.shape[0].length / 2),
            y: 0
        };
    }

    function spawnNewPiece() {
        currentPiece = nextPiece || getRandomPiece();
        nextPiece = getRandomPiece();
        if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameOver();
        }
    }

    function draw() {
        if (isGameOver || isPaused) return;

        // Clear main canvas
        context.fillStyle = '#1a1c1e'; // Screen background
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw board
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = value; // Stored color
                    context.fillRect(x, y, 1, 1);
                    context.strokeStyle = '#000'; // Block outline
                    context.lineWidth = 0.05;
                    context.strokeRect(x, y, 1, 1);
                }
            });
        });

        // Draw current piece
        if (currentPiece) {
            drawPiece(currentPiece, context);
        }

        // Draw next piece preview
        drawNextPiece();
    }
    
    function drawPiece(piece, ctx) {
        ctx.fillStyle = piece.color;
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillRect(piece.x + x, piece.y + y, 1, 1);
                    ctx.strokeStyle = '#000'; // Block outline
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(piece.x + x, piece.y + y, 1, 1);
                }
            });
        });
    }

    function drawNextPiece() {
        nextPieceContext.fillStyle = '#1a1c1e'; // Preview background
        nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        if (nextPiece) {
            // Center the piece in the preview
            const shape = nextPiece.shape;
            const shapeWidth = shape[0].length;
            const shapeHeight = shape.length;
            const offsetX = (4 - shapeWidth) / 2;
            const offsetY = (4 - shapeHeight) / 2;

            nextPieceContext.fillStyle = nextPiece.color;
            shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        nextPieceContext.fillRect(offsetX + x, offsetY + y, 1, 1);
                        nextPieceContext.strokeStyle = '#000';
                        nextPieceContext.lineWidth = 0.1;
                        nextPieceContext.strokeRect(offsetX + x, offsetY + y, 1, 1);
                    }
                });
            });
        }
    }

    function movePiece(dx, dy) {
        if (isGameOver || isPaused || !currentPiece) return false;
        if (!checkCollision(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) {
            currentPiece.x += dx;
            currentPiece.y += dy;
            return true;
        }
        return false;
    }

    function rotatePiece() {
        if (isGameOver || isPaused || !currentPiece) return;

        const shape = currentPiece.shape;
        const N = shape.length;
        const M = shape[0].length;
        let newShape = Array.from({ length: M }, () => Array(N).fill(0));

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < M; c++) {
                if (shape[r][c]) {
                    newShape[c][N - 1 - r] = shape[r][c];
                }
            }
        }
        
        // Wall kick (simple version)
        let originalX = currentPiece.x;
        if (checkCollision(newShape, currentPiece.x, currentPiece.y)) {
            // Try moving 1 right
            if (!checkCollision(newShape, currentPiece.x + 1, currentPiece.y)) {
                currentPiece.x += 1;
            } 
            // Try moving 1 left
            else if (!checkCollision(newShape, currentPiece.x - 1, currentPiece.y)) {
                currentPiece.x -= 1;
            } 
            // Try moving 2 right (for I piece mostly)
            else if (M > 2 && !checkCollision(newShape, currentPiece.x + 2, currentPiece.y)) {
                currentPiece.x += 2;
            }
            // Try moving 2 left
            else if (M > 2 && !checkCollision(newShape, currentPiece.x - 2, currentPiece.y)) {
                currentPiece.x -= 2;
            }
            else { // Can't rotate
                currentPiece.x = originalX; // Revert X if kick failed
                return;
            }
        }
        currentPiece.shape = newShape;
    }

    function checkCollision(shape, x, y) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    let newX = x + c;
                    let newY = y + r;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >=0 && board[newY][newX] !== 0)) {
                        return true; // Collision
                    }
                }
            }
        }
        return false; // No collision
    }

    function lockPiece() {
        if (!currentPiece) return;
        currentPiece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value) {
                    if (currentPiece.y + r < 0) { // Piece locked above screen (very rare, but a safeguard)
                        gameOver();
                        return;
                    }
                    board[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
                }
            });
        });
        clearLines();
        spawnNewPiece();
    }

    function clearLines() {
        let linesClearedThisTurn = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r].every(cell => cell !== 0)) {
                board.splice(r, 1); // Remove row
                board.unshift(Array(COLS).fill(0)); // Add empty row at top
                linesClearedThisTurn++;
                r++; // Re-check the current row index as it's now a new row
            }
        }
        if (linesClearedThisTurn > 0) {
            linesCleared += linesClearedThisTurn;
            score += calculateScore(linesClearedThisTurn);
            updateScoreAndLevel();
        }
    }

    function calculateScore(clearedCount) {
        let points = 0;
        switch (clearedCount) {
            case 1: points = 100 * level; break;
            case 2: points = 300 * level; break;
            case 3: points = 500 * level; break;
            case 4: points = 800 * level; break; // Tetris!
        }
        return points;
    }

    function updateScoreAndLevel() {
        scoreElement.textContent = score;
        const newLevel = Math.floor(linesCleared / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            dropSpeed = Math.max(100, 1000 - (level - 1) * 50); // Increase speed
            if (gameInterval && !isPaused && !isGameOver) { // Only if game is running
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, dropSpeed);
            }
        }
    }
    
    function dropPiece() {
        if (!movePiece(0, 1)) {
            lockPiece();
        }
    }

    function gameLoop() {
        if (isPaused || isGameOver) return;
        dropPiece();
        draw();
    }

    function startGame() {
        if (gameInterval) clearInterval(gameInterval); // Clear existing interval if any
        board = createBoard();
        score = 0;
        level = 1;
        linesCleared = 0;
        dropSpeed = 1000;
        isPaused = false;
        isGameOver = false;
        
        gameOverScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        startButton.textContent = 'START'; // Reset button text

        updateScoreAndLevel();
        spawnNewPiece(); // Spawns current and next
        spawnNewPiece(); // Call again to correctly set current from next, and generate a new next

        gameInterval = setInterval(gameLoop, dropSpeed);
        draw(); // Initial draw
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(gameInterval);
            pauseScreen.style.display = 'flex';
            pauseButton.textContent = 'RESUME';
        } else {
            gameInterval = setInterval(gameLoop, dropSpeed);
            pauseScreen.style.display = 'none';
            pauseButton.textContent = 'PAUSE';
            draw(); // Redraw immediately after unpausing
        }
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        gameOverScreen.style.display = 'flex';
        startButton.textContent = 'RETRY'; // Or disable, depending on preference
    }

    // --- Event Listeners ---
    document.addEventListener('keydown', event => {
        if (isGameOver || isPaused) {
             if (event.key === 'Enter' && isGameOver) {
                startGame();
             } else if (event.key === 'p' || event.key === 'P' || event.key === "Escape") {
                togglePause();
             }
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                dropPiece(); // Move down faster
                score += 1 * level; // Small bonus for manual drop
                updateScoreAndLevel();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ': // Space bar
                rotatePiece();
                break;
            case 'p':
            case 'P':
            case 'Escape':
                togglePause();
                break;
        }
        draw(); // Redraw after any action
    });

    startButton.addEventListener('click', () => {
        if (isGameOver || startButton.textContent === 'START') { // Also covers first start
            startGame();
        }
    });
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', startGame); // From game over screen

    // On-screen D-pad controls
    document.getElementById('leftButton').addEventListener('click', () => {
        if (!isPaused && !isGameOver && currentPiece) movePiece(-1, 0); draw();
    });
    document.getElementById('rightButton').addEventListener('click', () => {
        if (!isPaused && !isGameOver && currentPiece) movePiece(1, 0); draw();
    });
    document.getElementById('downButton').addEventListener('click', () => {
        if (!isPaused && !isGameOver && currentPiece) {
            dropPiece();
            score += 1 * level;
            updateScoreAndLevel();
            draw();
        }
    });
    document.getElementById('rotateButton').addEventListener('click', () => {
        if (!isPaused && !isGameOver && currentPiece) rotatePiece(); draw();
    });


    // Initial UI state
    gameOverScreen.style.display = 'none';
    pauseScreen.style.display = 'none';
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    // Draw an empty board and preview initially
    board = createBoard();
    nextPiece = PIECES[0]; // Show an 'I' piece initially or any default
    draw(); 
    drawNextPiece(); // Draw placeholder next piece
    context.fillStyle = 'rgba(255,255,255,0.7)';
    context.font = '1px "Press Start 2P"';
    context.textAlign = 'center';
    context.fillText("PRESS START", COLS / 2, ROWS / 2 - 1);
    context.fillText("TO PLAY", COLS / 2, ROWS / 2 + 1);

});