document.addEventListener("DOMContentLoaded", () => {
  // --- Get DOM Elements ---
  const canvas = document.getElementById("pacmanCanvas");
  const context = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");
  const livesContainer = document.getElementById("livesContainer");
  const highScoreElement = document.getElementById("highScore");
  const gameMessageScreen = document.getElementById("gameMessageScreen");
  const messageText = document.getElementById("messageText");
  const startButton = document.getElementById("startButton");
  const levelCompleteScreen = document.getElementById("levelCompleteScreen");
  const restartButtonPanel = document.getElementById("restartButtonPanel");
  const upButton = document.getElementById("upButton");
  const downButton = document.getElementById("downButton");
  const leftButton = document.getElementById("leftButton");
  const rightButton = document.getElementById("rightButton");
  const pauseActionButton = document.getElementById("pauseActionButton");
  const gamePauseScreen = document.getElementById("pauseScreen");

  // --- Game Settings & Constants ---
  let TILE_SIZE = 20; // Default, recalculated dynamically
  let PELLET_RADIUS = 2;
  let POWER_PELLET_RADIUS = 5;

  const PACMAN_SPEED = 2.8; // Tiles per second (Adjusted slightly)
  const GHOST_SPEED = 2.6;
  const GHOST_FRIGHTENED_SPEED = 1.7;
  const POWER_PELLET_DURATION = 7000;
  const GHOST_FLASH_START_TIME = 5000;
  const GHOST_RESPAWN_TIME = 3000;
  const PLAYER_INITIAL_LIVES = 3;

  // Colors (Keep color fetching as before)
  const WALL_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--wall-color")
      .trim() || "#4fc3f7";
  const DOT_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--dot-color")
      .trim() || "#fff59d";
  const POWER_PELLET_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--power-pellet-color")
      .trim() || "#ffffff";
  const PACMAN_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-color")
      .trim() || "#ffdd57";
  const GHOST_COLORS = {
    blinky:
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ghost-red")
        .trim() || "#ff7043",
    pinky:
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ghost-pink")
        .trim() || "#ec407a",
    inky:
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ghost-cyan")
        .trim() || "#26c6da",
    clyde:
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ghost-orange")
        .trim() || "#ffa726",
  };
  const GHOST_FRIGHTENED_BODY_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--ghost-frightened-body")
      .trim() || "#64b5f6";
  const GHOST_FRIGHTENED_EYES_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--ghost-frightened-eyes")
      .trim() || "#ffffff";
  const SCREEN_BG_COLOR =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--screen-bg")
      .trim() || "#1c1d30";

  // Maze Map (Keep level1Map as before)
  const level1Map = [
    /* ... Keep the 28x23 map data ... */ [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
      1, 2, 1,
    ],
    [
      1, 3, 1, 0, 0, 1, 2, 1, 0, 0, 0, 1, 2, 1, 1, 2, 1, 0, 0, 0, 1, 2, 1, 0, 0,
      1, 3, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
      1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1,
      1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2,
      2, 2, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1,
      1, 1, 1,
    ],
    [
      0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0,
      0, 0, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 1, 1, 2, 1, 1, 1,
      1, 1, 1,
    ],
    [
      1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0, 0, 2, 0, 0, 0,
      0, 0, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1,
      1, 1, 1,
    ],
    [
      0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0,
      0, 0, 0,
    ],
    [
      1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1,
      1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1,
      1, 2, 1,
    ],
    [
      1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 5, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2,
      1, 3, 1,
    ],
    [
      1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2,
      1, 1, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2,
      2, 2, 1,
    ],
    [
      1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 2, 1,
    ],
    [
      1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 1,
    ],
    [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1,
    ],
  ];
  let currentMap = level1Map;
  let MAP_ROWS = currentMap.length;
  let MAP_COLS = currentMap[0].length;

  // --- Game State Variables (Keep as before) ---
  let pacman = null;
  let ghosts = [];
  let dots = [];
  let powerPellets = [];
  let totalDots = 0;
  let score = 0;
  let lives = 0;
  let highScore = 0;
  let currentLevel = 1;
  let gameLoopId = null;
  let lastFrameTime = 0;
  let isPaused = false;
  let isGameOver = true;
  let frightenedMode = false;
  let frightenedTimer = 0;
  let ghostFlashState = false;
  let currentDirection = "";
  let nextDirection = "";
  let ghostSpawnPoints = [];

  // --- Resize and Calculate Sizes ---
  function calculateSizes() {
    const screenContainer = document.getElementById("gameScreenContainer");
    const containerStyle = getComputedStyle(screenContainer);
    const paddingX =
      parseFloat(containerStyle.paddingLeft || 0) +
      parseFloat(containerStyle.paddingRight || 0);
    const paddingY =
      parseFloat(containerStyle.paddingTop || 0) +
      parseFloat(containerStyle.paddingBottom || 0);

    // Use clientWidth/Height which reflects the actual rendered size
    const availableWidth = screenContainer.clientWidth - paddingX;
    const availableHeight = screenContainer.clientHeight - paddingY;

    // Check for valid dimensions before calculation
    if (
      isNaN(availableWidth) ||
      isNaN(availableHeight) ||
      availableWidth <= 0 ||
      availableHeight <= 0
    ) {
      console.warn("Container has invalid dimensions, using defaults.");
      TILE_SIZE = 10; // Set a smaller default if container size is bad
    } else {
      TILE_SIZE = Math.floor(
        Math.min(availableWidth / MAP_COLS, availableHeight / MAP_ROWS)
      );
    }

    // Ensure TILE_SIZE is at least 1
    TILE_SIZE = Math.max(1, TILE_SIZE);

    canvas.width = MAP_COLS * TILE_SIZE;
    canvas.height = MAP_ROWS * TILE_SIZE;

    PELLET_RADIUS = Math.max(1, Math.floor(TILE_SIZE * 0.1));
    POWER_PELLET_RADIUS = Math.max(2, Math.floor(TILE_SIZE * 0.25));

    console.log(
      `Canvas resized: ${canvas.width}x${canvas.height}, Tile Size: ${TILE_SIZE}`
    );
  }

  // --- Utility Functions (Keep as before, they use TILE_SIZE) ---
  function getPixelPos(row, col) {
    return { x: col * TILE_SIZE, y: row * TILE_SIZE };
  }
  function getGridPos(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    return {
      row: Math.max(0, Math.min(MAP_ROWS - 1, row)),
      col: Math.max(0, Math.min(MAP_COLS - 1, col)),
    };
  }
  // 修改后的 isWall 函数
  function isWall(row, col, characterType = 'pacman') {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return true; // 越界视为墙
    const tile = currentMap[row][col];
    if (tile === 1) return true; // 普通墙
    if (tile === 4 && characterType === 'pacman') return true; // 对吃豆人来说，鬼屋的特殊墙也是墙
    // 幽灵可以穿过标记为 4 的特殊墙（鬼屋的门/内部）
    return false; // 其他情况（0, 2, 3, 5，或者幽灵遇到 4）都不是墙
}
  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // --- Game Object Classes (Character, Pacman, Ghost - Keep implementations as before) ---
  // Make sure constructors and update/draw methods use the dynamic TILE_SIZE, PELLET_RADIUS etc.
  // The existing code seems to do this correctly by referencing the global variables.
  class Character {
    /* ... (Keep implementation) ... */ constructor(
      startRow,
      startCol,
      color,
      speed
    ) {
      const pos = getPixelPos(startRow, startCol);
      this.startRow = startRow;
      this.startCol = startCol;
      this.startX = pos.x + TILE_SIZE / 2;
      this.startY = pos.y + TILE_SIZE / 2;
      this.x = this.startX;
      this.y = this.startY;
      this.row = startRow;
      this.col = startCol;
      this.width = TILE_SIZE * 0.8;
      this.height = TILE_SIZE * 0.8;
      this.radius = TILE_SIZE * 0.4;
      this.color = color;
      this.baseSpeed = speed;
      this.currentSpeed = speed;
      this.direction = "left";
      this.nextDirection = "left";
      this.active = true;
    }
    update(deltaTime) {
      if (!this.active) return;
      const speedPixelsPerFrame =
        this.currentSpeed * TILE_SIZE * (deltaTime / 1000);
      this.move(speedPixelsPerFrame);
      const currentGridPos = getGridPos(this.x, this.y);
      this.row = currentGridPos.row;
      this.col = currentGridPos.col;
    }
    move(speed) {
        const centerOffsetX = TILE_SIZE / 2;
        const centerOffsetY = TILE_SIZE / 2;
        const tolerance = Math.max(1, speed * 0.7); // 调整容差，基于每帧移动的像素

        const gridCenterX = this.col * TILE_SIZE + centerOffsetX;
        const gridCenterY = this.row * TILE_SIZE + centerOffsetY;
        const characterType = this instanceof Pacman ? 'pacman' : 'ghost';

        // 尝试转向：如果接近网格中心且有下一个有效方向
        if (Math.abs(this.x - gridCenterX) < tolerance && Math.abs(this.y - gridCenterY) < tolerance) {
            if (this.nextDirection && this.nextDirection !== this.direction) {
                let nextGridRow = this.row; let nextGridCol = this.col;
                if (this.nextDirection === 'up') nextGridRow--;
                else if (this.nextDirection === 'down') nextGridRow++;
                else if (this.nextDirection === 'left') nextGridCol--;
                else if (this.nextDirection === 'right') nextGridCol++;

                const isNextLeftTunnel = this.nextDirection === 'left' && this.col === 0 && currentMap[this.row] && currentMap[this.row][MAP_COLS - 1] === 0;
                const isNextRightTunnel = this.nextDirection === 'right' && this.col === MAP_COLS - 1 && currentMap[this.row] && currentMap[this.row][0] === 0;

                if (!isWall(nextGridRow, nextGridCol, characterType) || isNextLeftTunnel || isNextRightTunnel) {
                    this.x = gridCenterX; // 转向时对齐到网格中心
                    this.y = gridCenterY;
                    this.direction = this.nextDirection;
                }
            }
        }

        // 根据当前方向移动
        let targetCellRow = this.row;
        let targetCellCol = this.col;
        if (this.direction === 'up') targetCellRow--;
        else if (this.direction === 'down') targetCellRow++;
        else if (this.direction === 'left') targetCellCol--;
        else if (this.direction === 'right') targetCellCol++;

        const isMovingToLeftTunnel = this.direction === 'left' && this.col === 0 && currentMap[this.row] && currentMap[this.row][MAP_COLS - 1] === 0;
        const isMovingToRightTunnel = this.direction === 'right' && this.col === MAP_COLS - 1 && currentMap[this.row] && currentMap[this.row][0] === 0;

        if (!isWall(targetCellRow, targetCellCol, characterType) || isMovingToLeftTunnel || isMovingToRightTunnel) {
            // 路径通畅，进行移动
            if (this.direction === 'up') this.y -= speed;
            else if (this.direction === 'down') this.y += speed;
            else if (this.direction === 'left') this.x -= speed;
            else if (this.direction === 'right') this.x += speed;

            // 如果略微偏离主轴，尝试校准（可选，轻微校准）
            if ((this.direction === 'up' || this.direction === 'down') && Math.abs(this.x - gridCenterX) > 0.1 && Math.abs(this.x - gridCenterX) < TILE_SIZE / 3) {
                 this.x += (gridCenterX - this.x > 0 ? 1 : -1) * Math.min(speed * 0.3, Math.abs(this.x - gridCenterX));
            } else if ((this.direction === 'left' || this.direction === 'right') && Math.abs(this.y - gridCenterY) > 0.1 && Math.abs(this.y - gridCenterY) < TILE_SIZE / 3) {
                 this.y += (gridCenterY - this.y > 0 ? 1 : -1) * Math.min(speed * 0.3, Math.abs(this.y - gridCenterY));
            }

        } else {
            // 路径被阻挡，对齐到当前网格中心
             this.x = gridCenterX;
             this.y = gridCenterY;
        }

        // 处理隧道环绕
        if (this.x < -TILE_SIZE / 2 && this.direction === 'left') this.x = canvas.width + TILE_SIZE / 2 - 1;
        else if (this.x > canvas.width + TILE_SIZE / 2 && this.direction === 'right') this.x = -TILE_SIZE / 2 + 1;
    }
    getBoundingBox() {
      const hW = this.width / 2;
      const hH = this.height / 2;
      return {
        x: this.x - hW,
        y: this.y - hH,
        width: this.width,
        height: this.height,
        active: this.active,
      };
    }
    getOppositeDirection(dir) {
      if (dir === "up") return "down";
      if (dir === "down") return "up";
      if (dir === "left") return "right";
      if (dir === "right") return "left";
      return null;
    }
    resetPosition() {
      const pos = getPixelPos(this.startRow, this.startCol);
      this.x = pos.x + TILE_SIZE / 2;
      this.y = pos.y + TILE_SIZE / 2;
      this.row = this.startRow;
      this.col = this.startCol;
      this.direction = this instanceof Pacman ? "left" : "up";
      this.nextDirection = this.direction;
      this.active = true;
    }
  }
  class Pacman extends Character {
    /* ... (Keep implementation) ... */ constructor(startRow, startCol) {
      super(startRow, startCol, PACMAN_COLOR, PACMAN_SPEED);
      this.mouthOpen = 0;
      this.mouthSpeed = 0.15;
      this.lives = PLAYER_INITIAL_LIVES;
    }
    draw(ctx) {
      if (!this.active) return;
      this.mouthOpen += this.mouthSpeed;
      if (this.mouthOpen > 1 || this.mouthOpen < 0) {
        this.mouthSpeed *= -1;
        this.mouthOpen = Math.max(0, Math.min(1, this.mouthOpen));
      }
      const angleOffset = (Math.PI / 7) * this.mouthOpen;
      let startAngle = angleOffset;
      let endAngle = Math.PI * 2 - angleOffset;
      let rotation = 0;
      if (this.direction === "right") rotation = 0;
      else if (this.direction === "down") rotation = Math.PI / 2;
      else if (this.direction === "left") rotation = Math.PI;
      else if (this.direction === "up") rotation = -Math.PI / 2;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(rotation);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, startAngle, endAngle);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    loseLife() {
      if (!this.active) return false;
      lives--;
      updateLivesDisplay();
      if (lives <= 0) {
        this.active = false;
        return true;
      } else {
        resetCharacterPositions();
        return false;
      }
    }
  }
  class Ghost extends Character {
    /* ... (Keep implementation) ... */ constructor(
      startRow,
      startCol,
      color,
      name
    ) {
      super(startRow, startCol, color, GHOST_SPEED);
      this.name = name;
      this.state = "scatter";
      this.frightenedTimer = 0;
      this.flashState = false;
      this.targetTile = { row: startRow, col: startCol };
      this.homeCorner = this.getHomeCorner(name);
      this.currentSpeed = GHOST_SPEED;
      this.respawnTimerId = null;
      this.isExitingHouse = currentMap[startRow][startCol] === 4;
    }
    getHomeCorner(ghostName) {
      switch (ghostName) {
        case "blinky":
          return { row: 0, col: MAP_COLS - 1 };
        case "pinky":
          return { row: 0, col: 0 };
        case "inky":
          return { row: MAP_ROWS - 1, col: MAP_COLS - 1 };
        case "clyde":
          return { row: MAP_ROWS - 1, col: 0 };
        default:
          return { row: 0, col: 0 };
      }
    }
    draw(ctx) {
      if (!this.active && this.state !== "eaten") return;
      const x = Math.round(this.x);
      const y = Math.round(this.y);
      const r = this.radius * 1.1;
      const feet = 3;
      const feetHeight = r * 0.3;
      let bodyColor = this.color;
      let eyeColor = "white";
      let pupilColor = "#000";
      if (this.state === "frightened") {
        this.flashState =
          this.frightenedTimer < GHOST_FLASH_START_TIME &&
          Math.floor(this.frightenedTimer / 250) % 2 === 0;
        bodyColor = this.flashState
          ? GHOST_FRIGHTENED_EYES_COLOR
          : GHOST_FRIGHTENED_BODY_COLOR;
        eyeColor = this.flashState
          ? GHOST_FRIGHTENED_BODY_COLOR
          : GHOST_FRIGHTENED_EYES_COLOR;
        pupilColor = bodyColor;
      } else if (this.state === "eaten") {
        bodyColor = "transparent";
        pupilColor = GHOST_FRIGHTENED_BODY_COLOR;
        eyeColor = GHOST_FRIGHTENED_EYES_COLOR;
      }
      if (this.state !== "eaten") {
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(x, y, r, Math.PI, 0);
        for (let i = 0; i < feet; i++) {
          ctx.arc(
            x - r + ((r * 2) / feet) * (i + 0.5),
            y + r - feetHeight,
            r / feet,
            0,
            Math.PI
          );
        }
        ctx.lineTo(x + r, y);
        ctx.closePath();
        ctx.fill();
      }
      const eyeRadius = r * 0.25;
      const pupilRadius = eyeRadius * 0.6;
      let eyeOffsetX = 0;
      let eyeOffsetY = 0;
      const eyeBaseX = r * 0.35;
      const eyeBaseY = -r * 0.1;
      if (this.direction === "left") eyeOffsetX = -eyeRadius * 0.4;
      else if (this.direction === "right") eyeOffsetX = eyeRadius * 0.4;
      else if (this.direction === "up") eyeOffsetY = -eyeRadius * 0.4;
      else if (this.direction === "down") eyeOffsetY = eyeRadius * 0.4;
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(x - eyeBaseX, y + eyeBaseY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(
        x - eyeBaseX + eyeOffsetX,
        y + eyeBaseY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(x + eyeBaseX, y + eyeBaseY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pupilColor;
      ctx.beginPath();
      ctx.arc(
        x + eyeBaseX + eyeOffsetX,
        y + eyeBaseY + eyeOffsetY,
        pupilRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    update(deltaTime) {
        if (!this.active && this.state !== 'eaten' && this.state !== 'returning_home_spot') return;

        // 状态逻辑更新
        if (this.state === 'frightened') {
            this.frightenedTimer -= deltaTime;
            if (this.frightenedTimer <= 0) {
                this.setState('chase'); // 恢复追逐
            }
        } else if (this.state === 'eaten') {
            this.targetTile = findGhostHomeEntry(); // 持续设定目标为鬼屋入口
            const entryGridPos = getPixelPos(this.targetTile.row, this.targetTile.col);
            const entryCenterX = entryGridPos.x + TILE_SIZE / 2;
            const entryCenterY = entryGridPos.y + TILE_SIZE / 2;
            // 如果到达鬼屋入口外
            if (this.row === this.targetTile.row && this.col === this.targetTile.col &&
                distance(this.x, this.y, entryCenterX, entryCenterY) < TILE_SIZE * 0.4) {
                this.x = entryCenterX; this.y = entryCenterY; // 对齐
                const homeTile = ghostSpawnPoints.find(p => p.row === this.startRow && p.col === this.startCol) || ghostSpawnPoints[0];
                this.targetTile = homeTile; // 新目标：出生点
                this.setState('returning_home_spot');
                console.log(`${this.name} reached ghost house entry, now targeting home spot: (${homeTile.row}, ${homeTile.col})`);
            }
        } else if (this.state === 'returning_home_spot') {
            // targetTile 已经是出生点了
            const homeGridPos = getPixelPos(this.targetTile.row, this.targetTile.col);
            const homeCenterX = homeGridPos.x + TILE_SIZE / 2;
            const homeCenterY = homeGridPos.y + TILE_SIZE / 2;
            // 如果到达出生点
            if (this.row === this.targetTile.row && this.col === this.targetTile.col &&
                distance(this.x, this.y, homeCenterX, homeCenterY) < TILE_SIZE * 0.4) {
                this.resetPosition(); // 完全重置，包括位置和激活状态
                this.isExitingHouse = true; // 设置为离开状态
                this.setState('scatter');   // 初始状态为分散，isExitingHouse 会让它先离开鬼屋
                console.log(`${this.name} is at home spot, now exiting.`);
            }
        } else if (this.isExitingHouse) {
            this.targetTile = findGhostHomeEntry(); // 目标是鬼屋入口外
            const exitGridPos = getPixelPos(this.targetTile.row, this.targetTile.col);
            const exitCenterX = exitGridPos.x + TILE_SIZE / 2;
            const exitCenterY = exitGridPos.y + TILE_SIZE / 2;
            // 如果到达鬼屋入口外
            if (this.row === this.targetTile.row && this.col === this.targetTile.col &&
                distance(this.x, this.y, exitCenterX, exitCenterY) < TILE_SIZE * 0.4) {
                this.x = exitCenterX; this.y = exitCenterY; // 对齐
                this.isExitingHouse = false;
                this.setState(Math.random() < 0.7 ? 'chase' : 'scatter'); // 离开后进入追逐或分散
                console.log(`${this.name} has exited house.`);
            }
        } else { // 'chase' or 'scatter' (and not exiting)
            this.setTargetTile();
        }

        // 决策转向
        const currentGridX = this.col * TILE_SIZE + TILE_SIZE / 2;
        const currentGridY = this.row * TILE_SIZE + TILE_SIZE / 2;
        const decisionTolerance = Math.max(1, this.currentSpeed * TILE_SIZE / 1000 * (1000/60) * 0.8); // 每帧移动距离的0.8倍

        if (Math.abs(this.x - currentGridX) < decisionTolerance && Math.abs(this.y - currentGridY) < decisionTolerance) {
            this.x = currentGridX; // 精确对齐以便正确获取 getPossibleMoves
            this.y = currentGridY;
            const possibleMoves = this.getPossibleMoves();

            if (possibleMoves.length > 0) {
                let bestMove = possibleMoves[0];
                if (this.state === 'frightened') {
                    bestMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                } else if (this.state === 'eaten' || this.state === 'returning_home_spot' || this.isExitingHouse) {
                    // 当返回或离开鬼屋时，更直接地朝目标移动
                    let minDistance = Infinity;
                    possibleMoves.forEach(move => {
                        let nR = this.row; let nC = this.col;
                        if (move === 'up') nR--; else if (move === 'down') nR++;
                        else if (move === 'left') nC--; else if (move === 'right') nC++;
                        const d = distance(nC, nR, this.targetTile.col, this.targetTile.row);
                        if (d < minDistance) { minDistance = d; bestMove = move; }
                    });
                } else { // Chase and Scatter
                    let minDistance = Infinity;
                    possibleMoves.forEach(move => {
                        let nR = this.row; let nC = this.col;
                        if (move === 'up') nR--; else if (move === 'down') nR++;
                        else if (move === 'left') nC--; else if (move === 'right') nC++;
                        const d = distance(nC, nR, this.targetTile.col, this.targetTile.row);
                        if (d < minDistance) { minDistance = d; bestMove = move; }
                    });
                }
                this.nextDirection = bestMove;
            } else {
                 console.warn(`${this.name} stuck at (${this.row},${this.col}). State: ${this.state}, Exiting: ${this.isExitingHouse}, Target: (${this.targetTile.row},${this.targetTile.col}), Dir: ${this.direction}`);
                 // 尝试反向作为最后手段
                 const opposite = this.getOppositeDirection(this.direction);
                 if (opposite) {
                    let nR = this.row; let nC = this.col;
                    if (opposite === 'up') nR--; else if (opposite === 'down') nR++;
                    else if (opposite === 'left') nC--; else if (opposite === 'right') nC++;
                    if(!isWall(nR,nC,'ghost')) this.nextDirection = opposite;
                 }
            }
        }
        super.update(deltaTime); // 调用 Character.move()
    }
    // In class Ghost:
    // In class Ghost:
    getPossibleMoves() {
        const possibleMoves = [];
        const r = this.row;
        const c = this.col;
        const oppositeDir = this.getOppositeDirection(this.direction);

        const directions = [
            { name: 'up', dr: -1, dc: 0 },
            { name: 'left', dr: 0, dc: -1 }, // 经典吃豆人幽灵在交叉路口优先顺序：上、左、下、右
            { name: 'down', dr: 1, dc: 0 },
            { name: 'right', dr: 0, dc: 1 }
        ];

        for (const move of directions) {
            if (move.name === oppositeDir) continue; // 通常不允许直接回头

            const nextR = r + move.dr;
            const nextC = c + move.dc;

            // 隧道逻辑
            if (move.name === 'left' && c === 0 && currentMap[r][MAP_COLS - 1] !== 1) {
                possibleMoves.push(move.name);
                continue;
            }
            if (move.name === 'right' && c === MAP_COLS - 1 && currentMap[r][0] !== 1) {
                possibleMoves.push(move.name);
                continue;
            }

            // 检查是否越界或撞墙（对幽灵而言）
            if (isWall(nextR, nextC, 'ghost')) {
                continue;
            }

            // 特殊规则：阻止非受惊/非返回状态的幽灵从鬼屋“门”外向上进入鬼屋内部的“家”
            // 鬼屋入口外的图块（目标点）
            const ghostHomeGate = findGhostHomeEntry(); // e.g., (10, 13)
            if (this.state !== 'eaten' && this.state !== 'returning_home_spot' && !this.isExitingHouse) {
                if (r === ghostHomeGate.row && (c >= ghostHomeGate.col -1 && c <= ghostHomeGate.col + 1) ) { // 如果在鬼屋门前
                    if (move.name === 'up' && currentMap[nextR] && currentMap[nextR][nextC] === 4) { // 尝试向上进入鬼屋的家(4)
                        // console.log(`${this.name} at gate ${r},${c} prevented UP into house tile ${nextR},${nextC}`);
                        continue; // 不允许
                    }
                }
            }
            possibleMoves.push(move.name);
        }

        if (possibleMoves.length > 0) {
            return possibleMoves;
        } else if (oppositeDir && !isWall(r + (directions.find(d=>d.name===oppositeDir).dr), c + (directions.find(d=>d.name===oppositeDir).dc), 'ghost')) {
            // 如果没有其他有效移动，允许回头
            return [oppositeDir];
        }
        return []; // 真卡住了
    }
setState(newState) {
    if (this.state === 'eaten' && this.respawnTimerId) { clearTimeout(this.respawnTimerId); this.respawnTimerId = null; }
    this.state = newState;
    if (newState === 'frightened') {
        this.frightenedTimer = POWER_PELLET_DURATION;
        this.currentSpeed = GHOST_FRIGHTENED_SPEED;
        const possible = this.getPossibleMoves();
        if (possible.length > 0) {
            this.nextDirection = possible[Math.floor(Math.random() * possible.length)];
        } else { // 如果卡住，尝试反向
            this.nextDirection = this.getOppositeDirection(this.direction) || this.direction;
        }
    } else if (newState === 'eaten') {
        this.currentSpeed = GHOST_SPEED * 2; // 加速返回
        this.targetTile = findGhostHomeEntry(); // 先到鬼屋入口外
        this.active = false; // 视觉上只有眼睛
        this.isExitingHouse = false; // 清除离开状态
    } else if (newState === 'returning_home_spot') {
        this.currentSpeed = GHOST_SPEED * 2; // 保持快速
        // targetTile 应该在 'eaten' 逻辑中到达鬼屋入口后被设置为 homeTile
        this.active = false;
        this.isExitingHouse = false;
    } else { // 'scatter', 'chase'
        this.currentSpeed = this.baseSpeed;
        // isExitingHouse 会在 resetPosition 或到达 home spot 后设置
    }
}
setTargetTile() {
    if (this.isExitingHouse || this.state === 'eaten' || this.state === 'returning_home_spot') {
        // 这些状态的目标在 update() 中单独处理
        return;
    }

    if (this.state === 'scatter') {
        this.targetTile = this.homeCorner;
    } else if (this.state === 'chase') {
        if (pacman && pacman.active) {
            if (this.name === 'blinky') this.targetTile = { row: pacman.row, col: pacman.col };
            else if (this.name === 'pinky') {
                let pRow = pacman.row, pCol = pacman.col;
                if (pacman.direction === 'up') pRow = Math.max(0, pRow - 4); // 考虑边界
                else if (pacman.direction === 'down') pRow = Math.min(MAP_ROWS - 1, pRow + 4);
                else if (pacman.direction === 'left') pCol = Math.max(0, pCol - 4);
                else if (pacman.direction === 'right') pCol = Math.min(MAP_COLS - 1, pCol + 4);
                this.targetTile = {row: pRow, col: pCol};
            }
            else if (this.name === 'inky') { // Inky 的目标比较复杂，需要 Blinky 的位置
                let blinkyPos = { row: 0, col: 0 };
                const blinkyGhost = ghosts.find(g => g.name === 'blinky');
                if (blinkyGhost) { blinkyPos = { row: blinkyGhost.row, col: blinkyGhost.col }; }

                let twoTilesAheadRow = pacman.row;
                let twoTilesAheadCol = pacman.col;
                if (pacman.direction === 'up') twoTilesAheadRow -= 2;
                else if (pacman.direction === 'down') twoTilesAheadRow += 2;
                else if (pacman.direction === 'left') twoTilesAheadCol -= 2;
                else if (pacman.direction === 'right') twoTilesAheadCol += 2;

                // 向量翻倍
                const targetRow = twoTilesAheadRow + (twoTilesAheadRow - blinkyPos.row);
                const targetCol = twoTilesAheadCol + (twoTilesAheadCol - blinkyPos.col);
                this.targetTile = { row: Math.max(0, Math.min(MAP_ROWS - 1, targetRow)), col: Math.max(0, Math.min(MAP_COLS - 1, targetCol)) };
            }
            else if (this.name === 'clyde') {
                if(distance(this.x, this.y, pacman.x, pacman.y) / TILE_SIZE > 8) {
                    this.targetTile = { row: pacman.row, col: pacman.col };
                } else {
                    this.targetTile = this.homeCorner;
                }
            }
        }
    }
}
resetPosition() {
    const startPos = getPixelPos(this.startRow, this.startCol);
    this.x = startPos.x + TILE_SIZE / 2;
    this.y = startPos.y + TILE_SIZE / 2;
    this.row = this.startRow;
    this.col = this.startCol;
    // setState will be called after it reaches home spot and needs to exit
    this.active = true; // It becomes active when it's ready to exit or scatter/chase
    if (this.respawnTimerId) { clearTimeout(this.respawnTimerId); this.respawnTimerId = null; }
    this.isExitingHouse = (currentMap[this.startRow][this.startCol] === 4); // True if starting in house
    this.direction = 'up'; // Ghosts inside house try to move up first
    this.nextDirection = 'up';
    this.state = 'scatter'; // Default state after full reset, isExitingHouse will guide it
}
  }
  function findGhostHomeEntry() {
    // 鬼屋的门通常在鬼屋区域（地图值4）的上方中间位置。
    // 在这个28x23的地图中，鬼屋在 row 11, col 11-17 附近。
    // 门应该在 row 10。
    // 假设鬼屋中心点附近的 (10, 13) 或 (10, 14) 是出口点。
    // 地图的 currentMap[10][13] 和 currentMap[10][14] 都是 4 (特殊墙，鬼可过)
    // 我们需要一个幽灵可以实际到达并“离开”到的图块。
    // 让我们选择 (10, 13) 作为目标，这里是 '4'，幽灵可以穿过。
    return { row: 10, col: Math.floor(MAP_COLS / 2) - 1 }; // (10, 13) for 28 col map
}

  // --- Game Setup & Initialization ---
  function initGame(level = 1) {
    console.log("Initializing game...");
    if (gameLoopId !== null) cancelAnimationFrame(gameLoopId);
    clearAllRespawnTimers();

    calculateSizes(); // Calculate sizes first

    // Reset game state vars
    currentLevel = level;
    score = level === 1 ? 0 : score;
    lives = level === 1 ? PLAYER_INITIAL_LIVES : lives;
    isPaused = false;
    isGameOver = false;
    lastFrameTime = performance.now();
    frightenedMode = false;
    frightenedTimer = 0;
    dots = [];
    powerPellets = [];
    ghosts = [];
    pacman = null;
    totalDots = 0;
    ghostSpawnPoints = [];

    // Populate entities based on map
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const t = currentMap[r][c];
        const p = getPixelPos(r, c);
        const centerX = p.x + TILE_SIZE / 2;
        const centerY = p.y + TILE_SIZE / 2;
        if (t === 2) {
          dots.push({ x: centerX, y: centerY, active: true });
          totalDots++;
        } else if (t === 3) {
          powerPellets.push({
            x: centerX,
            y: centerY,
            active: true,
            radius: POWER_PELLET_RADIUS,
          });
          totalDots++;
        } else if (t === 5) {
          pacman = new Pacman(r, c);
        } else if (t === 4) {
          ghostSpawnPoints.push({ row: r, col: c });
        }
      }
    }
    if (!pacman) {
      console.error("Map missing player start (5)");
      isGameOver = true;
      return;
    }
    if (ghostSpawnPoints.length === 0) {
      console.warn("Map missing ghost spawns (4)");
      ghostSpawnPoints.push({ row: 11, col: 13 });
    }

    const gN = Object.keys(GHOST_COLORS);
    ghosts = gN
      .slice(0, Math.min(gN.length, ghostSpawnPoints.length))
      .map((n, i) => {
        const sP = ghostSpawnPoints[i % ghostSpawnPoints.length];
        return new Ghost(sP.row, sP.col, GHOST_COLORS[n], n);
      });

    currentDirection = pacman.direction;
    nextDirection = pacman.nextDirection;

    // Update UI
    loadHighScore(); // Load high score
    updateScoreDisplay();
    updateLivesDisplay();
    gameMessageScreen.style.display = "none";
    gamePauseScreen.style.display = "none";
    levelCompleteScreen.style.display = "none";
    const preview = document.querySelector(".preview-container");
    if (preview) preview.style.display = "none"; // Hide previews after start
    pauseActionButton.textContent = "PAUSE"; // Reset pause button text

    // Start loop
    gameLoopId = requestAnimationFrame(animationLoop);
    console.log("Game initialized.");
  }
  // --- Other Functions (Keep resetCharacterPositions, clearAllRespawnTimers, animationLoop, gameLogic, drawMaze, drawDots, drawPowerPellets, eatDots, eatPowerPellets, checkCollisions, startFrightenedMode, endFrightenedMode, levelComplete, gameOver, togglePause, UI updates, save/loadHighScore) ---
  function resetCharacterPositions() {
    if (!pacman) return;
    pacman.resetPosition();
    currentDirection = pacman.direction;
    nextDirection = pacman.nextDirection;
    clearAllRespawnTimers();
    ghosts.forEach((g) => g.resetPosition());
    frightenedMode = false;
    frightenedTimer = 0;
  }
  function clearAllRespawnTimers() {
    ghosts.forEach((g) => {
      if (g.respawnTimerId) {
        clearTimeout(g.respawnTimerId);
        g.respawnTimerId = null;
      }
    });
  }
  function animationLoop(timestamp) {
    if (isGameOver) {
      gameLoopId = null;
      return;
    }
    if (isPaused) {
      lastFrameTime = timestamp;
      gameLoopId = requestAnimationFrame(animationLoop);
      return;
    }
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    if (deltaTime < 1) {
      gameLoopId = requestAnimationFrame(animationLoop);
      return;
    }
    lastFrameTime = timestamp;
    const cappedDeltaTime = Math.min(deltaTime, 50);
    try {
      gameLogic(cappedDeltaTime);
    } catch (error) {
      console.error("Game loop error:", error);
      gameOver(false, true);
      return;
    }
    gameLoopId = requestAnimationFrame(animationLoop);
  }
  function gameLogic(deltaTime) {
    context.fillStyle = SCREEN_BG_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    drawDots();
    drawPowerPellets();
    if (pacman.active) {
      pacman.nextDirection = nextDirection || pacman.direction;
      pacman.update(deltaTime);
      pacman.draw(context);
    }
    ghosts.forEach((ghost) => {
      ghost.update(deltaTime);
      ghost.draw(context);
    });
    eatDots();
    eatPowerPellets();
    checkCollisions();
    if (totalDots === 0 && !isGameOver) {
      levelComplete();
      return;
    }
    if (frightenedMode) {
      frightenedTimer -= deltaTime;
      if (frightenedTimer <= 0) {
        endFrightenedMode();
      }
    }
  }
  function drawMaze() {
    context.strokeStyle = WALL_COLOR;
    context.lineWidth = Math.max(1, Math.floor(TILE_SIZE / 15));
    const offset = context.lineWidth / 2;
    context.beginPath();
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (currentMap[r][c] === 1) {
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;
          const ts = TILE_SIZE;
          if (r === 0 || currentMap[r - 1][c] !== 1) {
            context.moveTo(x - offset, y + offset);
            context.lineTo(x + ts + offset, y + offset);
          }
          if (r === MAP_ROWS - 1 || currentMap[r + 1][c] !== 1) {
            context.moveTo(x - offset, y + ts - offset);
            context.lineTo(x + ts + offset, y + ts - offset);
          }
          if (c === 0 || currentMap[r][c - 1] !== 1) {
            context.moveTo(x + offset, y - offset);
            context.lineTo(x + offset, y + ts + offset);
          }
          if (c === MAP_COLS - 1 || currentMap[r][c + 1] !== 1) {
            context.moveTo(x + ts - offset, y - offset);
            context.lineTo(x + ts - offset, y + ts + offset);
          }
        }
      }
    }
    context.stroke();
    context.fillStyle = SCREEN_BG_COLOR;
    for (let r = 0; r < MAP_ROWS; r++) {
      if (currentMap[r][0] === 0) {
        context.fillRect(-TILE_SIZE, r * TILE_SIZE, TILE_SIZE * 1.5, TILE_SIZE);
      }
      if (currentMap[r][MAP_COLS - 1] === 0) {
        context.fillRect(
          canvas.width - TILE_SIZE * 0.5,
          r * TILE_SIZE,
          TILE_SIZE * 1.5,
          TILE_SIZE
        );
      }
    }
  }
  function drawDots() {
    context.fillStyle = DOT_COLOR;
    dots.forEach((d) => {
      if (d.active) {
        context.beginPath();
        context.arc(d.x, d.y, PELLET_RADIUS, 0, Math.PI * 2);
        context.fill();
      }
    });
  }
  function drawPowerPellets() {
    const blink = Math.floor(performance.now() / 180) % 2 === 0;
    if (!blink && !frightenedMode) return;
    context.fillStyle = POWER_PELLET_COLOR;
    powerPellets.forEach((p) => {
      if (p.active) {
        context.beginPath();
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        context.fill();
      }
    });
  }
  function eatDots() {
    if (!pacman.active) return;
    dots.forEach((d) => {
      if (
        d.active &&
        distance(pacman.x, pacman.y, d.x, d.y) < TILE_SIZE / 2.5
      ) {
        d.active = false;
        score += 10;
        totalDots--;
        updateScoreDisplay();
      }
    });
  }
  function eatPowerPellets() {
    if (!pacman.active) return;
    powerPellets.forEach((p) => {
      if (
        p.active &&
        distance(pacman.x, pacman.y, p.x, p.y) < TILE_SIZE / 1.8
      ) {
        p.active = false;
        score += 50;
        totalDots--;
        updateScoreDisplay();
        startFrightenedMode();
      }
    });
  }
  function checkCollisions() {
    if (!pacman.active) return;
    ghosts.forEach((ghost) => {
      if (
        ghost.active &&
        distance(pacman.x, pacman.y, ghost.x, ghost.y) < TILE_SIZE * 0.7
      ) {
        if (ghost.state === "frightened") {
          score += 200;
          updateScoreDisplay();
          ghost.setState("eaten");
          if (ghost.respawnTimerId) clearTimeout(ghost.respawnTimerId);
          ghost.respawnTimerId = setTimeout(() => {
            if (!isGameOver && ghosts.includes(ghost)) {
              ghost.targetTile = findGhostHomeEntry();
            }
          }, GHOST_RESPAWN_TIME);
        } else if (ghost.state !== "eaten") {
          if (pacman.loseLife()) {
            gameOver(false);
            return;
          }
        }
      }
    });
  }
  function startFrightenedMode() {
    frightenedMode = true;
    frightenedTimer = POWER_PELLET_DURATION;
    ghosts.forEach((g) => {
      if (g.state !== "eaten") g.setState("frightened");
    });
  }
  function endFrightenedMode() {
    frightenedMode = false;
    ghosts.forEach((g) => {
      if (g.state === "frightened") g.setState("chase");
    });
  }
  function levelComplete() {
    if (isGameOver) return;
    isPaused = true;
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
    messageText.textContent = "LEVEL CLEAR!";
    startButton.textContent = "NEXT LEVEL (Restart)";
    gameMessageScreen.style.display = "flex";
    const preview = document.querySelector(".preview-container");
    if (preview) preview.style.display = "flex";
  }
  function gameOver(isWin, isError = false) {
    if (isGameOver) return;
    isGameOver = true;
    if (pacman) pacman.active = false;
    if (gameLoopId !== null) {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
    }
    clearAllRespawnTimers();
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    updateScoreDisplay();
    updateLivesDisplay();
    messageText.textContent = isError
      ? `Error!`
      : isWin
      ? "YOU WIN!"
      : "GAME OVER!";
    startButton.textContent = "RESTART";
    gameMessageScreen.style.display = "flex";
    const preview = document.querySelector(".preview-container");
    if (preview) preview.style.display = "flex";
  }
  function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
      gamePauseScreen.style.display = "flex";
      pauseActionButton.textContent = "RESUME";
    } else {
      gamePauseScreen.style.display = "none";
      pauseActionButton.textContent = "PAUSE";
      lastFrameTime = performance.now();
      if (gameLoopId === null && !isGameOver) {
        gameLoopId = requestAnimationFrame(animationLoop);
      }
    }
  }
  function updateScoreDisplay() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
  }
  function updateLivesDisplay() {
    livesContainer.innerHTML = "";
    const currentLives = lives > 0 ? lives : 0;
    for (let i = 0; i < currentLives; i++) {
      const lifeIcon = document.createElement("div");
      lifeIcon.classList.add("life-icon-pacman");
      livesContainer.appendChild(lifeIcon);
    }
  }
  function saveHighScore() {
    try {
      localStorage.setItem("pixelPacmanDXHighScore_v3", highScore);
    } catch (e) {
      console.warn("Cannot save high score");
    }
  }
  function loadHighScore() {
    try {
      const savedScore = localStorage.getItem("pixelPacmanDXHighScore_v3");
      highScore = savedScore ? parseInt(savedScore, 10) : 0;
    } catch (e) {
      highScore = 0;
      console.warn("Cannot load high score");
    }
  }

  // --- Event Listeners ---
  // Keyboard (Keep as is)
  document.addEventListener("keydown", (e) => {
    if (isGameOver && (e.key === "Enter" || e.key === " ")) {
      initGame(1);
      e.preventDefault();
      return;
    }
    if (e.key.toLowerCase() === "p" || e.key === "Escape") {
      togglePause();
      return;
    }
    if (!isPaused && !isGameOver && pacman?.active) {
      let intendedDirection = "";
      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w")
        intendedDirection = "up";
      else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s")
        intendedDirection = "down";
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a")
        intendedDirection = "left";
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d")
        intendedDirection = "right";
      if (intendedDirection) {
        nextDirection = intendedDirection;
        e.preventDefault();
      }
    }
  });

  // Button/Touch Handlers
  function handleButtonPress(direction) {
    if (!isPaused && !isGameOver && pacman?.active) {
      nextDirection = direction;
    }
  }
  function setupButtonTouch(buttonElement, direction) {
    buttonElement.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        handleButtonPress(direction);
        buttonElement.classList.add("active-touch");
      },
      { passive: false }
    );
    // Optional: Remove active class on touchend/touchcancel if desired
    buttonElement.addEventListener("touchend", (e) => {
      e.preventDefault();
      buttonElement.classList.remove("active-touch");
    });
    buttonElement.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      buttonElement.classList.remove("active-touch");
    });
    // Keep mousedown for desktop clicking
    buttonElement.addEventListener("mousedown", () =>
      handleButtonPress(direction)
    );
  }
  setupButtonTouch(upButton, "up");
  setupButtonTouch(downButton, "down");
  setupButtonTouch(leftButton, "left");
  setupButtonTouch(rightButton, "right");

  pauseActionButton.addEventListener("click", togglePause);
  pauseActionButton.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      togglePause();
      pauseActionButton.classList.add("active-touch");
      setTimeout(() => pauseActionButton.classList.remove("active-touch"), 150);
    },
    { passive: false }
  );
  startButton.addEventListener("click", () => initGame(1));
  startButton.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      initGame(1);
    },
    { passive: false }
  );
  restartButtonPanel.addEventListener("click", () => initGame(1));
  restartButtonPanel.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      initGame(1);
    },
    { passive: false }
  );

  // Prevent canvas default touch actions
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  // --- Resize Handler ---
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      console.log("Window resized or orientation changed");
      calculateSizes(); // Recalculate sizes and resize canvas

      // Redraw static elements if game not actively running
      if (isGameOver || isPaused) {
        context.fillStyle = SCREEN_BG_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (pacman && ghosts.length > 0) {
          // Check if game elements exist
          drawMaze();
          drawDots();
          drawPowerPellets();
          pacman.draw(context);
          ghosts.forEach((g) => g.draw(context));
        } else {
          initializeUI(false); // Fallback to drawing initial UI if game objects don't exist
        }
      }
      // If game running, the next gameLoop frame will handle redraw with new sizes
    }, 100); // Debounce
  }
  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  // --- Initial UI Setup ---
  function initializeUI(isFirstLoad = true) {
    console.log("Initializing UI...");
    calculateSizes(); // Calculate sizes based on current layout

    if (isFirstLoad) {
      loadHighScore();
      score = 0;
      lives = PLAYER_INITIAL_LIVES;
      currentLevel = 1;
      isGameOver = true;
      isPaused = false;
      pacman = new Pacman(17, 13); // Create a temporary Pacman for display
      ghosts = []; // Clear ghosts for initial display
    }

    updateScoreDisplay();
    updateLivesDisplay();
    messageText.textContent = "GET READY!";
    startButton.textContent = "START GAME";
    pauseActionButton.textContent = "PAUSE"; // Reset pause button
    const preview = document.querySelector(".preview-container");
    if (preview) preview.style.display = "flex"; // Show previews initially
    gameMessageScreen.style.display = "flex";
    gamePauseScreen.style.display = "none";
    levelCompleteScreen.style.display = "none";

    // Draw initial preview
    context.fillStyle = SCREEN_BG_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (canvas.width > 0 && canvas.height > 0) {
      // Only draw if canvas has size
      drawMaze();
      // Draw a few dots/pellets for visual context (optional)
      dots.slice(0, 10).forEach((d) => {
        context.fillStyle = DOT_COLOR;
        context.beginPath();
        context.arc(d.x, d.y, PELLET_RADIUS, 0, Math.PI * 2);
        context.fill();
      });
      powerPellets.slice(0, 2).forEach((p) => {
        context.fillStyle = POWER_PELLET_COLOR;
        context.beginPath();
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        context.fill();
      });
      if (pacman) pacman.draw(context); // Draw temp pacman
    }
    console.log("Initial UI drawn.");
  }

  // --- Particles Setup (Keep as before) ---
  if (window.particlesJS) {
    /* ... Keep implementation ... */ particlesJS("particles-js-pacman", {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: {
          value: [
            PACMAN_COLOR,
            GHOST_COLORS.blinky,
            GHOST_COLORS.pinky,
            GHOST_COLORS.inky,
            GHOST_COLORS.clyde,
            DOT_COLOR,
            POWER_PELLET_COLOR,
          ],
        },
        shape: { type: "circle" },
        opacity: {
          value: 0.4,
          random: true,
          anim: { enable: true, speed: 0.5, opacity_min: 0.1 },
        },
        size: {
          value: 4,
          random: true,
          anim: { enable: true, speed: 1.5, size_min: 1.5, sync: false },
        },
        line_linked: { enable: false },
        move: {
          enable: true,
          speed: 0.8,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false,
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: false },
          onclick: { enable: false },
          resize: true,
        },
        modes: {},
      },
      retina_detect: true,
    });
  } else {
    console.warn("particles.js library not loaded.");
  }

  // --- Initialize ---
  initializeUI(true); // Run initial setup
}); // End DOMContentLoaded
