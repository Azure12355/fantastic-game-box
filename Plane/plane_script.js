document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('planeCanvas');
    const context = canvas.getContext('2d');

    const scoreElement = document.getElementById('score');
    const livesContainer = document.getElementById('livesContainer');
    const bombsCountElement = document.getElementById('bombsCount');
    const highScoreElement = document.getElementById('highScore');

    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const playerPlaneImageElement = document.getElementById('playerPlaneImage');
    const startButton = document.getElementById('startButton');

    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const shootButton = document.getElementById('shootButton');
    const bombButton = document.getElementById('bombButton');
    const pauseActionButton = document.getElementById('pauseActionButton');
    const gamePauseScreen = document.getElementById('pauseScreen');

    canvas.width = 400;
    canvas.height = 450;

    // Game Settings & Colors
    const SCREEN_BG_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--screen-bg').trim();
    const PLAYER_MAIN_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--alt-accent-color').trim();
    const PLAYER_ACCENT_COLOR = '#2980b9'; // Darker Blue
    const PLAYER_COCKPIT_COLOR = '#ecf0f1'; // Light grey/white
    const PLAYER_THRUSTER_COLOR = '#f39c12'; // Orange
    const PLAYER_BULLET_COLOR = '#f1c40f'; // Yellow bullets
    const ENEMY_BULLET_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(); // Red enemy bullets
    const ENEMY_MAIN_COLORS = ['#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#c0392b']; // Green, Purple, Orange, Turquoise, Red enemies
    const ENEMY_ACCENT_COLORS = ['#27ae60', '#8e44ad', '#d35400', '#16a085', '#a93226']; // Darker versions
    const EXPLOSION_COLORS = ['#f1c40f', '#e67e22', '#e74c3c', '#ffffff']; // Yellow, Orange, Red, White for explosions

    const PLAYER_WIDTH = 28; const PLAYER_HEIGHT = 22; const PLAYER_SPEED = 3.5;
    const PLAYER_BULLET_SPEED = 7; const PLAYER_BULLET_COOLDOWN = 150;
    const PLAYER_INITIAL_LIVES = 3; const PLAYER_INITIAL_BOMBS = 3;
    const PLAYER_RESPAWN_INVINCIBILITY = 2000;

    const ENEMY_SPAWN_INTERVAL = 1000;
    const ENEMY_MOVE_SPEED_MIN = 1; const ENEMY_MOVE_SPEED_MAX = 2.8;
    const ENEMY_SHOOT_CHANCE = 0.012; const ENEMY_BULLET_SPEED = 4.5;

    const POWERUP_DROP_CHANCE = 0.12;
    const POWERUP_TYPES = ['shield', 'rapidFire', 'bomb', 'extraLife'];
    const POWERUP_DURATION = 7000;

    // Game State Variables - Initialize properly
    let player = null;
    let bullets = [];
    let enemyBullets = [];
    let enemies = [];
    let explosions = [];
    let powerups = [];
    let score = 0;
    let lives = 0;
    let bombs = 0;
    let highScore = 0;
    let gameLoopId = null; // Use null to indicate no loop running
    let lastPlayerShootTime = 0;
    let lastEnemySpawnTime = 0;
    let lastFrameTime = 0;
    let isPaused = false;
    let isGameOver = true; // Start in game over state until initGame is called
    let rapidFireActive = false;
    let shieldActive = false;
    let rapidFireTimer = 0;
    let shieldTimer = 0;

    const keysPressed = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };

    function getRandomColor(colorsArray) { return colorsArray[Math.floor(Math.random() * colorsArray.length)]; }
    function checkCollision(rect1, rect2) {
        // Ensure objects exist and have dimensions before checking
        if (!rect1 || !rect2 || !rect1.active || !rect2.active) return false;
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    class GameObject {
        constructor(x, y, width, height, color, type) {
            this.x = x; this.y = y; this.width = width; this.height = height; this.color = color; this.type = type;
            this.dx = 0; this.dy = 0; this.active = true;
        }
        draw(ctx) {}
        update(deltaTime) {}
    }

    class Player extends GameObject {
        constructor() {
            super(canvas.width / 2 - PLAYER_WIDTH / 2, canvas.height * 0.80 - PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_MAIN_COLOR, 'player');
            this.isInvincible = false; this.invincibilityTimer = 0; this.blinkOn = true; this.thrusterPhase = 0;
        }
        draw(ctx) {
            if (!this.active) return;
            if (this.isInvincible && lives > 0) { this.blinkOn = !this.blinkOn; if (!this.blinkOn) return; }

            const x = Math.round(this.x); const y = Math.round(this.y); const w = this.width; const h = this.height;
            const unit = Math.max(1, Math.floor(Math.min(w,h) / 6));
            ctx.fillStyle = this.color; ctx.fillRect(x + unit*1, y, unit*4, h - unit*1);
            ctx.fillStyle = PLAYER_ACCENT_COLOR; ctx.fillRect(x, y + unit*2, w, unit*2);
            ctx.fillStyle = PLAYER_COCKPIT_COLOR; ctx.fillRect(x + unit*2, y + unit*1, unit*2, unit*1);
            ctx.fillStyle = PLAYER_ACCENT_COLOR; ctx.fillRect(x + unit*2.5, y + h - unit*2, unit*1, unit*2);
            this.thrusterPhase += 0.2; const thrusterSize = unit * (1 + Math.sin(this.thrusterPhase) * 0.3);
            ctx.fillStyle = PLAYER_THRUSTER_COLOR;
            ctx.fillRect(x + unit*1.5, y + h - unit*1, unit*1, thrusterSize); ctx.fillRect(x + unit*3.5, y + h - unit*1, unit*1, thrusterSize);
            if (shieldActive) {
                ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height / 2, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
                ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--alt-accent-color').trim();
                ctx.lineWidth = 3; ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 100) * 0.2; ctx.stroke(); ctx.globalAlpha = 1.0;
            }
        }
        update(deltaTime) {
             if (!this.active) return;
            this.dx = 0; this.dy = 0;
            if (keysPressed.ArrowUp) this.dy = -PLAYER_SPEED; if (keysPressed.ArrowDown) this.dy = PLAYER_SPEED;
            if (keysPressed.ArrowLeft) this.dx = -PLAYER_SPEED; if (keysPressed.ArrowRight) this.dx = PLAYER_SPEED;
            if (this.dx !== 0 && this.dy !== 0) { const d = Math.sqrt(0.5); this.dx *= d; this.dy *= d; }
            this.x += this.dx; this.y += this.dy;
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
            if (this.isInvincible) { this.invincibilityTimer -= deltaTime; if (this.invincibilityTimer <= 0) { this.isInvincible = false; this.blinkOn = true; }}
        }
        shoot() {
             if (!this.active) return;
            const curTime = performance.now(); const cool = rapidFireActive ? PLAYER_BULLET_COOLDOWN / 2.5 : PLAYER_BULLET_COOLDOWN;
            if (curTime - lastPlayerShootTime > cool) {
                bullets.push(new Bullet(this.x + this.width / 2 - 2.5, this.y, 5, 10, PLAYER_BULLET_COLOR, 'playerBullet', -PLAYER_BULLET_SPEED));
                lastPlayerShootTime = curTime;
            }
        }
        loseLife() {
             if (!this.active || shieldActive || this.isInvincible) return false; // Added !this.active check
             lives--; updateLivesDisplay();
             explosions.push(new Explosion(this.x + this.width / 2, this.y + this.height / 2, this.width * 1.5));
             if (lives <= 0) { this.active = false; return true; } // Mark inactive and signal game over
             else { this.isInvincible = true; this.invincibilityTimer = PLAYER_RESPAWN_INVINCIBILITY; this.x = canvas.width / 2 - this.width / 2; this.y = canvas.height * 0.80 - this.height / 2; return false; }
         }
        activatePowerUp(type) {
             if (!this.active) return;
            switch (type) {
                case 'shield': shieldActive = true; shieldTimer = POWERUP_DURATION; break;
                case 'rapidFire': rapidFireActive = true; rapidFireTimer = POWERUP_DURATION; break;
                case 'bomb': bombs++; updateBombsDisplay(); break;
                case 'extraLife': if(lives < 5) lives++; updateLivesDisplay(); break;
            }
        }
    }

    class Bullet extends GameObject {
        constructor(x, y, width, height, color, type, speedY) { super(x, y, width, height, color, type); this.dy = speedY; }
        draw(ctx) { if (!this.active) return; ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height); }
        update(deltaTime) { if (!this.active) return; this.y += this.dy; if (this.y < -this.height || this.y > canvas.height) { this.active = false; }}
    }

    class Enemy extends GameObject {
        constructor() {
            const sizeRatio = Math.random() * 0.5 + 0.8;
            const baseWidth = Math.random() * 15 + 20; // Local var
            const baseHeight = baseWidth * (Math.random() * 0.2 + 0.7); // Local var
            const width = Math.round(baseWidth * sizeRatio);
            const height = Math.round(baseHeight * sizeRatio);
            const x = Math.random() * (canvas.width - width);
            const y = -height;
            const colorIndex = Math.floor(Math.random() * ENEMY_MAIN_COLORS.length);
            const mainColor = ENEMY_MAIN_COLORS[colorIndex];
            const accentColor = ENEMY_ACCENT_COLORS[colorIndex]; // Calculate before super

            super(x, y, width, height, mainColor, 'enemy'); // Call super FIRST

            // Assign other properties AFTER super()
            this.accentColor = accentColor;
            this.dy = Math.random() * (ENEMY_MOVE_SPEED_MAX - ENEMY_MOVE_SPEED_MIN) + ENEMY_MOVE_SPEED_MIN;
            this.initialDx = (Math.random() - 0.5) * 1.5;
            this.dx = this.initialDx;
            this.health = Math.max(1, Math.floor(width / 8));
            this.pattern = Math.random() < 0.3 ? 'sine' : (Math.random() < 0.5 ? 'diagonal' : 'straight');
            this.patternPhase = Math.random() * Math.PI * 2;
        }
        draw(ctx) {
            if (!this.active) return;
            const x=Math.round(this.x); const y=Math.round(this.y); const w=this.width; const h=this.height; const u=Math.max(1,Math.floor(Math.min(w,h)/5));
            ctx.fillStyle=this.color; ctx.fillRect(x+u*0.5,y,w-u,h-u*1.5); ctx.fillStyle=this.accentColor; ctx.fillRect(x,y+u,u*1.5,h-u*2);
            ctx.fillRect(x+w-u*1.5,y+u,u*1.5,h-u*2); ctx.fillStyle=PLAYER_COCKPIT_COLOR; ctx.fillRect(x+w/2-u*0.5,y+u*0.5,u,u);
            ctx.fillStyle=this.accentColor; ctx.fillRect(x+u,y+h-u*1.5,w-u*2,u*1.5);
        }
        update(deltaTime) {
            if (!this.active) return;
            this.patternPhase+=0.03; let pDx=0; if(this.pattern==='sine'){pDx=Math.sin(this.patternPhase)*1.2; this.dx=pDx;}
            else if(this.pattern==='diagonal'){this.dx=this.initialDx;} else{this.dx=0;}
            this.x+=this.dx; this.y+=this.dy; if(this.y>canvas.height){this.active=false;}
            if(this.x<0||this.x+this.width>canvas.width){this.initialDx*=-1;this.dx*=-1;this.x=Math.max(0,Math.min(canvas.width-this.width,this.x));if(this.pattern==='sine')this.patternPhase+=Math.PI;}
            if(Math.random()<ENEMY_SHOOT_CHANCE&&this.y>0&&this.y<canvas.height*0.75){enemyBullets.push(new Bullet(this.x+this.width/2-2.5,this.y+this.height,5,10,ENEMY_BULLET_COLOR,'enemyBullet',ENEMY_BULLET_SPEED));}
        }
        takeDamage() {
            if (!this.active) return;
            this.health--; if(this.health<=0){this.active=false; explosions.push(new Explosion(this.x+this.width/2,this.y+this.height/2,this.width));
            score+=Math.floor(this.width); updateScoreDisplay(); if(Math.random()<POWERUP_DROP_CHANCE){powerups.push(new PowerUp(this.x+this.width/2,this.y+this.height/2));}}
        }
    }

    class Explosion extends GameObject {
        constructor(x,y,bS){super(x,y,0,0,'','explosion');this.particles=[];const nP=Math.floor(bS/2)+10;for(let i=0;i<nP;i++){this.particles.push({x:this.x,y:this.y,size:Math.random()*(bS/10)+2,color:getRandomColor(EXPLOSION_COLORS),dx:(Math.random()-0.5)*(bS/5),dy:(Math.random()-0.5)*(bS/5),life:Math.random()*0.5+0.3});}}
        draw(ctx){if (!this.active) return; this.particles.forEach(p=>{if(p.life>0){ctx.fillStyle=p.color;ctx.globalAlpha=p.life*2;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}});ctx.globalAlpha=1.0;}
        update(deltaTime){if (!this.active) return; let aD=true; this.particles.forEach(p=>{if(p.life>0){p.x+=p.dx*(deltaTime/16.67);p.y+=p.dy*(deltaTime/16.67);p.life-=deltaTime/1000;if(p.life>0)aD=false;}});if(aD)this.active=false;}
    }
    class PowerUp extends GameObject {
        constructor(x,y){const t=POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];let c;let s='?';
        switch(t){case'shield':c=getComputedStyle(document.documentElement).getPropertyValue('--alt-accent-color').trim();s='S';break;case'rapidFire':c='#f1c40f';s='R';break;case'bomb':c=getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();s='B';break;case'extraLife':c='#2ecc71';s='+1';break;default:c='#ffffff';}
        super(x-10,y-10,20,20,c,'powerup');this.powerUpType=t;this.symbol=s;this.dy=1.5;}
        draw(ctx){if (!this.active) return; ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x+this.width/2,this.y+this.height/2,this.width/2,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=(this.powerUpType==='rapidFire'||this.powerUpType==='extraLife')?"#000":"#FFF";ctx.font=(this.symbol==='+1'?"bold 8px":"bold 10px")+" 'Press Start 2P'";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(this.symbol,this.x+this.width/2,this.y+this.height/2+(this.symbol==='+1'?0:1));}
        update(deltaTime){if (!this.active) return; this.y+=this.dy;if(this.y>canvas.height)this.active=false;}
    }

    function initGame() {
        // Clear previous game loop if any
        if (gameLoopId !== null) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }

        player = new Player(); // Create new player instance
        bullets = []; enemyBullets = []; enemies = []; explosions = []; powerups = [];
        score = 0; lives = PLAYER_INITIAL_LIVES; bombs = PLAYER_INITIAL_BOMBS;
        isPaused = false; isGameOver = false; // Reset game state flags
        lastPlayerShootTime = 0; lastEnemySpawnTime = performance.now(); lastFrameTime = performance.now(); // Reset timers
        rapidFireActive = false; shieldActive = false; rapidFireTimer = 0; shieldTimer = 0;
        for (const key in keysPressed) { keysPressed[key] = false; }

        updateScoreDisplay(); updateLivesDisplay(); updateBombsDisplay(); loadHighScore();

        gameMessageScreen.style.display = 'none'; gamePauseScreen.style.display = 'none';
        if (playerPlaneImageElement && !playerPlaneImageElement.src) { // Check src
            playerPlaneImageElement.style.display = 'none';
        } else if (playerPlaneImageElement) {
             playerPlaneImageElement.style.display = 'none'; // Also hide if src exists but game starting
        }
        
        // Start the animation loop
        gameLoopId = requestAnimationFrame(animationLoop);
    }

    function animationLoop(timestamp) {
        // Stop the loop if the game ended OR if paused
        if (isGameOver) {
             gameLoopId = null; // Explicitly clear ID
             return; // Stop requesting new frames
        }
        if (isPaused) {
            lastFrameTime = timestamp; // Prevent large deltaTime jump on resume
            gameLoopId = requestAnimationFrame(animationLoop); // Keep requesting frames to check pause state
            return; // Don't run game logic
        }


        // Calculate deltaTime
        if (!lastFrameTime) { // First frame after start/resume
            lastFrameTime = timestamp;
        }
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        // Run the actual game logic/drawing
        gameLogic(deltaTime);

        // Request the next frame
        gameLoopId = requestAnimationFrame(animationLoop);
    }


    function gameLogic(deltaTime) {
        deltaTime = Math.min(deltaTime, 50); // Cap deltaTime to prevent massive jumps if tab loses focus
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
        const currentTime = performance.now();

        if (shieldActive) { shieldTimer -= deltaTime; if (shieldTimer <= 0) shieldActive = false; }
        if (rapidFireActive) { rapidFireTimer -= deltaTime; if (rapidFireTimer <= 0) rapidFireActive = false; }

        // Only update/draw/interact if the player exists and is active
        if (player && player.active) {
            player.update(deltaTime);
            if (keysPressed.Space) player.shoot();
            player.draw(context); // Draw player last (or after BG elements)
        } else if (!isGameOver) {
             // If player doesn't exist or is inactive, but game isn't marked over, trigger game over.
             // This is a safety check. loseLife should handle this.
             gameOver();
             return; // Exit gameLogic early if game over triggered
        }

        if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) { enemies.push(new Enemy()); lastEnemySpawnTime = currentTime; }

        // Update and draw other objects
        [...bullets, ...enemyBullets, ...enemies, ...explosions, ...powerups].forEach(obj => {
            if (obj.active) {
                obj.update(deltaTime);
                obj.draw(context);
            }
        });

        // Collision detection (only if player is active)
        if (player && player.active) {
            bullets.forEach(bullet => { enemies.forEach(enemy => { if (checkCollision(bullet, enemy)) { bullet.active = false; enemy.takeDamage(); }}); });
            enemyBullets.forEach(bullet => { if (checkCollision(bullet, player)) { bullet.active = false; if (player.loseLife()) { gameOver(); return; } }});
            enemies.forEach(enemy => { if (checkCollision(enemy, player)) { enemy.health = 0; enemy.takeDamage(); if (player.loseLife()) { gameOver(); return; } }});
            powerups.forEach(powerup => { if (checkCollision(powerup, player)) { player.activatePowerUp(powerup.powerUpType); powerup.active = false; }});
        }

        // Filter out inactive objects
        bullets = bullets.filter(b => b.active); enemyBullets = enemyBullets.filter(eb => eb.active);
        enemies = enemies.filter(e => e.active); explosions = explosions.filter(ex => ex.active);
        powerups = powerups.filter(p => p.active);
        // Player is handled separately regarding game over state
    }

    function useBomb() {
        if (bombs > 0 && !isGameOver && !isPaused) {
            bombs--; updateBombsDisplay();
            enemies.forEach(enemy => { if (enemy.active) { enemy.active = false; explosions.push(new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 1.5)); }});
            enemyBullets.forEach(bullet => bullet.active = false);
            canvas.style.animation = 'screenFlash 0.3s ease-out';
            setTimeout(() => canvas.style.animation = '', 300);
        }
    }

    function gameOver() {
        if (isGameOver) return; // Prevent multiple calls
        isGameOver = true;
        if(player) player.active = false; // Ensure player is marked inactive
        // Cancel any pending animation frame request
        if (gameLoopId !== null) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        if (score > highScore) { highScore = score; saveHighScore(); }
        updateScoreDisplay();
        messageText.innerHTML = `MISSION FAILED!<br>SCORE: ${score}<br>HIGH SCORE: ${highScore}`;
        // Only show plane image if the element exists AND has a source set
        if (playerPlaneImageElement && playerPlaneImageElement.src && playerPlaneImageElement.src !== window.location.href) {
             playerPlaneImageElement.style.display = 'block';
        } else if (playerPlaneImageElement) {
             playerPlaneImageElement.style.display = 'none';
        }
        startButton.textContent = 'RETRY MISSION';
        gameMessageScreen.style.display = 'flex';
    }

    function togglePause() {
        if (isGameOver) return;
        isPaused = !isPaused;
        if (isPaused) {
            gamePauseScreen.style.display = 'flex';
            // Loop will naturally stop calling gameLogic via animationLoop checks
        } else {
            gamePauseScreen.style.display = 'none';
            lastFrameTime = performance.now(); // Reset timer on resume
            if (gameLoopId === null) { // Restart loop if it was fully stopped
                gameLoopId = requestAnimationFrame(animationLoop);
            }
        }
    }

    function updateScoreDisplay() { scoreElement.textContent = score; highScoreElement.textContent = highScore; }
    function updateLivesDisplay() {
        livesContainer.innerHTML = '';
        // Check if player exists before accessing lives
        const currentLives = player ? player.lives : (isGameOver ? 0 : PLAYER_INITIAL_LIVES);
        for (let i = 0; i < currentLives; i++) {
            const lifeIcon = document.createElement('i');
            lifeIcon.className = 'fas fa-fighter-jet life-icon-plane';
            livesContainer.appendChild(lifeIcon);
        }
    }
    function updateBombsDisplay() { bombsCountElement.textContent = bombs; }
    function saveHighScore() { localStorage.setItem('pixelWingsHighScoreV3', highScore); } // V3 key
    function loadHighScore() { const savedScore = localStorage.getItem('pixelWingsHighScoreV3'); highScore = savedScore ? parseInt(savedScore, 10) : 0; }

    document.addEventListener('keydown', (e) => {
        if (isGameOver && e.key === 'Enter') { initGame(); return; }
        if (e.key.toLowerCase() === 'p' || e.key === "Escape") { togglePause(); return; }
        if (!isPaused && !isGameOver) {
            if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keysPressed.ArrowUp = true;
            if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keysPressed.ArrowDown = true;
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = true;
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = true;
            if (e.key === ' ') { keysPressed.Space = true; e.preventDefault(); }
            if (e.key.toLowerCase() === 'b') useBomb();
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keysPressed.ArrowUp = false;
        if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keysPressed.ArrowDown = false;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keysPressed.ArrowLeft = false;
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keysPressed.ArrowRight = false;
        if (e.key === ' ') keysPressed.Space = false;
    });

    function setupButtonHold(buttonElement, keyName) {
        buttonElement.addEventListener('mousedown', (e) => { e.preventDefault(); if(!isPaused && !isGameOver) keysPressed[keyName] = true;});
        buttonElement.addEventListener('mouseup', () => keysPressed[keyName] = false);
        buttonElement.addEventListener('mouseleave', () => keysPressed[keyName] = false);
        buttonElement.addEventListener('touchstart', (e) => { e.preventDefault(); if(!isPaused && !isGameOver) keysPressed[keyName] = true; });
        buttonElement.addEventListener('touchend', (e) => { e.preventDefault(); keysPressed[keyName] = false; });
    }
    setupButtonHold(upButton, 'ArrowUp'); setupButtonHold(downButton, 'ArrowDown');
    setupButtonHold(leftButton, 'ArrowLeft'); setupButtonHold(rightButton, 'ArrowRight');
    setupButtonHold(shootButton, 'Space');

    bombButton.addEventListener('click', useBomb);
    pauseActionButton.addEventListener('click', togglePause);
    startButton.addEventListener('click', initGame);

    // Initial UI setup
    function initializeUI() {
        loadHighScore();
        // Don't create player instance here, just set default values for UI
        lives = PLAYER_INITIAL_LIVES;
        bombs = PLAYER_INITIAL_BOMBS;
        score = 0;
        updateScoreDisplay(); updateLivesDisplay(); updateBombsDisplay();
        messageText.innerHTML = "PIXEL WINGS II<br>GET READY!"; startButton.textContent = 'START MISSION';
        if (playerPlaneImageElement && !playerPlaneImageElement.src) playerPlaneImageElement.style.display = 'none';
        gameMessageScreen.style.display = 'flex'; gamePauseScreen.style.display = 'none'; // Ensure pause screen is hidden
        context.fillStyle = SCREEN_BG_COLOR; context.fillRect(0, 0, canvas.width, canvas.height);
        // Draw placeholder only if needed, maybe just show the message screen is enough
        // const tempPlayer = new Player(); tempPlayer.x = canvas.width/2 - tempPlayer.width/2; tempPlayer.y = canvas.height/2 - tempPlayer.height/2; tempPlayer.draw(context);
    }

    // Particles.js Setup
    if (window.particlesJS) {
        particlesJS('particles-js-stars', {
            "particles": { "number": { "value": 150, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0 } }, "opacity": { "value": 0.8, "random": true, "anim": { "enable": true, "speed": 0.5, "opacity_min": 0.1, "sync": false } }, "size": { "value": 1.5, "random": true, "anim": { "enable": false } }, "line_linked": { "enable": false }, "move": { "enable": true, "speed": 0.3, "direction": "bottom", "random": true, "straight": true, "out_mode": "out", "bounce": false }},
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": false }, "onclick": { "enable": false }, "resize": true } },
            "retina_detect": true
        });
    } else { console.error("particles.js library not loaded."); }

    // Initialize the UI when the page loads
    initializeUI();

}); // End DOMContentLoaded