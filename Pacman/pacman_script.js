document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('pacmanCanvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const livesContainer = document.getElementById('livesContainer');
    const highScoreElement = document.getElementById('highScore');
    // const levelDisplayElement = document.getElementById('levelDisplay'); // Uncomment if level display is added back
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const startButton = document.getElementById('startButton');
    const levelCompleteScreen = document.getElementById('levelCompleteScreen');
    const restartButtonPanel = document.getElementById('restartButtonPanel');
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const pauseActionButton = document.getElementById('pauseActionButton');
    const gamePauseScreen = document.getElementById('pauseScreen');

    // --- Game Settings & Constants ---
    let TILE_SIZE = 20; // Initial default, will be recalculated based on canvas size & map
    let PELLET_RADIUS = 2; // Will be TILE_SIZE * 0.1
    let POWER_PELLET_RADIUS = 5; // Will be TILE_SIZE * 0.25 or 0.3

    const PACMAN_SPEED = 3.0; // Tiles per second
    const GHOST_SPEED = 2.8;
    const GHOST_FRIGHTENED_SPEED = 1.8;

    const POWER_PELLET_DURATION = 7000; // ms
    const GHOST_FLASH_START_TIME = 5000; // ms (start flashing when this much time is left)
    const GHOST_RESPAWN_TIME = 3000; // ms after being eaten

    const PLAYER_INITIAL_LIVES = 3;

    // Colors (Get from CSS, provide fallbacks)
    const WALL_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--wall-color').trim() || '#4fc3f7';
    const DOT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--dot-color').trim() || '#fff59d';
    const POWER_PELLET_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--power-pellet-color').trim() || '#ffffff';
    const PACMAN_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#ffdd57';
    const GHOST_COLORS = {
        blinky: getComputedStyle(document.documentElement).getPropertyValue('--ghost-red').trim() || '#ff7043',
        pinky: getComputedStyle(document.documentElement).getPropertyValue('--ghost-pink').trim() || '#ec407a',
        inky: getComputedStyle(document.documentElement).getPropertyValue('--ghost-cyan').trim() || '#26c6da',
        clyde: getComputedStyle(document.documentElement).getPropertyValue('--ghost-orange').trim() || '#ffa726',
    };
    const GHOST_FRIGHTENED_BODY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--ghost-frightened-body').trim() || '#64b5f6';
    const GHOST_FRIGHTENED_EYES_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--ghost-frightened-eyes').trim() || '#ffffff';
    const SCREEN_BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim() || '#1c1d30';

    // --- Maze Map (Using the larger example map) ---
    const level1Map = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,1,0,0,1,2,1,0,0,0,1,2,1,1,2,1,0,0,0,1,2,1,0,0,1,3,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0], // Tunnel row
        [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1], // Ghost house area
        [1,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,1], // Ghost house area (Ghost home tile = 4)
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1], // Ghost house area
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0], // Tunnel row
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,2,2,1,1,2,2,2,2,2,2,2,5,2,2,2,2,2,2,2,1,1,2,2,1,3,1], // Player start (5)
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    let currentMap = level1Map;
    let MAP_ROWS = currentMap.length;
    let MAP_COLS = currentMap[0].length;

    // --- Game State Variables ---
    let pacman = null; let ghosts = []; let dots = []; let powerPellets = [];
    let totalDots = 0; let score = 0; let lives = 0; let highScore = 0; let currentLevel = 1;
    let gameLoopId = null; let lastFrameTime = 0;
    let isPaused = false; let isGameOver = true; let frightenedMode = false; let frightenedTimer = 0;
    let ghostFlashState = false; // Used by Ghost class
    let currentDirection = ''; let nextDirection = ''; // For Pacman input
    let ghostRespawnTimers = {}; // { ghostName: timeoutId } - Handled within Ghost class instances now
    let ghostSpawnPoints = []; // Store spawn points found in initGame

    // --- Calculate Canvas and Tile Size ---
    function calculateSizes() {
        const screenContainer = document.getElementById('gameScreenContainer');
        // Ensure container has a clientWidth, otherwise use a fallback.
        // CSS should give game-screen-large a width, e.g. fixed or percentage.
        const containerStyle = getComputedStyle(screenContainer);
        const paddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
        const paddingY = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);
        
        const availableWidth = screenContainer.clientWidth - paddingX;
        const availableHeight = screenContainer.clientHeight - paddingY;

        TILE_SIZE = Math.floor(Math.min(availableWidth / MAP_COLS, availableHeight / MAP_ROWS));
        
        canvas.width = MAP_COLS * TILE_SIZE;
        canvas.height = MAP_ROWS * TILE_SIZE;

        PELLET_RADIUS = Math.max(1, TILE_SIZE * 0.1);
        POWER_PELLET_RADIUS = Math.max(3, TILE_SIZE * 0.25); // Adjusted scaling
    }


    // --- Utility Functions ---
    function getPixelPos(row, col) { return { x: col * TILE_SIZE, y: row * TILE_SIZE }; }
    function getGridPos(x, y) {
        const col = Math.floor(x / TILE_SIZE); const row = Math.floor(y / TILE_SIZE);
        return { row: Math.max(0, Math.min(MAP_ROWS - 1, row)), col: Math.max(0, Math.min(MAP_COLS - 1, col)) };
    }
    function isWall(row, col) {
        if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return true;
        return currentMap[row][col] === 1;
    }
    function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }


    // --- Game Object Classes ---
    class Character {
        constructor(startRow, startCol, color, speed) {
            const pos = getPixelPos(startRow, startCol);
            this.startRow = startRow; this.startCol = startCol;
            this.startX = pos.x + TILE_SIZE / 2; this.startY = pos.y + TILE_SIZE / 2;
            this.x = this.startX; this.y = this.startY;
            this.row = startRow; this.col = startCol;
            this.width = TILE_SIZE * 0.8; this.height = TILE_SIZE * 0.8;
            this.radius = TILE_SIZE * 0.4;
            this.color = color;
            this.baseSpeed = speed;
            this.currentSpeed = speed;
            this.direction = 'left'; this.nextDirection = 'left'; // Pacman starts left by default
            this.active = true;
        }
        draw(ctx) {} 
        update(deltaTime) {
             if (!this.active) return;
             const speedPixelsPerFrame = this.currentSpeed * TILE_SIZE * (deltaTime / 1000);
             this.move(speedPixelsPerFrame);
             
             // Update grid position based on pixel position
             const currentGridPos = getGridPos(this.x, this.y);
             this.row = currentGridPos.row;
             this.col = currentGridPos.col;
        }
        move(speed) {
             let targetRow = this.row; let targetCol = this.col;
             const centerOffsetX = TILE_SIZE / 2; const centerOffsetY = TILE_SIZE / 2;
             // Tolerance for grid alignment should be smaller than half tile, e.g., speed-dependent.
             const tolerance = speed / 2; // Or Math.min(TILE_SIZE / 4, speed / 2);

             const gridCenterX = this.col * TILE_SIZE + centerOffsetX;
             const gridCenterY = this.row * TILE_SIZE + centerOffsetY;

             // Attempt to turn if at a grid center and nextDirection is valid
             if (Math.abs(this.x - gridCenterX) < tolerance && Math.abs(this.y - gridCenterY) < tolerance) {
                 if (this.nextDirection && this.nextDirection !== this.direction) {
                     let nextGridRow = this.row; let nextGridCol = this.col;
                     if (this.nextDirection === 'up') nextGridRow--;
                     else if (this.nextDirection === 'down') nextGridRow++;
                     else if (this.nextDirection === 'left') nextGridCol--;
                     else if (this.nextDirection === 'right') nextGridCol++;

                     const isNextTunnel = (nextGridCol < 0 || nextGridCol >= MAP_COLS) && (currentMap[nextGridRow] && currentMap[nextGridRow][0] === 0 || currentMap[nextGridRow][MAP_COLS-1] === 0);

                     if (!isWall(nextGridRow, nextGridCol) || isNextTunnel) {
                         this.x = gridCenterX; this.y = gridCenterY; // Snap to grid center when turning
                         this.direction = this.nextDirection;
                     }
                 }
             }

             // Calculate target grid position based on current direction
             let tempTargetRow = this.row; let tempTargetCol = this.col;
             if (this.direction === 'up') tempTargetRow--;
             else if (this.direction === 'down') tempTargetRow++;
             else if (this.direction === 'left') tempTargetCol--;
             else if (this.direction === 'right') tempTargetCol++;
            
             const isCurrentInTunnel = (this.col <= 0 || this.col >= MAP_COLS -1) && (currentMap[this.row] && (currentMap[this.row][0] === 0 || currentMap[this.row][MAP_COLS-1] === 0));
             const isTargetInTunnel = (tempTargetCol < 0 || tempTargetCol >= MAP_COLS) && (currentMap[tempTargetRow] && (currentMap[tempTargetRow][0] === 0 || currentMap[tempTargetRow][MAP_COLS-1] === 0));


            // If moving along the grid line or if the way ahead is clear or is a tunnel
            if ( (this.direction === 'left' || this.direction === 'right') && Math.abs(this.y - gridCenterY) < tolerance ||
                 (this.direction === 'up' || this.direction === 'down') && Math.abs(this.x - gridCenterX) < tolerance ) {
                 // If the direct path is not a wall OR it's a tunnel entrance/exit
                 if (!isWall(tempTargetRow, tempTargetCol) || isTargetInTunnel) {
                    if (this.direction === 'up') this.y -= speed;
                    else if (this.direction === 'down') this.y += speed;
                    else if (this.direction === 'left') this.x -= speed;
                    else if (this.direction === 'right') this.x += speed;
                 } else {
                    // Snap to current grid center if blocked and aligned
                    this.x = gridCenterX; this.y = gridCenterY;
                 }
            } else { // If not aligned, try to align
                if (this.direction === 'up' && this.y > gridCenterY) this.y = Math.max(gridCenterY, this.y - speed);
                else if (this.direction === 'down' && this.y < gridCenterY) this.y = Math.min(gridCenterY, this.y + speed);
                else if (this.direction === 'left' && this.x > gridCenterX) this.x = Math.max(gridCenterX, this.x - speed);
                else if (this.direction === 'right' && this.x < gridCenterX) this.x = Math.min(gridCenterX, this.x + speed);
                // If already at center but path blocked (handled by previous block)
            }


             // Handle tunnel wrapping
             if (this.x < -TILE_SIZE / 2 && this.direction === 'left') this.x = canvas.width + TILE_SIZE / 2;
             else if (this.x > canvas.width + TILE_SIZE / 2 && this.direction === 'right') this.x = -TILE_SIZE / 2;
        }
        getBoundingBox() { const hW = this.width / 2; const hH = this.height / 2; return { x: this.x - hW, y: this.y - hH, width: this.width, height: this.height, active: this.active }; }
        getOppositeDirection(dir) { if (dir === 'up') return 'down'; if (dir === 'down') return 'up'; if (dir === 'left') return 'right'; if (dir === 'right') return 'left'; return null; }
        resetPosition() {
            this.x = this.startX; this.y = this.startY;
            const startPos = getGridPos(this.startX, this.startY);
            this.row = startPos.row; this.col = startPos.col;
            this.direction = (this instanceof Pacman) ? 'left' : 'up'; // Ghosts might start 'up' from house
            this.nextDirection = this.direction;
            this.active = true;
        }
    }

    class Pacman extends Character {
        constructor(startRow, startCol) { super(startRow, startCol, PACMAN_COLOR, PACMAN_SPEED); this.mouthOpen = 0; this.mouthSpeed = 0.15; this.lives = PLAYER_INITIAL_LIVES; }
        draw(ctx) {
             if (!this.active) return;
             this.mouthOpen += this.mouthSpeed; if (this.mouthOpen > 1 || this.mouthOpen < 0) { this.mouthSpeed *= -1; this.mouthOpen = Math.max(0, Math.min(1, this.mouthOpen));} 
             const angleOffset = Math.PI / 7 * this.mouthOpen; let startAngle = angleOffset; let endAngle = Math.PI * 2 - angleOffset; let rotation = 0; if (this.direction === 'right') rotation = 0; else if (this.direction === 'down') rotation = Math.PI / 2; else if (this.direction === 'left') rotation = Math.PI; else if (this.direction === 'up') rotation = -Math.PI / 2; ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(rotation); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, startAngle, endAngle); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        loseLife() { if (!this.active) return false; lives--; updateLivesDisplay(); if (lives <= 0) { this.active = false; return true; } else { resetCharacterPositions(); return false; }}
    }

    class Ghost extends Character {
        constructor(startRow, startCol, color, name) { 
            super(startRow, startCol, color, GHOST_SPEED); 
            this.name = name; 
            this.state = 'scatter'; // Initial state: 'scatter', 'chase', 'frightened', 'eaten'
            this.frightenedTimer = 0; 
            this.flashState = false; // For frightened flashing
            this.targetTile = { row: startRow, col: startCol }; 
            this.homeCorner = this.getHomeCorner(name); 
            this.currentSpeed = GHOST_SPEED;
            this.respawnTimerId = null; 
            this.isExitingHouse = (currentMap[startRow][startCol] === 4); // If started in ghost house
        }
        getHomeCorner(ghostName) { 
            switch(ghostName) { 
                case 'blinky': return { row: 0, col: MAP_COLS - 1 }; 
                case 'pinky': return { row: 0, col: 0 }; 
                case 'inky': return { row: MAP_ROWS - 1, col: MAP_COLS - 1 }; 
                case 'clyde': return { row: MAP_ROWS - 1, col: 0 }; 
                default: return { row: 0, col: 0}; 
            }
        }
        draw(ctx) {
            if (!this.active && this.state !== 'eaten') return;
            const x = Math.round(this.x); const y = Math.round(this.y); const r = this.radius * 1.1; const feet = 3; const feetHeight = r * 0.3;
            let bodyColor = this.color; let eyeColor = 'white'; let pupilColor = '#000';
            if (this.state === 'frightened') { this.flashState = this.frightenedTimer < GHOST_FLASH_START_TIME && Math.floor(this.frightenedTimer / 250) % 2 === 0; bodyColor = this.flashState ? GHOST_FRIGHTENED_EYES_COLOR : GHOST_FRIGHTENED_BODY_COLOR; eyeColor = this.flashState ? GHOST_FRIGHTENED_BODY_COLOR : GHOST_FRIGHTENED_EYES_COLOR; pupilColor = bodyColor; }
            else if (this.state === 'eaten') { bodyColor = 'transparent'; pupilColor = GHOST_FRIGHTENED_BODY_COLOR; eyeColor = GHOST_FRIGHTENED_EYES_COLOR;}
            if(this.state !== 'eaten') { ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); for (let i = 0; i < feet; i++) { ctx.arc(x - r + (r * 2 / feet) * (i + 0.5), y + r - feetHeight, r / feet, 0, Math.PI); } ctx.lineTo(x + r, y); ctx.closePath(); ctx.fill(); }
            const eyeRadius = r * 0.25; const pupilRadius = eyeRadius * 0.6; let eyeOffsetX = 0; let eyeOffsetY = 0; const eyeBaseX = r * 0.35; const eyeBaseY = -r * 0.1;
            if (this.direction === 'left') eyeOffsetX = -eyeRadius * 0.4; else if (this.direction === 'right') eyeOffsetX = eyeRadius * 0.4; else if (this.direction === 'up') eyeOffsetY = -eyeRadius * 0.4; else if (this.direction === 'down') eyeOffsetY = eyeRadius * 0.4;
            ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.arc(x - eyeBaseX, y + eyeBaseY, eyeRadius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.arc(x - eyeBaseX + eyeOffsetX, y + eyeBaseY + eyeOffsetY, pupilRadius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.arc(x + eyeBaseX, y + eyeBaseY, eyeRadius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = pupilColor; ctx.beginPath(); ctx.arc(x + eyeBaseX + eyeOffsetX, y + eyeBaseY + eyeOffsetY, pupilRadius, 0, Math.PI * 2); ctx.fill();
        }
        update(deltaTime) {
             if (!this.active && this.state !== 'eaten') return;
             
             if (this.state === 'frightened') { this.frightenedTimer -= deltaTime; if (this.frightenedTimer <= 0) { this.setState('chase'); }}
             else if (this.state === 'eaten') {
                 this.targetTile = findGhostHomeEntry(); // Target the entry point to ghost house
                 const gridX = this.col * TILE_SIZE + TILE_SIZE / 2; const gridY = this.row * TILE_SIZE + TILE_SIZE / 2;
                 if (this.row === this.targetTile.row && this.col === this.targetTile.col) {
                    // Once at entry, target an actual home tile to "go inside"
                    const homeTile = ghostSpawnPoints.find(p => p.row === this.startRow && p.col === this.startCol) || ghostSpawnPoints[0];
                    this.targetTile = homeTile; // Target its original spawn point within the house
                    if (this.row === homeTile.row && this.col === homeTile.col) {
                        this.resetPosition(); // Fully reset to its start position and state
                        this.setState('scatter'); // Or 'exit_house' state
                        this.active = true;
                        this.isExitingHouse = true;
                    }
                 }
             } else if (this.isExitingHouse) {
                this.targetTile = findGhostHomeEntry(); // Target to exit
                if (this.row === this.targetTile.row && this.col === this.targetTile.col) {
                    this.isExitingHouse = false;
                    this.setState('scatter'); // Or 'chase' depending on game logic
                }
             } else { this.setTargetTile(); }

             const currentGridX = this.col * TILE_SIZE + TILE_SIZE / 2; const currentGridY = this.row * TILE_SIZE + TILE_SIZE / 2;
             const tol = this.currentSpeed * TILE_SIZE / 120 ; // Smaller tolerance for ghosts

              if (Math.abs(this.x - currentGridX) < tol && Math.abs(this.y - currentGridY) < tol) {
                 this.x = currentGridX; this.y = currentGridY; // Snap
                 const possibleMoves = this.getPossibleMoves();
                 if (possibleMoves.length > 0) {
                    let bestMove = possibleMoves[0];
                    if (this.state === 'frightened') { bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; }
                    else { 
                        let minDistance = Infinity; 
                        possibleMoves.forEach(move => { 
                            let nR = this.row; let nC = this.col; 
                            if (move === 'up') nR--; else if (move === 'down') nR++; else if (move === 'left') nC--; else if (move === 'right') nC++; 
                            const d = distance(nC, nR, this.targetTile.col, this.targetTile.row); 
                            if (d < minDistance) { minDistance = d; bestMove = move; }
                        }); 
                    }
                    this.nextDirection = bestMove;
                 } else { 
                    this.nextDirection = this.getOppositeDirection(this.direction) || this.direction; 
                }
             }
             super.update(deltaTime); // Calls Character.move() and updates row/col
        }
        getPossibleMoves() { 
            const m = []; const r = this.row; const c = this.col; 
            const o = this.getOppositeDirection(this.direction); 
            
            // Standard moves
            if (!isWall(r - 1, c) && o !== 'up') m.push('up'); 
            if (!isWall(r + 1, c) && o !== 'down') m.push('down'); 
            if (!isWall(r, c - 1) && o !== 'left') m.push('left'); 
            if (!isWall(r, c + 1) && o !== 'right') m.push('right'); 

            // Tunnel handling: if at edge and tunnel exists, allow move into tunnel
            if (c === 0 && currentMap[r][c] === 0 && o !== 'left') m.push('left');
            if (c === MAP_COLS -1 && currentMap[r][c] === 0 && o !== 'right') m.push('right');
            
            // Ghost house exit logic: Ghosts cannot turn upwards back into the house from the "door" tile
            // The "door" is at row 10, col 13 for this map (approx center)
            const ghostHouseExitRow = 10; 
            if (this.row === ghostHouseExitRow && (this.col >= 12 && this.col <= 14) && this.direction === 'down' && o !== 'up') {
                const upIndex = m.indexOf('up');
                if (upIndex > -1) m.splice(upIndex, 1);
            }
            // If exiting house state, only allow 'up' if at spawn and not blocked.
            if (this.isExitingHouse && this.row === this.startRow && this.col === this.startCol) {
                if (!isWall(r - 1, c)) return ['up']; // Force up if possible
                // otherwise let normal logic decide from other available moves if 'up' is blocked
            }


            if (m.length === 0 && o && !isWall(r + (o === 'down' ? 1 : o === 'up' ? -1 : 0), c + (o === 'right' ? 1 : o === 'left' ? -1 : 0))) {
                 m.push(o); // If stuck, try to reverse
            }
            return m; 
        }
        setState(newState) { 
            if (this.state === 'eaten' && this.respawnTimerId) { clearTimeout(this.respawnTimerId); this.respawnTimerId = null; } 
            this.state = newState; 
            if (newState === 'frightened') { this.frightenedTimer = POWER_PELLET_DURATION; this.currentSpeed = GHOST_FRIGHTENED_SPEED; this.nextDirection = this.getOppositeDirection(this.direction) || this.direction; } 
            else if (newState === 'eaten') { this.currentSpeed = GHOST_SPEED * 2; this.targetTile = findGhostHomeEntry(); this.active = false; /* Becomes inactive until respawn timer */ } 
            else { this.currentSpeed = this.baseSpeed; this.isExitingHouse = (currentMap[this.startRow][this.startCol] === 4 && this.row === this.startRow && this.col === this.startCol);} 
        }
        setTargetTile() { 
            if (this.isExitingHouse) {
                this.targetTile = findGhostHomeEntry();
                return;
            }
            if (this.state === 'scatter') { this.targetTile = this.homeCorner; } 
            else if (this.state === 'chase') { if (pacman && pacman.active) { 
                // Blinky targets Pacman directly
                if (this.name === 'blinky') this.targetTile = { row: pacman.row, col: pacman.col };
                // Pinky targets 4 tiles ahead of Pacman
                else if (this.name === 'pinky') {
                    let pRow = pacman.row, pCol = pacman.col;
                    if (pacman.direction === 'up') pRow -=4;
                    else if (pacman.direction === 'down') pRow +=4;
                    else if (pacman.direction === 'left') pCol -=4;
                    else if (pacman.direction === 'right') pCol +=4;
                    this.targetTile = {row: pRow, col: pCol};
                }
                // Inky needs Blinky's position too - complex. For now, target Pacman.
                else if (this.name === 'inky') this.targetTile = { row: pacman.row, col: pacman.col }; // Simplified
                // Clyde targets Pacman if far, scatter corner if close
                else if (this.name === 'clyde') {
                    if(distance(this.x, this.y, pacman.x, pacman.y) / TILE_SIZE > 8) {
                        this.targetTile = { row: pacman.row, col: pacman.col };
                    } else {
                        this.targetTile = this.homeCorner;
                    }
                }
            
            }} 
            else if (this.state === 'eaten') { this.targetTile = findGhostHomeEntry(); }
        }
        resetPosition() { 
            super.resetPosition(); 
            this.setState('scatter'); // Or initial state logic
            this.active = true; 
            if (this.respawnTimerId) { clearTimeout(this.respawnTimerId); this.respawnTimerId = null; }
            this.isExitingHouse = (currentMap[this.startRow][this.startCol] === 4);
            this.direction = 'up'; // Ghosts often start by moving up out of the house
            this.nextDirection = 'up';
        }
    }

    // --- Find Ghost Home Entry ---
    function findGhostHomeEntry() { 
        // This should be the tile just outside the ghost house "door"
        // For the provided map, it's row 10, around col 13 or 14.
        return { row: 10, col: Math.floor(MAP_COLS/2) -1 }; 
    }

    // --- Game Setup & Initialization ---
    function initGame(level = 1) {
        if (gameLoopId !== null) cancelAnimationFrame(gameLoopId);
        clearAllRespawnTimers();
        calculateSizes(); 
        currentLevel = level; score = (level === 1) ? 0 : score; lives = (level === 1) ? PLAYER_INITIAL_LIVES : lives;
        isPaused = false; isGameOver = false; lastFrameTime = performance.now(); frightenedMode = false; frightenedTimer = 0;
        dots = []; powerPellets = []; ghosts = []; pacman = null; totalDots = 0; ghostSpawnPoints = [];
        for (let r = 0; r < MAP_ROWS; r++) { for (let c = 0; c < MAP_COLS; c++) { const t = currentMap[r][c]; const p = getPixelPos(r, c); if (t === 2) { dots.push({ x: p.x + TILE_SIZE / 2, y: p.y + TILE_SIZE / 2, active: true }); totalDots++; } else if (t === 3) { powerPellets.push({ x: p.x + TILE_SIZE / 2, y: p.y + TILE_SIZE / 2, active: true, radius: POWER_PELLET_RADIUS }); totalDots++; } else if (t === 5) { pacman = new Pacman(r, c); } else if (t === 4) { ghostSpawnPoints.push({row: r, col: c}); }}}
        if (!pacman) { console.error("Map missing player start (5)"); isGameOver = true; return; }
        if (ghostSpawnPoints.length === 0) { console.warn("Map missing ghost spawns (4)"); ghostSpawnPoints.push({row: 11, col: 13});} // Fallback if none
        
        const gN = Object.keys(GHOST_COLORS); 
        ghosts = gN.slice(0, Math.min(gN.length, ghostSpawnPoints.length)).map((n, i) => { 
            const sP = ghostSpawnPoints[i % ghostSpawnPoints.length]; 
            return new Ghost(sP.row, sP.col, GHOST_COLORS[n], n); 
        });
        
        currentDirection = pacman.direction; nextDirection = pacman.nextDirection;
        updateScoreDisplay(); updateLivesDisplay(); loadHighScore();
        gameMessageScreen.style.display = 'none'; gamePauseScreen.style.display = 'none'; levelCompleteScreen.style.display = 'none';
        document.querySelector('.preview-container').style.display = 'none'; // Hide previews after start
        gameLoopId = requestAnimationFrame(animationLoop);
    }
    function resetCharacterPositions() {
         if (!pacman) return;
         pacman.resetPosition();
         currentDirection = pacman.direction; nextDirection = pacman.nextDirection;
         clearAllRespawnTimers(); 
         ghosts.forEach(g => g.resetPosition());
         frightenedMode = false; frightenedTimer = 0;
    }
    function clearAllRespawnTimers() { ghosts.forEach(g => { if(g.respawnTimerId) { clearTimeout(g.respawnTimerId); g.respawnTimerId = null; }}); }

    // --- Animation Loop & Game Logic ---
    function animationLoop(timestamp) {
        if (isGameOver) { gameLoopId = null; return; }
        if (isPaused) { lastFrameTime = timestamp; gameLoopId = requestAnimationFrame(animationLoop); return; }
        if (!lastFrameTime) lastFrameTime = timestamp;
        const deltaTime = timestamp - lastFrameTime;
        if (deltaTime < 1) { gameLoopId = requestAnimationFrame(animationLoop); return; } 
        lastFrameTime = timestamp;
        const cappedDeltaTime = Math.min(deltaTime, 50); 
        try { gameLogic(cappedDeltaTime); }
        catch (error) { console.error("Game loop error:", error); gameOver(false, true); return; }
        gameLoopId = requestAnimationFrame(animationLoop);
    }
    function gameLogic(deltaTime) {
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
        drawMaze(); drawDots(); drawPowerPellets();
        
        if (pacman.active) { 
            pacman.nextDirection = nextDirection || pacman.direction; 
            pacman.update(deltaTime); 
            pacman.draw(context); 
        }
        ghosts.forEach(ghost => { ghost.update(deltaTime); ghost.draw(context); });

        eatDots(); eatPowerPellets(); checkCollisions();
        if (totalDots === 0 && !isGameOver) { levelComplete(); return; }
        if (frightenedMode) { frightenedTimer -= deltaTime; if (frightenedTimer <= 0) { endFrightenedMode(); } }
    }

    // --- Drawing Functions ---
    function drawMaze() {
        context.strokeStyle = WALL_COLOR; 
        context.lineWidth = Math.max(2, Math.floor(TILE_SIZE / 12)); // Thinner walls based on TILE_SIZE
        const offset = context.lineWidth / 2;
        context.beginPath(); 
        for (let r = 0; r < MAP_ROWS; r++) { 
            for (let c = 0; c < MAP_COLS; c++) { 
                if (currentMap[r][c] === 1) { 
                    const x = c * TILE_SIZE; const y = r * TILE_SIZE; const ts = TILE_SIZE;
                    // Check neighbors to draw lines only for exposed edges
                    if (r === 0 || currentMap[r-1][c] !== 1) { context.moveTo(x - offset, y + offset); context.lineTo(x + ts + offset, y + offset); } // Top line
                    if (r === MAP_ROWS - 1 || currentMap[r+1][c] !== 1) { context.moveTo(x - offset, y + ts - offset); context.lineTo(x + ts + offset, y + ts - offset); } // Bottom line
                    if (c === 0 || currentMap[r][c-1] !== 1) { context.moveTo(x + offset, y - offset); context.lineTo(x + offset, y + ts + offset); } // Left line
                    if (c === MAP_COLS - 1 || currentMap[r][c+1] !== 1) { context.moveTo(x + ts - offset, y - offset); context.lineTo(x + ts - offset, y + ts + offset); } // Right line
                }
            }
        } 
        context.stroke();
        
        // Clear tunnel openings if they are drawn over by wall logic
        context.fillStyle = SCREEN_BG_COLOR;
        for (let r = 0; r < MAP_ROWS; r++) {
            if (currentMap[r][0] === 0) { // Left tunnel
                context.fillRect(-TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
            if (currentMap[r][MAP_COLS - 1] === 0) { // Right tunnel
                context.fillRect(canvas.width, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    function drawDots() { context.fillStyle = DOT_COLOR; dots.forEach(d => { if(d.active){ context.beginPath(); context.arc(d.x, d.y, PELLET_RADIUS, 0, Math.PI*2); context.fill(); }}); }
    function drawPowerPellets() { const blink = Math.floor(performance.now() / 200) % 2 === 0; if (!blink && frightenedMode) return; context.fillStyle = POWER_PELLET_COLOR; powerPellets.forEach(p => { if(p.active){ context.beginPath(); context.arc(p.x, p.y, p.radius, 0, Math.PI * 2); context.fill(); }}); }

    // --- Interaction & Collision ---
    function eatDots() { if (!pacman.active) return; dots.forEach(d => { if(d.active && distance(pacman.x,pacman.y,d.x,d.y)<TILE_SIZE/2.5){d.active=false;score+=10;totalDots--;updateScoreDisplay();}}); }
    function eatPowerPellets() { if (!pacman.active) return; powerPellets.forEach(p => { if(p.active && distance(pacman.x,pacman.y,p.x,p.y)<TILE_SIZE/1.8){p.active=false;score+=50;totalDots--; updateScoreDisplay();startFrightenedMode();}}); } 
    function checkCollisions() {
        if (!pacman.active) return;
        ghosts.forEach((ghost) => {
            if (ghost.active && distance(pacman.x, pacman.y, ghost.x, ghost.y) < TILE_SIZE * 0.7) {
                if (ghost.state === 'frightened') {
                    score += 200; updateScoreDisplay(); ghost.setState('eaten'); 
                    if (ghost.respawnTimerId) clearTimeout(ghost.respawnTimerId); 
                    ghost.respawnTimerId = setTimeout(() => { 
                        if(!isGameOver && ghosts.includes(ghost)) {
                           // Ghost will be reset inside its own logic when it reaches home
                           // For now, just ensure it targets home
                           ghost.targetTile = findGhostHomeEntry(); // Ensure it heads home.
                           // Resetting position here might be too abrupt. Let it path home.
                        }
                    }, GHOST_RESPAWN_TIME); // Respawn timer only starts actual respawn process
                } else if (ghost.state !== 'eaten') { if (pacman.loseLife()) { gameOver(false); return; }}}});
    }

    // --- Frightened Mode ---
    function startFrightenedMode() { frightenedMode = true; frightenedTimer = POWER_PELLET_DURATION; ghosts.forEach(g => { if(g.state !== 'eaten') g.setState('frightened'); }); }
    function endFrightenedMode() { frightenedMode = false; ghosts.forEach(g => { if(g.state === 'frightened') g.setState('chase'); }); } 

    // --- Game State Functions ---
    function levelComplete() { if (isGameOver) return; isPaused = true; if(gameLoopId) cancelAnimationFrame(gameLoopId); gameLoopId = null; messageText.textContent = "LEVEL CLEAR!"; startButton.textContent = "NEXT LEVEL (Restart)"; gameMessageScreen.style.display = 'flex'; document.querySelector('.preview-container').style.display = 'flex'; } // Show previews again
    function gameOver(isWin, isError = false) { if (isGameOver) return; isGameOver = true; if(pacman) pacman.active = false; if (gameLoopId !== null) { cancelAnimationFrame(gameLoopId); gameLoopId = null; } clearAllRespawnTimers(); if (score > highScore) { highScore = score; saveHighScore(); } updateScoreDisplay(); updateLivesDisplay(); messageText.textContent = isError ? `Error!` : (isWin ? "YOU WIN!" : "GAME OVER!"); startButton.textContent = "RESTART"; gameMessageScreen.style.display = 'flex'; document.querySelector('.preview-container').style.display = 'flex';} // Show previews again
    function togglePause() { if (isGameOver) return; isPaused = !isPaused; if (isPaused) { gamePauseScreen.style.display = 'flex'; } else { gamePauseScreen.style.display = 'none'; lastFrameTime = performance.now(); if (gameLoopId === null && !isGameOver) { gameLoopId = requestAnimationFrame(animationLoop); } } }

    // --- UI Update Functions ---
    function updateScoreDisplay() { scoreElement.textContent = score; highScoreElement.textContent = highScore; }
    function updateLivesDisplay() { livesContainer.innerHTML = ''; const currentLives = lives > 0 ? lives : 0; for (let i = 0; i < currentLives; i++) { const lifeIcon = document.createElement('div'); lifeIcon.classList.add('life-icon-pacman'); livesContainer.appendChild(lifeIcon); } }
    function saveHighScore() { localStorage.setItem('pixelPacmanDXHighScore_v2', highScore); } 
    function loadHighScore() { const savedScore = localStorage.getItem('pixelPacmanDXHighScore_v2'); highScore = savedScore ? parseInt(savedScore, 10) : 0; }

    // --- Event Listeners ---
    const keyMap = {};
    document.addEventListener('keydown', (e) => {
        if (isGameOver && (e.key === 'Enter' || e.key === ' ')) { initGame(1); e.preventDefault(); return; }
        if (e.key.toLowerCase() === 'p' || e.key === "Escape") { togglePause(); return; }
        if (!isPaused && !isGameOver && pacman?.active) {
            let intendedDirection = '';
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') intendedDirection = 'up';
            else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') intendedDirection = 'down';
            else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') intendedDirection = 'left';
            else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') intendedDirection = 'right';
            if (intendedDirection) { nextDirection = intendedDirection; e.preventDefault();}
        }
    });
    
    function handleButtonPress(direction) {
        if (!isPaused && !isGameOver && pacman?.active) {
            nextDirection = direction;
        }
    }
    upButton.addEventListener('mousedown', () => handleButtonPress('up'));
    downButton.addEventListener('mousedown', () => handleButtonPress('down'));
    leftButton.addEventListener('mousedown', () => handleButtonPress('left'));
    rightButton.addEventListener('mousedown', () => handleButtonPress('right'));
    upButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleButtonPress('up'); });
    downButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleButtonPress('down'); });
    leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleButtonPress('left'); });
    rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); handleButtonPress('right'); });

    pauseActionButton.addEventListener('click', togglePause);
    startButton.addEventListener('click', () => initGame(1));
    restartButtonPanel.addEventListener('click', () => initGame(1));

    // --- Initialize UI ---
    function initializeUI() {
        calculateSizes(); 
        loadHighScore(); score = 0; lives = PLAYER_INITIAL_LIVES; currentLevel = 1; isGameOver = true; isPaused = false;
        updateScoreDisplay(); updateLivesDisplay(); 
        messageText.textContent = "GET READY!"; startButton.textContent = 'START GAME';
        document.querySelector('.preview-container').style.display = 'flex';
        gameMessageScreen.style.display = 'flex'; gamePauseScreen.style.display = 'none'; levelCompleteScreen.style.display = 'none';
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
    }

    // --- Particles Setup ---
    if (window.particlesJS) {
        particlesJS('particles-js-pacman', {
             "particles": {
                "number": {"value": 60,"density": {"enable": true,"value_area": 800}}, 
                "color": {"value": [PACMAN_COLOR, GHOST_COLORS.blinky, GHOST_COLORS.pinky, GHOST_COLORS.inky, GHOST_COLORS.clyde, DOT_COLOR, POWER_PELLET_COLOR]}, 
                "shape": {"type": "circle"}, 
                "opacity": {"value": 0.4,"random": true,"anim": {"enable": true,"speed": 0.5,"opacity_min": 0.1}}, 
                "size": {"value": 4,"random": true,"anim": {"enable": true, "speed": 1.5, "size_min": 1.5, "sync": false}}, 
                "line_linked": {"enable": false},
                "move": {"enable": true,"speed": 0.8,"direction": "none","random": true,"straight": false,"out_mode": "out","bounce": false}
            },
            "interactivity": {"detect_on": "canvas", "events": {"onhover":{"enable":false}, "onclick":{"enable":false}, "resize":true}, "modes":{}},
            "retina_detect": true
        });
    } else { console.warn("particles.js library not loaded. Background particles will not appear."); }

    // --- Initialize ---
    initializeUI();
    window.addEventListener('resize', () => {
        if (isGameOver || isPaused) { // Only recalc and redraw static UI if game not active
            calculateSizes();
            if(isGameOver) initializeUI(); // Full UI reset if game over
            else { // If paused, just redraw maze and elements
                 context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
                 drawMaze(); drawDots(); drawPowerPellets();
                 if(pacman) pacman.draw(context);
                 ghosts.forEach(g => g.draw(context));
            }
        } else { // If game is running, just calculate sizes, game loop will redraw
            calculateSizes();
        }
    });

}); // End DOMContentLoaded