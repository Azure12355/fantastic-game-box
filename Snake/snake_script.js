document.addEventListener('DOMContentLoaded', () => {
    // ... (所有现有的 snake_script.js 代码保持不变) ...
    const canvas = document.getElementById('snakeCanvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const speedLevelElement = document.getElementById('speedLevel');
    
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const snakeImageElement = document.getElementById('snakeImage'); // Optional
    const startButton = document.getElementById('startButton'); // This is now on the overlay
    const pauseButton = document.getElementById('pauseButton');
    const pauseScreen = document.getElementById('pauseScreen');

    // D-pad buttons
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');

    const GRID_SIZE = 20; 
    canvas.width = 300; 
    canvas.height = 300;
    const BLOCK_SIZE = canvas.width / GRID_SIZE; 

    const BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim();
    const SNAKE_HEAD_COLOR = '#0f380f'; 
    const SNAKE_BODY_COLOR = '#306230'; 
    const SNAKE_EYE_COLOR = '#FFFFFF'; 
    const FOOD_APPLE_RED = '#e94560'; 
    const FOOD_APPLE_STEM = '#5C3317'; 

    let snake, food, dx, dy, score, highScore = 0, gameLoopTimeout, currentSpeed, speedLevel, isPaused, isGameOver;

    const initialSpeed = 150; 
    const speedIncrement = 0.95; 
    const maxSpeedLevel = 10;

    function initGame() {
        snake = [ { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) } ]; 
        dx = 1; 
        dy = 0;
        score = 0;
        currentSpeed = initialSpeed;
        speedLevel = 1;
        isPaused = false;
        isGameOver = false;

        updateScoreDisplay();
        updateSpeedDisplay();
        loadHighScore();
        placeFood();

        gameMessageScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        pauseButton.textContent = 'PAUSE';
        if (snakeImageElement) snakeImageElement.style.display = 'none';

        clearTimeout(gameLoopTimeout);
        gameLoop();
    }

    function gameLoop() {
        if (isPaused || isGameOver) return;

        gameLoopTimeout = setTimeout(() => {
            clearCanvas();
            moveSnake();
            drawFood();
            drawSnake();
            
            if (checkCollision()) {
                gameOver();
                return;
            }
            gameLoop();
        }, currentSpeed);
    }

    function clearCanvas() {
        context.fillStyle = BG_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = 'rgba(15, 56, 15, 0.1)'; 
        context.lineWidth = 1;
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
            if (index === 0) { 
                context.fillStyle = SNAKE_HEAD_COLOR;
                context.fillRect(segment.x * BLOCK_SIZE, segment.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                
                context.fillStyle = SNAKE_EYE_COLOR;
                const eyeSize = BLOCK_SIZE / 5;
                const eyeOffset1 = BLOCK_SIZE / 4;
                const eyeOffset2 = BLOCK_SIZE - BLOCK_SIZE / 4 - eyeSize;

                if (dx === 1) { 
                    context.fillRect((segment.x + 0.6) * BLOCK_SIZE, (segment.y + 0.2) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.6) * BLOCK_SIZE, (segment.y + 0.8 - eyeSize/BLOCK_SIZE*2) * BLOCK_SIZE, eyeSize, eyeSize);
                } else if (dx === -1) { 
                     context.fillRect((segment.x + 0.2) * BLOCK_SIZE, (segment.y + 0.2) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.2) * BLOCK_SIZE, (segment.y + 0.8 - eyeSize/BLOCK_SIZE*2) * BLOCK_SIZE, eyeSize, eyeSize);
                } else if (dy === 1) { 
                    context.fillRect((segment.x + 0.2) * BLOCK_SIZE, (segment.y + 0.6) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.8 - eyeSize/BLOCK_SIZE*2) * BLOCK_SIZE, (segment.y + 0.6) * BLOCK_SIZE, eyeSize, eyeSize);
                } else if (dy === -1) { 
                    context.fillRect((segment.x + 0.2) * BLOCK_SIZE, (segment.y + 0.2) * BLOCK_SIZE, eyeSize, eyeSize);
                    context.fillRect((segment.x + 0.8 - eyeSize/BLOCK_SIZE*2) * BLOCK_SIZE, (segment.y + 0.2) * BLOCK_SIZE, eyeSize, eyeSize);
                }

            } else { 
                context.fillStyle = SNAKE_BODY_COLOR;
                context.fillRect(segment.x * BLOCK_SIZE + 1, segment.y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                context.strokeStyle = SNAKE_HEAD_COLOR; 
                context.lineWidth = 1;
                context.strokeRect(segment.x * BLOCK_SIZE + 0.5, segment.y * BLOCK_SIZE + 0.5, BLOCK_SIZE -1, BLOCK_SIZE -1);
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
        
        context.fillStyle = FOOD_APPLE_STEM;
        context.fillRect(food.x * BLOCK_SIZE + (BLOCK_SIZE / 2) - (BLOCK_SIZE / 8), food.y * BLOCK_SIZE - (BLOCK_SIZE / 4), BLOCK_SIZE / 4, BLOCK_SIZE / 3);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.fillRect(food.x * BLOCK_SIZE + (BLOCK_SIZE / 5), food.y * BLOCK_SIZE + (BLOCK_SIZE / 5), BLOCK_SIZE / 4, BLOCK_SIZE / 4);
    }

    function checkCollision() {
        const head = snake[0];
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return true;
        }
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        return false;
    }

    function gameOver() {
        isGameOver = true;
        clearTimeout(gameLoopTimeout);
        if (score > highScore) {
            highScore = score;
            saveHighScore();
            updateScoreDisplay(); 
        }
        messageText.innerHTML = `GAME OVER!<br>SCORE: ${score}<br>HIGH SCORE: ${highScore}`;
        if (snakeImageElement) snakeImageElement.style.display = 'block'; 
        startButton.textContent = 'RETRY';
        gameMessageScreen.style.display = 'flex';
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;
        if (isPaused) {
            clearTimeout(gameLoopTimeout);
            pauseScreen.style.display = 'flex';
            pauseButton.textContent = 'RESUME';
        } else {
            pauseScreen.style.display = 'none';
            pauseButton.textContent = 'PAUSE';
            gameLoop();
        }
    }

    function updateScoreDisplay() {
        scoreElement.textContent = score;
        highScoreElement.textContent = highScore;
    }
    
    function updateSpeedDisplay() {
        speedLevelElement.textContent = speedLevel;
    }

    function saveHighScore() {
        localStorage.setItem('snakeHighScore', highScore);
    }

    function loadHighScore() {
        const savedScore = localStorage.getItem('snakeHighScore');
        if (savedScore) {
            highScore = parseInt(savedScore, 10);
        } else {
            highScore = 0;
        }
        updateScoreDisplay();
    }

    function handleKeyPress(e) {
        if (isGameOver && e.key === 'Enter') {
            initGame();
            return;
        }
        if (isGameOver) return; 

        if (e.key === 'p' || e.key === 'P' || e.key === "Escape") {
            togglePause();
            return;
        }
        if (isPaused) return;


        const goingUp = dy === -1;
        const goingDown = dy === 1;
        const goingLeft = dx === -1;
        const goingRight = dx === 1;

        switch (e.key) {
            case 'ArrowLeft': case 'a': case 'A':
                if (!goingRight) { dx = -1; dy = 0; }
                break;
            case 'ArrowUp': case 'w': case 'W':
                if (!goingDown) { dx = 0; dy = -1; }
                break;
            case 'ArrowRight': case 'd': case 'D':
                if (!goingLeft) { dx = 1; dy = 0; }
                break;
            case 'ArrowDown': case 's': case 'S':
                if (!goingUp) { dx = 0; dy = 1; }
                break;
        }
    }
    
    upButton.addEventListener('click', () => { if(!isPaused && !isGameOver && !(dy === 1)) { dx = 0; dy = -1; } });
    downButton.addEventListener('click', () => { if(!isPaused && !isGameOver && !(dy === -1)) { dx = 0; dy = 1; } });
    leftButton.addEventListener('click', () => { if(!isPaused && !isGameOver && !(dx === 1)) { dx = -1; dy = 0; } });
    rightButton.addEventListener('click', () => { if(!isPaused && !isGameOver && !(dx === -1)) { dx = 1; dy = 0; } });

    document.addEventListener('keydown', handleKeyPress);
    startButton.addEventListener('click', initGame);
    pauseButton.addEventListener('click', togglePause);

    loadHighScore(); 
    messageText.innerHTML = "PIXEL SNAKE<br>GET THE APPLES!";
    startButton.textContent = 'START';
    if (snakeImageElement) snakeImageElement.style.display = 'none';
    gameMessageScreen.style.display = 'flex';
    clearCanvas(); 
    context.fillStyle = SNAKE_HEAD_COLOR;
    context.fillRect(Math.floor(GRID_SIZE / 2 - 1) * BLOCK_SIZE, Math.floor(GRID_SIZE / 2) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.fillStyle = FOOD_APPLE_RED;
    context.fillRect(Math.floor(GRID_SIZE / 2 + 2) * BLOCK_SIZE, Math.floor(GRID_SIZE / 2) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);


    // --- Particles.js Initialization ---
    // Make sure this is AFTER the DOMContentLoaded event has fully processed,
    // or at least after the #particles-js div is available.
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 60, // Number of particles
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": ["#306230", "#0f380f", "#e94560", "#ffffff"] // Snake body, head, apple, general white
                },
                "shape": {
                    "type": "square", // Use "square" for pixel feel, or "circle"
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 4 // For square
                    }
                },
                "opacity": {
                    "value": 0.3, // Base opacity
                    "random": true,
                    "anim": {
                        "enable": true,
                        "speed": 0.5,
                        "opacity_min": 0.05,
                        "sync": false
                    }
                },
                "size": {
                    "value": 5, // Particle size
                    "random": true,
                    "anim": {
                        "enable": false, // Can enable for pulsing size
                        "speed": 10,
                        "size_min": 2,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": false, // Set to true for connecting lines
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.1,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 1.5, // Speed of particles
                    "direction": "none", // "none", "top", "top-right", "right", etc. "none" is random
                    "random": true,
                    "straight": false,
                    "out_mode": "out", // "out", "bounce"
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab" // "grab", "bubble", "repulse"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push" // "push", "remove", "bubble"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 100,
                        "line_linked": {
                            "opacity": 0.3
                        }
                    },
                    "bubble": {
                        "distance": 200,
                        "size": 10,
                        "duration": 2,
                        "opacity": 0.8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 150,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4 // Number of particles to push on click
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    } else {
        console.error("particles.js library not loaded.");
    }

});