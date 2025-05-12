document.addEventListener('DOMContentLoaded', () => {
    // --- 获取 DOM 元素 ---
    const gridElement = document.getElementById('mineGrid');
    const minesCountElement = document.getElementById('minesCount');
    const timerElement = document.getElementById('timer');
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameButtonPanel = document.getElementById('newGameButtonPanel');
    const newGameButtonOverlay = document.getElementById('newGameButtonOverlay');
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');

    // --- 游戏设置与状态 ---
    let ROWS = 9;
    let COLS = 9;
    let MINES = 10;

    let board = []; // { mine: bool, revealed: bool, flagged: bool, adjacentMines: int }
    let mineLocations = []; // Array of {row, col} for mines
    let flagsPlaced = 0;
    let revealedCount = 0;
    let timerInterval = null;
    let startTime = 0;
    let isGameOver = false;
    let firstClick = true;

    // --- 初始化游戏 ---
    function initGame(difficulty = 'easy') {
        // 设置难度
        switch (difficulty) {
            case 'medium': ROWS = 16; COLS = 16; MINES = 40; break;
            case 'hard': ROWS = 16; COLS = 30; MINES = 99; break;
            case 'easy': // Fallthrough intentional
            default: ROWS = 9; COLS = 9; MINES = 10; break;
        }

        // 重置状态
        isGameOver = false;
        firstClick = true;
        revealedCount = 0;
        flagsPlaced = 0;
        mineLocations = [];
        board = createBoardData();

        // 重置计时器
        stopTimer();
        timerElement.textContent = '0';

        // 更新UI显示
        minesCountElement.textContent = MINES;
        gameMessageScreen.style.display = 'none'; // 隐藏消息

        // 创建网格DOM
        createGridDOM();
        // 注意: 雷区在第一次点击后生成 (placeMines)
    }

    // --- 创建游戏数据结构 ---
    function createBoardData() {
        const newBoard = [];
        for (let r = 0; r < ROWS; r++) {
            newBoard[r] = [];
            for (let c = 0; c < COLS; c++) {
                newBoard[r][c] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    adjacentMines: 0,
                    element: null // 将DOM元素引用存起来
                };
            }
        }
        return newBoard;
    }

    // --- 创建网格 DOM ---
    function createGridDOM() {
        gridElement.innerHTML = ''; // 清空旧网格
        gridElement.style.gridTemplateColumns = `repeat(${COLS}, 24px)`; // 设置CSS Grid列数

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', 'hidden');
                cell.dataset.row = r;
                cell.dataset.col = c;

                // 存储DOM引用
                board[r][c].element = cell;

                // 添加事件监听器
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleCellFlag); // 右键插旗

                gridElement.appendChild(cell);
            }
        }
    }

    // --- 放置地雷 ---
    function placeMines(firstClickRow, firstClickCol) {
        mineLocations = [];
        let minesToPlace = MINES;

        while (minesToPlace > 0) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);

            // 确保不在第一次点击处或其周围8格，且该处没有雷
            const isFirstClickZone = Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1;
            if (!board[r][c].mine && !isFirstClickZone) {
                board[r][c].mine = true;
                mineLocations.push({ row: r, col: c });
                minesToPlace--;
            }
        }
        calculateAdjacentMines();
    }

    // --- 计算邻近地雷数 ---
    function calculateAdjacentMines() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc]?.mine) {
                            count++;
                        }
                    }
                }
                board[r][c].adjacentMines = count;
            }
        }
    }

    // --- 处理格子点击 (左键) ---
    function handleCellClick(event) {
        if (isGameOver) return;
        const cellElement = event.target;
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cellData = board[row][col];

        if (cellData.revealed || cellData.flagged) return; // 已揭开或已插旗

        // 首次点击逻辑
        if (firstClick) {
            placeMines(row, col); // 安全地放置地雷
            firstClick = false;
            startTimer();
        }

        // 踩雷
        if (cellData.mine) {
            cellData.revealed = true; // 标记为揭开以显示地雷
            gameOver(false); // 游戏失败
            return;
        }

        // 揭开格子
        revealCell(row, col);

        // 检查胜利条件
        checkWinCondition();
    }

    // --- 处理格子标记 (右键) ---
    function handleCellFlag(event) {
        event.preventDefault(); // 阻止默认右键菜单
        if (isGameOver) return;
        const cellElement = event.target;
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cellData = board[row][col];

        if (cellData.revealed) return; // 不能标记已揭开的格子

        // 切换标记状态
        cellData.flagged = !cellData.flagged;

        if (cellData.flagged) {
            flagsPlaced++;
            cellElement.classList.add('flagged');
            cellElement.innerHTML = '<i class="fas fa-flag"></i>'; // 使用 Font Awesome 图标
        } else {
            flagsPlaced--;
            cellElement.classList.remove('flagged');
            cellElement.innerHTML = '';
        }

        // 更新剩余雷数显示
        minesCountElement.textContent = MINES - flagsPlaced;

        // 可以在这里添加胜利检查，如果 flagsPlaced == MINES 且所有旗帜都正确
        // 但通常胜利是由揭开所有非雷格子决定的
    }


    // --- 揭开格子逻辑 (包含递归) ---
    function revealCell(row, col) {
        // 越界检查
        if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

        const cellData = board[row][col];
        // 如果已揭开、已插旗或踩到雷 (虽然踩雷情况在 handleCellClick 中处理了，这里加一层保险)
        if (cellData.revealed || cellData.flagged || cellData.mine) return;

        cellData.revealed = true;
        revealedCount++;
        cellData.element.classList.remove('hidden');
        cellData.element.classList.add('revealed');
        cellData.element.innerHTML = ''; // 清除可能存在的旗帜

        if (cellData.adjacentMines > 0) {
            // 显示数字
            cellData.element.textContent = cellData.adjacentMines;
            cellData.element.classList.add(`num-${cellData.adjacentMines}`);
        } else {
            // 递归揭开周围的格子 (洪水填充)
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    // if (dr === 0 && dc === 0) continue; // 不需要跳过自己，因为有 revealed 检查
                    revealCell(row + dr, col + dc);
                }
            }
        }
    }

    // --- 检查胜利条件 ---
    function checkWinCondition() {
        // console.log(`Revealed: ${revealedCount}, Target: ${ROWS * COLS - MINES}`);
        if (revealedCount === ROWS * COLS - MINES) {
            gameOver(true); // 游戏胜利
        }
    }

    // --- 游戏结束处理 ---
    function gameOver(isWin) {
        isGameOver = true;
        stopTimer();

        // 显示所有地雷
        mineLocations.forEach(loc => {
            const cell = board[loc.row][loc.col];
            if (!cell.revealed && !cell.flagged) { // 只显示未揭开且未插旗的雷
                cell.element.classList.remove('hidden');
                cell.element.classList.add('revealed', 'mine');
                cell.element.innerHTML = '<i class="fas fa-bomb"></i>';
            } else if (cell.flagged && !cell.mine && !isWin) { // 标记错误 (仅在失败时显示)
                 cell.element.classList.add('incorrect-flag');
                 cell.element.innerHTML = '<i class="fas fa-times"></i>'; // 显示叉号
            } else if (cell.revealed && cell.mine) { // 玩家点中的那个雷
                 cell.element.classList.add('mine');
                 cell.element.style.backgroundColor = '#ff0000'; // 高亮踩中的雷
                 cell.element.innerHTML = '<i class="fas fa-bomb"></i>';
            }
        });

        // 显示消息
        messageText.textContent = isWin ? "Congratulations！You win！" : "Sorry，You lose";
        gameMessageScreen.style.display = 'flex';
    }

    // --- 计时器逻辑 ---
    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(updateTimerDisplay, 1000);
    }
    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    function updateTimerDisplay() {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerElement.textContent = elapsedTime;
    }

    // --- 事件监听器绑定 ---
    difficultySelect.addEventListener('change', (e) => initGame(e.target.value));
    newGameButtonPanel.addEventListener('click', () => initGame(difficultySelect.value));
    newGameButtonOverlay.addEventListener('click', () => initGame(difficultySelect.value));

    // --- 游戏初始化 ---
    initGame(difficultySelect.value); // 使用选择框的当前值初始化

}); // 结束 DOMContentLoaded