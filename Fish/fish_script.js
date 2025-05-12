document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const canvas = document.getElementById('fishCanvas');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const playerSizeElement = document.getElementById('playerSize');
    const livesContainer = document.getElementById('livesContainer');
    const highScoreElement = document.getElementById('highScore');
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton'); // Action button
    const pauseScreen = document.getElementById('pauseScreen');
    // D-Pad Buttons
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');

    // --- Game Settings (Keep mostly as is) ---
    const SCREEN_BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim();
    const PLAYER_FISH_COLOR = '#ffeb3b';
    const ENEMY_FISH_COLORS = ['#4CAF50', '#FF9800', '#9C27B0', '#03A9F4', '#E91E63'];
    const SHRIMP_COLOR = '#FF7043';
    const JELLYFISH_COLOR_BODY = 'rgba(173, 216, 230, 0.7)';
    const JELLYFISH_COLOR_TENTACLES = 'rgba(135, 206, 250, 0.5)';
    const SEAHORSE_COLOR = '#D4AC0D';
    const CRAB_COLOR_BODY = '#B9442A';
    const CRAB_COLOR_CLAWS = '#8C2E1D';
    const FISH_EYE_COLOR = '#212121';
    const FISH_FIN_COLOR_DARKEN_FACTOR = 0.8;

    const INITIAL_PLAYER_SIZE = 12;
    const INITIAL_PLAYER_LIVES = 3;
    const INVINCIBILITY_DURATION = 3000;
    const SIZE_INCREMENT_FISH = 1;
    const SIZE_INCREMENT_SHRIMP = 0.2;
    const MAX_ENEMY_FISH = 7;
    const MAX_SHRIMP = 10;
    const MAX_JELLYFISH = 3;
    const MAX_SEAHORSES = 2;
    const MAX_CRABS = 2;
    const ENEMY_SPAWN_INTERVAL = 1800;
    const SHRIMP_SPAWN_INTERVAL = 1000;
    const OTHER_NPC_SPAWN_INTERVAL = 4000;
    const PLAYER_SPEED = 2.5; // Speed remains constant pixels/update

    const ENEMY_LIFESPAN = 15000;
    const SHRIMP_LIFESPAN = 10000;
    const JELLYFISH_LIFESPAN = 20000;
    const SEAHORSE_LIFESPAN = 25000;
    const CRAB_LIFESPAN = 30000;
    const FLEE_SPEED_MULTIPLIER = 2.5;

    // --- Game State Variables ---
    let player, entities, score, highScore = 0, gameLoopId,
        lastEnemySpawnTime, lastShrimpSpawnTime, lastOtherNpcSpawnTime,
        isPaused, isGameOver;

    // Input state for both keyboard and touch controls
    const keysPressed = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

    // --- Entity Classes (Keep PlayerFish, EnemyFish, Shrimp, Jellyfish, Seahorse, Crab as before) ---
    class Entity { /* ... (Keep implementation from original script) ... */ constructor(x, y, size, color, type) { this.x = x; this.y = y; this.size = size; this.color = color; this.type = type; this.dx = (Math.random() - 0.5) * (type === 'crab' ? 0.8 : 2); this.dy = (Math.random() - 0.5) * (type === 'crab' ? 0.2 : (type === 'jellyfish' ? 0.5 : 1)); this.facingRight = this.dx > 0; this.isPlayer = (type === 'player'); this.canBeEaten = (type === 'enemyFish' || type === 'shrimp'); this.isHazard = (type === 'jellyfish'); this.isNeutral = (type === 'seahorse' || type === 'crab'); this.isFleeing = false; this.fleeTargetX = null; this.fleeTargetY = null; this.remove = false; if (!this.isPlayer) { this.birthTime = performance.now(); switch(type) { case 'enemyFish': this.lifespan = ENEMY_LIFESPAN; break; case 'shrimp': this.lifespan = SHRIMP_LIFESPAN; break; case 'jellyfish': this.lifespan = JELLYFISH_LIFESPAN; break; case 'seahorse': this.lifespan = SEAHORSE_LIFESPAN; break; case 'crab': this.lifespan = CRAB_LIFESPAN; break; default: this.lifespan = 15000; } } if (this.isPlayer) { this.lives = INITIAL_PLAYER_LIVES; this.isInvincible = false; this.invincibilityTimer = 0; this.blinkOn = true; } } darkenColor(hex, factor) { if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') return '#000000'; let r = parseInt(hex.slice(1, 3), 16); let g = parseInt(hex.slice(3, 5), 16); let b = parseInt(hex.slice(5, 7), 16); r = Math.max(0, Math.min(255, Math.floor(r * factor))); g = Math.max(0, Math.min(255, Math.floor(g * factor))); b = Math.max(0, Math.min(255, Math.floor(b * factor))); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; } draw() { /* Implemented by subclasses */ } update(deltaTime) { if (!this.isPlayer && !this.isFleeing) { if (performance.now() - this.birthTime > this.lifespan) { this.startFleeing(); } } if (this.isFleeing) { this.moveToFleeTarget(); } else { this._defaultUpdateBehavior(deltaTime); } } _defaultUpdateBehavior(deltaTime) { /* To be called by subclass update if not fleeing */ } startFleeing() { this.isFleeing = true; const distToLeft = this.x; const distToRight = canvas.width - this.x; const distToTop = this.y; const distToBottom = canvas.height - this.y; const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom); const buffer = this.size * 3; if (minDist === distToTop) { this.fleeTargetX = this.x; this.fleeTargetY = -buffer; } else if (minDist === distToBottom) { this.fleeTargetX = this.x; this.fleeTargetY = canvas.height + buffer; } else if (minDist === distToLeft) { this.fleeTargetX = -buffer; this.fleeTargetY = this.y; } else { this.fleeTargetX = canvas.width + buffer; this.fleeTargetY = this.y; } } moveToFleeTarget() { const targetDx = this.fleeTargetX - this.x; const targetDy = this.fleeTargetY - this.y; const distance = Math.hypot(targetDx, targetDy); if (distance < 10) { this.remove = true; return; } const baseFleeSpeed = (this.type === 'crab' ? 0.8 : 1.5) * FLEE_SPEED_MULTIPLIER; this.dx = (targetDx / distance) * baseFleeSpeed; this.dy = (targetDy / distance) * baseFleeSpeed; if(Math.abs(this.dx) > 0.1) this.facingRight = this.dx > 0; this.x += this.dx; this.y += this.dy; } }
    class PlayerFish extends Entity { /* ... (Keep implementation) ... */ constructor(x, y, size, color) { super(x, y, size, color, 'player'); this.dx = 0; this.dy = 0; } draw() { if (this.isInvincible) { this.blinkOn = !this.blinkOn; if (!this.blinkOn) return; } context.beginPath(); context.ellipse(this.x, this.y, this.size, this.size * 0.6, 0, 0, Math.PI * 2); context.fillStyle = this.color; context.fill(); context.beginPath(); const tailX = this.facingRight ? this.x - this.size : this.x + this.size; context.moveTo(tailX, this.y); context.lineTo(tailX + (this.facingRight ? -this.size * 0.7 : this.size * 0.7), this.y - this.size * 0.4); context.lineTo(tailX + (this.facingRight ? -this.size * 0.7 : this.size * 0.7), this.y + this.size * 0.4); context.closePath(); context.fillStyle = this.darkenColor(this.color, FISH_FIN_COLOR_DARKEN_FACTOR); context.fill(); context.beginPath(); context.moveTo(this.x - this.size * (this.facingRight ? 0.3 : -0.3), this.y - this.size * 0.5); context.lineTo(this.x + this.size * (this.facingRight ? 0.2 : -0.2), this.y - this.size * 0.5); context.lineTo(this.x, this.y - this.size * 0.9); context.closePath(); context.fillStyle = this.darkenColor(this.color, FISH_FIN_COLOR_DARKEN_FACTOR); context.fill(); context.beginPath(); const eyeX = this.facingRight ? this.x + this.size * 0.4 : this.x - this.size * 0.4; const eyeY = this.y - this.size * 0.15; context.arc(eyeX, eyeY, this.size * 0.15, 0, Math.PI * 2); context.fillStyle = FISH_EYE_COLOR; context.fill(); context.beginPath(); context.arc(eyeX + (this.facingRight ? this.size*0.05 : -this.size*0.05) , eyeY, this.size * 0.07, 0, Math.PI * 2); context.fillStyle = 'white'; context.fill(); } update(deltaTime) { if (this.isInvincible) { this.invincibilityTimer -= deltaTime; if (this.invincibilityTimer <= 0) { this.isInvincible = false; this.blinkOn = true; } } this.dx = 0; this.dy = 0; if (keysPressed.ArrowUp) this.dy = -PLAYER_SPEED; if (keysPressed.ArrowDown) this.dy = PLAYER_SPEED; if (keysPressed.ArrowLeft) { this.dx = -PLAYER_SPEED; this.facingRight = false; } if (keysPressed.ArrowRight) { this.dx = PLAYER_SPEED; this.facingRight = true; } if (this.dx !== 0 && this.dy !== 0) { const diagonalFactor = Math.sqrt(0.5); this.dx *= diagonalFactor; this.dy *= diagonalFactor; } this.x += this.dx; this.y += this.dy; this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x)); this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y)); } loseLife() { if (this.isInvincible) return false; this.lives--; updateLivesDisplay(); if (this.lives <= 0) return true; else { this.isInvincible = true; this.invincibilityTimer = INVINCIBILITY_DURATION; return false; } } }
    class EnemyFish extends Entity { /* ... (Keep implementation) ... */ constructor(x, y, size, color) { super(x, y, size, color, 'enemyFish'); } draw() { PlayerFish.prototype.draw.call(this); } update(deltaTime) { super.update(deltaTime); if (this.isFleeing) return; this._defaultUpdateBehavior(); } _defaultUpdateBehavior() { this.x += this.dx; this.y += this.dy; if (this.x - this.size < 0 || this.x + this.size > canvas.width) { this.dx *= -1; this.facingRight = this.dx > 0; this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));} if (this.y - this.size < 0 || this.y + this.size > canvas.height) { this.dy *= -1; this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));} } }
    class Shrimp extends Entity { /* ... (Keep implementation) ... */ constructor(x, y) { super(x, y, 5, SHRIMP_COLOR, 'shrimp'); this.dy = (Math.random() - 0.5) * 0.5; this.dx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.5 + 0.2); } draw() { context.fillStyle = this.color; context.beginPath(); context.ellipse(this.x, this.y, this.size * 1.2, this.size * 0.5, this.facingRight ? 0.2 : -0.2, 0, Math.PI * 2); context.fill(); context.fillStyle = FISH_EYE_COLOR; context.fillRect(this.x + (this.facingRight ? this.size * 0.6 : -this.size * 0.8), this.y - this.size * 0.1, 1, 1); } update(deltaTime) { super.update(deltaTime); if (this.isFleeing) return; this._defaultUpdateBehavior(); } _defaultUpdateBehavior() { EnemyFish.prototype._defaultUpdateBehavior.call(this); } }
    class Jellyfish extends Entity { /* ... (Keep implementation) ... */ constructor(x, y) { const baseSize = Math.random() * 15 + 10; super(x, y, baseSize, JELLYFISH_COLOR_BODY, 'jellyfish'); this.tentacleLength = baseSize * (Math.random() * 1 + 1.5); this.dy = Math.random() * 0.5 + 0.1; this.dx = (Math.random() - 0.5) * 0.5; this.pulsePhase = Math.random() * Math.PI * 2; } draw() { this.pulsePhase += 0.05; const currentSize = this.size * (1 + Math.sin(this.pulsePhase) * 0.1); context.strokeStyle = JELLYFISH_COLOR_TENTACLES; context.lineWidth = Math.max(1, currentSize * 0.1); for (let i = 0; i < 5; i++) { context.beginPath(); context.moveTo(this.x + (Math.random() - 0.5) * currentSize * 0.5, this.y + currentSize * 0.4); context.lineTo(this.x + (Math.random() - 0.5) * currentSize, this.y + currentSize * 0.4 + this.tentacleLength * (0.8 + Math.random()*0.4) + Math.sin(this.pulsePhase + i) * 5); context.stroke(); } context.fillStyle = this.color; context.beginPath(); context.arc(this.x, this.y, currentSize * 0.7, Math.PI, 0); context.quadraticCurveTo(this.x + currentSize * 0.7, this.y + currentSize * 0.5, this.x, this.y + currentSize * 0.6); context.quadraticCurveTo(this.x - currentSize * 0.7, this.y + currentSize * 0.5, this.x - currentSize * 0.7, this.y); context.fill(); } update(deltaTime) { super.update(deltaTime); if (this.isFleeing) return; this._defaultUpdateBehavior(); } _defaultUpdateBehavior() { this.x += this.dx; this.y += this.dy; if (this.x - this.size < 0 || this.x + this.size > canvas.width) { this.dx *= -1; } if (this.y - this.size * 2 > canvas.height + this.size * 2 ) { this.y = -this.size * 2; this.x = Math.random() * canvas.width; } else if (this.y + this.size < 0 && this.dy < 0) { this.dy *= -1; } } }
    class Seahorse extends Entity { /* ... (Keep implementation) ... */ constructor(x,y) { super(x,y, 8, SEAHORSE_COLOR, 'seahorse'); this.dx = 0; this.dy = (Math.random() > 0.5 ? 1: -1) * (Math.random() * 0.3 + 0.1); this.bobPhase = Math.random() * Math.PI * 2; } draw() { context.fillStyle = this.color; context.strokeStyle = this.darkenColor(this.color, 0.7); context.lineWidth = 1; context.beginPath(); let currentX = this.x; let currentY = this.y; const segmentSize = this.size * 0.5; for(let i=0; i<4; i++) { const angle = (this.facingRight ? -1 : 1) * (Math.PI/6 * i - Math.PI/4); context.ellipse(currentX, currentY, segmentSize, segmentSize*0.7, angle, 0, Math.PI*2); currentX += Math.cos(angle) * segmentSize * (this.facingRight ? 0.6: -0.6); currentY += Math.sin(angle) * segmentSize * 0.6; } context.fill(); context.stroke(); context.beginPath(); context.ellipse(this.x + (this.facingRight? this.size*0.3 : -this.size*0.3), this.y - this.size*0.8, this.size*0.4, this.size*0.6,0,0,Math.PI*2); context.fill(); context.stroke(); context.fillRect(this.x + (this.facingRight? this.size*0.5 : -this.size*0.9), this.y - this.size*0.9, this.size*0.4, this.size*0.2); } update(deltaTime) { super.update(deltaTime); if (this.isFleeing) return; this._defaultUpdateBehavior(); } _defaultUpdateBehavior() { this.bobPhase += 0.05; this.y += this.dy + Math.sin(this.bobPhase) * 0.2; if (this.y - this.size < 0 || this.y + this.size > canvas.height) { this.dy *= -1; } } }
    class Crab extends Entity { /* ... (Keep implementation) ... */ constructor(x) { super(x, canvas.height - 10, 12, CRAB_COLOR_BODY, 'crab'); this.dx = (Math.random() > 0.5 ? 1: -1) * (Math.random() * 0.5 + 0.3); this.dy = 0; this.clawColor = this.darkenColor(this.color, 0.7); } draw() { context.fillStyle = this.color; context.beginPath(); context.ellipse(this.x, this.y, this.size, this.size * 0.6, 0, 0, Math.PI*2); context.fill(); context.fillStyle = this.clawColor; const clawSize = this.size * 0.5; context.beginPath(); context.ellipse(this.x - this.size * 0.8, this.y - this.size*0.1, clawSize, clawSize*0.7, this.facingRight ? -0.5 : 0.5, 0, Math.PI*2); context.fill(); context.beginPath(); context.ellipse(this.x + this.size * 0.8, this.y - this.size*0.1, clawSize, clawSize*0.7, this.facingRight ? 0.5 : -0.5, 0, Math.PI*2); context.fill(); context.strokeStyle = this.darkenColor(this.color, 0.5); context.lineWidth = 2; for(let i=0; i<3; i++) { context.beginPath(); context.moveTo(this.x - this.size*0.3, this.y + this.size*0.1 + i*2); context.lineTo(this.x - this.size*1.2, this.y + this.size*0.3 + i*3 + (this.facingRight ? 2: -2)); context.stroke(); context.beginPath(); context.moveTo(this.x + this.size*0.3, this.y + this.size*0.1 + i*2); context.lineTo(this.x + this.size*1.2, this.y + this.size*0.3 + i*3 + (this.facingRight ? -2: 2)); context.stroke(); } } update(deltaTime) { super.update(deltaTime); if (this.isFleeing) return; this._defaultUpdateBehavior(); } _defaultUpdateBehavior() { this.x += this.dx; this.y = canvas.height - this.size*0.6; if (this.x - this.size < 0 || this.x + this.size > canvas.width) { this.dx *= -1; this.facingRight = this.dx > 0; } } }

    // --- Canvas Resizing ---
    function resizeCanvas() {
        const gameScreenContainer = document.getElementById('gameScreenContainer');
        const containerStyle = getComputedStyle(gameScreenContainer);
        const containerWidth = parseFloat(containerStyle.width);
        const containerHeight = parseFloat(containerStyle.height);

        if (isNaN(containerWidth) || isNaN(containerHeight) || containerWidth <= 0 || containerHeight <= 0) {
            console.warn("Invalid container dimensions:", containerWidth, containerHeight);
            return;
        }

        canvas.width = containerWidth;
        canvas.height = containerHeight;
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    }

    // --- Initialization ---
    function initGame() {
        console.log("Initializing game...");
        resizeCanvas(); // Set initial canvas size

        player = new PlayerFish(canvas.width / 2, canvas.height / 2, INITIAL_PLAYER_SIZE, PLAYER_FISH_COLOR);
        for (const key in keysPressed) { keysPressed[key] = false; }
        entities = [player]; score = 0; isPaused = false; isGameOver = false;
        lastEnemySpawnTime = 0; lastShrimpSpawnTime = 0; lastOtherNpcSpawnTime = 0;

        loadHighScore(); // Load high score first
        updateUIDisplay(); // Update score/size/high score
        updateLivesDisplay(); // Update lives display

        gameMessageScreen.style.display = 'none';
        pauseScreen.style.display = 'none';
        pauseButton.textContent = '暂停'; // Set to Chinese

        // Start game loop
        cancelAnimationFrame(gameLoopId);
        let lastTime = 0;
        function animationLoop(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            gameLoop(deltaTime); // Pass deltaTime

            if (!isGameOver && !isPaused) {
                gameLoopId = requestAnimationFrame(animationLoop);
            } else {
                gameLoopId = null; // Ensure loop stops if paused/over
            }
        }
        requestAnimationFrame(animationLoop);
        console.log("Game initialized and loop started.");
    }

    // --- Game Loop ---
    function gameLoop(deltaTime) {
        // Prevent updates if paused or game over
        if (isPaused || isGameOver) {
            // If paused, we might still want to draw the static scene?
            // Or just return to prevent any processing. Let's return for now.
            return;
        }
        // Cap deltaTime to prevent huge jumps after lag/pause
        deltaTime = Math.min(deltaTime, 50); // e.g., max 50ms step (20 FPS min)

        // Clear canvas
        context.fillStyle = SCREEN_BG_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // --- Spawning Logic ---
        const currentTime = performance.now();
        const entityCounts = countEntityTypes();

        if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL && entityCounts.enemyFish < MAX_ENEMY_FISH) {
            spawnNewEntity('enemyFish'); lastEnemySpawnTime = currentTime;
        }
        if (currentTime - lastShrimpSpawnTime > SHRIMP_SPAWN_INTERVAL && entityCounts.shrimp < MAX_SHRIMP) {
            spawnNewEntity('shrimp'); lastShrimpSpawnTime = currentTime;
        }
        if (currentTime - lastOtherNpcSpawnTime > OTHER_NPC_SPAWN_INTERVAL) {
            const npcTypes = [];
            if (entityCounts.jellyfish < MAX_JELLYFISH) npcTypes.push('jellyfish');
            if (entityCounts.seahorse < MAX_SEAHORSES) npcTypes.push('seahorse');
            if (entityCounts.crab < MAX_CRABS) npcTypes.push('crab');
            if (npcTypes.length > 0) {
                spawnNewEntity(npcTypes[Math.floor(Math.random() * npcTypes.length)]);
                lastOtherNpcSpawnTime = currentTime;
            }
        }

        // --- Update & Draw Entities ---
        for (let i = entities.length - 1; i >= 0; i--) {
            const entity = entities[i];
            if (!entity) { // Safety check
                entities.splice(i, 1);
                continue;
            }

            entity.update(deltaTime); // Pass deltaTime to update methods
            entity.draw();

            // Check for removal mark
            if (entity.remove) {
                entities.splice(i, 1);
                continue; // Skip collision checks for removed entity
            }

            // --- Collision Detection (Player vs Others) ---
            if (entity !== player && !player.isInvincible) {
                const dist = Math.hypot(player.x - entity.x, player.y - entity.y);
                let collisionThreshold = player.size * 0.8 + entity.size * 0.7; // Base threshold
                if (entity.type === 'jellyfish') collisionThreshold = player.size * 0.7 + entity.size * 0.8; // Jellyfish might have larger hit area

                if (dist < collisionThreshold) {
                    // Case 1: Player eats smaller entity
                    if (entity.canBeEaten && !entity.isFleeing && player.size > entity.size * 1.1) {
                        player.size += (entity.type === 'shrimp' ? SIZE_INCREMENT_SHRIMP : SIZE_INCREMENT_FISH);
                        score += Math.floor(entity.size * (entity.type === 'shrimp' ? 0.5 : 1));
                        entities.splice(i, 1); // Remove eaten entity
                        updateUIDisplay(); // Update score and size
                    }
                    // Case 2: Player gets eaten by larger fish
                    else if (entity.type === 'enemyFish' && !entity.isFleeing && entity.size > player.size * 1.1) {
                        if (player.loseLife()) { // loseLife returns true if game over
                            gameOver();
                            return; // Stop loop immediately on game over
                        }
                         // If not game over, player is invincible, loop continues
                    }
                    // Case 3: Player hits a hazard (Jellyfish)
                    else if (entity.isHazard && !entity.isFleeing) {
                         if (player.loseLife()) {
                            gameOver();
                            return;
                        }
                    }
                    // Case 4: Collision with neutral (Seahorse, Crab) - No effect currently
                    // else if (entity.isNeutral) { /* Optional: small bounce effect? */ }
                }
            }
        } // End entity loop
    }

    // --- Helper Functions (Keep countEntityTypes, spawnNewEntity, updateLivesDisplay, gameOver, togglePause, updateUIDisplay, save/loadHighScore as before) ---
    function countEntityTypes() { /* ... (Keep implementation) ... */ const counts = { enemyFish: 0, shrimp: 0, jellyfish: 0, seahorse: 0, crab: 0 }; for (const entity of entities) { if (entity.type !== 'player' && counts.hasOwnProperty(entity.type)) { counts[entity.type]++; } } return counts; }
    function spawnNewEntity(type) { /* ... (Keep implementation, ensure it uses current canvas.width/height) ... */ let newEntity; let x, y, size, color; const edge = Math.random(); let initialDx = (Math.random() - 0.5) * (type === 'crab' ? 0.8 : 2); let initialDy = (Math.random() - 0.5) * (type === 'crab' ? 0.2 : (type === 'jellyfish' ? 0.5 : 1)); switch (type) { case 'enemyFish': size = Math.random() * (INITIAL_PLAYER_SIZE * 2.8) + 6; color = ENEMY_FISH_COLORS[Math.floor(Math.random() * ENEMY_FISH_COLORS.length)]; if (edge < 0.5) { x = (edge < 0.25 ? -size : canvas.width + size); y = Math.random() * canvas.height; } else { x = Math.random() * canvas.width; y = (edge < 0.75 ? -size : canvas.height + size); } newEntity = new EnemyFish(x, y, size, color); break; case 'shrimp': if (edge < 0.5) { x = (edge < 0.25 ? -5 : canvas.width + 5); y = Math.random() * canvas.height; } else { x = Math.random() * canvas.width; y = (edge < 0.75 ? -5 : canvas.height + 5); } newEntity = new Shrimp(x, y); break; case 'jellyfish': x = Math.random() * canvas.width; y = -20; newEntity = new Jellyfish(x, y); break; case 'seahorse': x = (edge < 0.5 ? Math.random() * canvas.width * 0.2 : canvas.width * 0.8 + Math.random() * canvas.width * 0.2); y = Math.random() * (canvas.height - 40) + 20; newEntity = new Seahorse(x,y); break; case 'crab': x = Math.random() * canvas.width; newEntity = new Crab(x); break; } if (newEntity) { newEntity.dx = initialDx; newEntity.dy = initialDy; if (newEntity.x < 0 && newEntity.dx < 0) newEntity.dx *= -1; if (newEntity.x > canvas.width && newEntity.dx > 0) newEntity.dx *= -1; if (newEntity.y < 0 && newEntity.dy < 0) newEntity.dy *= -1; if (newEntity.y > canvas.height && newEntity.dy > 0) newEntity.dy *= -1; if(Math.abs(newEntity.dx) > 0.1) newEntity.facingRight = newEntity.dx > 0; entities.push(newEntity); } }
    function updateLivesDisplay() { /* ... (Keep implementation) ... */ livesContainer.innerHTML = ''; if (!player) return; for (let i = 0; i < player.lives; i++) { const lifeIcon = document.createElement('div'); lifeIcon.classList.add('life-icon'); livesContainer.appendChild(lifeIcon); } }
    function gameOver() { /* ... (Keep implementation, ensure text uses Chinese) ... */ isGameOver = true; if (gameLoopId) cancelAnimationFrame(gameLoopId); gameLoopId = null; if (score > highScore) { highScore = score; saveHighScore(); } updateUIDisplay(); messageText.innerHTML = `游戏结束!<br>最终分数: ${score}<br>最高分: ${highScore}`; startButton.textContent = '再玩一次'; gameMessageScreen.style.display = 'flex'; }
    function togglePause() { /* ... (Keep implementation, ensure text uses Chinese) ... */ if (isGameOver) return; isPaused = !isPaused; if (isPaused) { pauseScreen.style.display = 'flex'; pauseButton.textContent = '继续'; if (gameLoopId) cancelAnimationFrame(gameLoopId); gameLoopId = null; } else { pauseScreen.style.display = 'none'; pauseButton.textContent = '暂停'; if (!gameLoopId) { let lastTime = performance.now(); function animationLoop(timestamp) { if (!lastTime) lastTime = timestamp; const deltaTime = timestamp - lastTime; lastTime = timestamp; gameLoop(deltaTime); if(!isGameOver && !isPaused) gameLoopId = requestAnimationFrame(animationLoop); else gameLoopId = null; } requestAnimationFrame(animationLoop); } } }
    function updateUIDisplay() { /* ... (Keep implementation) ... */ scoreElement.textContent = score; playerSizeElement.textContent = Math.floor(player ? player.size : INITIAL_PLAYER_SIZE); highScoreElement.textContent = highScore; }
    function saveHighScore() { /* ... (Keep implementation) ... */ try { localStorage.setItem('pixelFinsDeluxeMobileV1', highScore); } catch(e) { console.warn("无法保存最高分"); } } // Use a new key for mobile version
    function loadHighScore() { /* ... (Keep implementation) ... */ try { const savedScore = localStorage.getItem('pixelFinsDeluxeMobileV1'); highScore = savedScore ? parseInt(savedScore, 10) : 0; } catch(e) { highScore = 0; console.warn("无法加载最高分"); } }


    // --- Event Listeners ---
    // Keyboard (Keep for desktop/debugging)
    document.addEventListener('keydown', (e) => {
        if (isGameOver && e.key === 'Enter') { initGame(); return; }
        if (e.key.toLowerCase() === 'p' || e.key === "Escape") { togglePause(); return; }
        if (!isPaused && !isGameOver) {
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keysPressed.ArrowUp = true;
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keysPressed.ArrowDown = true;
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = true;
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = true;
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keysPressed.ArrowUp = false;
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keysPressed.ArrowDown = false;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = false;
    });

    // Touch Controls for D-Pad and Action Buttons
    function setupButtonHold(buttonElement, keyName) {
        const handlePress = (e) => {
             e.preventDefault();
             if (!isPaused && !isGameOver) { keysPressed[keyName] = true; }
             buttonElement.classList.add('active-touch');
        };
        const handleRelease = (e) => {
             e.preventDefault();
             keysPressed[keyName] = false;
             buttonElement.classList.remove('active-touch');
        };
        buttonElement.addEventListener('mousedown', handlePress);
        buttonElement.addEventListener('mouseup', handleRelease);
        buttonElement.addEventListener('mouseleave', handleRelease);
        buttonElement.addEventListener('touchstart', handlePress, { passive: false });
        buttonElement.addEventListener('touchend', handleRelease);
        buttonElement.addEventListener('touchcancel', handleRelease);
    }

    // Assign touch handlers to D-pad buttons
    if (upButton) setupButtonHold(upButton, 'ArrowUp');
    if (downButton) setupButtonHold(downButton, 'ArrowDown');
    if (leftButton) setupButtonHold(leftButton, 'ArrowLeft');
    if (rightButton) setupButtonHold(rightButton, 'ArrowRight');

    // Start Button (Overlay)
    startButton.addEventListener('click', initGame);
    startButton.addEventListener('touchstart', (e) => { e.preventDefault(); initGame(); }, { passive: false });

    // Pause Button (Action Button)
    pauseButton.addEventListener('click', togglePause);
    pauseButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        togglePause();
        pauseButton.classList.add('active-touch');
        setTimeout(() => pauseButton.classList.remove('active-touch'), 150);
    }, { passive: false });

    // Prevent canvas default touch actions (like scrolling)
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });


    // --- Window Resize Logic ---
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized or orientation changed");
            resizeCanvas(); // Resize the canvas element

            // Optional: Redraw static elements if game isn't running
            if (isGameOver || !gameLoopId) { // Check if game loop isn't active
                 initializeUI(false); // Redraw initial UI without resetting state
            }
            // No need to reposition entities here as their coords are absolute
            // unless specific scaling logic was added (which it wasn't here).

        }, 100); // Debounce
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // --- Initial UI Setup ---
    function initializeUI(isFirstLoad = true) {
        console.log("Initializing UI...");
        resizeCanvas(); // Ensure canvas is sized correctly first

        if (isFirstLoad) {
            loadHighScore(); // Load HS only on first load
            player = new PlayerFish(0,0,INITIAL_PLAYER_SIZE,PLAYER_FISH_COLOR); // Temp player for initial UI
            score = 0;
            isGameOver = true;
            isPaused = false;
        }
        // Always update displays
        updateUIDisplay();
        updateLivesDisplay(); // Will use player.lives if available

        // Set up message screen for start
        messageText.innerHTML = "像素大鱼!<br>生存下来!"; // Chinese text
        startButton.textContent = '开始游戏';
        pauseButton.textContent = '暂停';
        gameMessageScreen.style.display = 'flex';
        pauseScreen.style.display = 'none';

        // Draw initial preview
        context.fillStyle = SCREEN_BG_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Only draw preview if player exists and canvas has dimensions
        if(player && canvas.width > 0 && canvas.height > 0) {
             const tempPlayer = new PlayerFish(canvas.width / 2 - canvas.width * 0.1, canvas.height / 2, INITIAL_PLAYER_SIZE, PLAYER_FISH_COLOR);
             tempPlayer.draw();
             const tempEnemy = new EnemyFish(canvas.width / 2 + canvas.width * 0.1, canvas.height / 2, INITIAL_PLAYER_SIZE * 0.7, ENEMY_FISH_COLORS[0]);
             tempEnemy.draw();
        }
         console.log("Initial UI drawn.");
    }

    // --- Particles Setup --- (Keep as before)
    if (window.particlesJS) { /* ... (Keep implementation) ... */ particlesJS('particles-js-bubbles', { "particles": { "number": { "value": 40, "density": { "enable": true, "value_area": 1000 } }, "color": { "value": "#FFFFFF" }, "shape": { "type": "circle"}, "opacity": { "value": 0.25, "random": true, "anim": { "enable": true, "speed": 0.3, "opacity_min": 0.05, "sync": false } }, "size": { "value": 12, "random": true, "anim": { "enable": true, "speed": 2.5, "size_min": 4, "sync": false } }, "move": { "enable": true, "speed": 1.2, "direction": "top", "random": true, "straight": false, "out_mode": "out", "bounce": false, }}, "interactivity": { "enable": false }, "retina_detect": true }); } else { console.error("particles.js library not loaded."); }


    // --- Start ---
    initializeUI(true); // Initial setup on page load

}); // End DOMContentLoaded