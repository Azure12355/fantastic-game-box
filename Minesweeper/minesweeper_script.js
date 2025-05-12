document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const gridElement = document.getElementById('mineGrid');
    const minesCountElement = document.getElementById('minesCount');
    const timerElement = document.getElementById('timer');
    const difficultySelect = document.getElementById('difficultySelect');
    const newGameButtonPanel = document.getElementById('newGameButtonPanel');
    const newGameButtonOverlay = document.getElementById('newGameButtonOverlay');
    const gameMessageScreen = document.getElementById('gameMessageScreen');
    const messageText = document.getElementById('messageText');
    const gameScreenContainer = document.getElementById('gameScreenContainer'); // Get the scrollable container

    // --- Game Settings & State ---
    let ROWS = 9;
    let COLS = 9;
    let MINES = 10;
    let CELL_SIZE = 24; // Keep track for styling/calculations if needed, matches CSS

    let board = [];
    let mineLocations = [];
    let flagsPlaced = 0;
    let revealedCount = 0;
    let timerInterval = null;
    let startTime = 0;
    let isGameOver = false;
    let firstClick = true;

    // --- Initialization ---
    function initGame(difficulty = 'easy') {
        console.log(`Initializing game with difficulty: ${difficulty}`);
        switch (difficulty) {
            case 'medium': ROWS = 16; COLS = 16; MINES = 40; break;
            case 'hard': ROWS = 16; COLS = 30; MINES = 99; break;
            case 'easy': default: ROWS = 9; COLS = 9; MINES = 10; break;
        }

        isGameOver = false;
        firstClick = true;
        revealedCount = 0;
        flagsPlaced = 0;
        mineLocations = [];
        board = createBoardData(); // Create data structure first

        stopTimer();
        timerElement.textContent = '0';
        minesCountElement.textContent = MINES;
        gameMessageScreen.style.display = 'none';

        createGridDOM(); // Create DOM elements based on ROWS/COLS
        // Mines are placed on first click
        console.log(`Board created: ${ROWS}x${COLS}, ${MINES} mines`);
    }

    // --- Board Data Structure ---
    function createBoardData() {
        const newBoard = [];
        for (let r = 0; r < ROWS; r++) {
            newBoard[r] = [];
            for (let c = 0; c < COLS; c++) {
                newBoard[r][c] = { mine: false, revealed: false, flagged: false, adjacentMines: 0, element: null };
            }
        }
        return newBoard;
    }

    // --- Create Grid DOM ---
    function createGridDOM() {
        gridElement.innerHTML = ''; // Clear previous grid
        // Set grid columns based on current COLS and CELL_SIZE
        gridElement.style.gridTemplateColumns = `repeat(${COLS}, ${CELL_SIZE}px)`;
        // Optional: Set grid rows if needed, though usually height adapts
        // gridElement.style.gridTemplateRows = `repeat(${ROWS}, ${CELL_SIZE}px)`;

        // Set container size (optional, helps layout calculation but CSS handles overflow)
        // gameScreenContainer.style.width = `${COLS * CELL_SIZE + 10}px`; // + padding
        // gameScreenContainer.style.height = `${ROWS * CELL_SIZE + 10}px`; // + padding

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', 'hidden');
                cell.dataset.row = r;
                cell.dataset.col = c;
                board[r][c].element = cell; // Store reference

                // Event listeners
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleCellFlag); // Right-click / Long-press

                gridElement.appendChild(cell);
            }
        }
        console.log("DOM Grid created");
    }

    // --- Mine Placement (Keep as is) ---
    function placeMines(firstClickRow, firstClickCol) { /* ... (Keep implementation) ... */ mineLocations = []; let minesToPlace = MINES; while (minesToPlace > 0) { const r = Math.floor(Math.random() * ROWS); const c = Math.floor(Math.random() * COLS); const isFirstClickZone = Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1; if (!board[r][c].mine && !isFirstClickZone) { board[r][c].mine = true; mineLocations.push({ row: r, col: c }); minesToPlace--; } } calculateAdjacentMines(); console.log(`${MINES} mines placed.`); }

    // --- Calculate Adjacent Mines (Keep as is) ---
    function calculateAdjacentMines() { /* ... (Keep implementation) ... */ for (let r = 0; r < ROWS; r++) { for (let c = 0; c < COLS; c++) { if (board[r][c].mine) continue; let count = 0; for (let dr = -1; dr <= 1; dr++) { for (let dc = -1; dc <= 1; dc++) { if (dr === 0 && dc === 0) continue; const nr = r + dr; const nc = c + dc; if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc]?.mine) { count++; } } } board[r][c].adjacentMines = count; } } }

    // --- Event Handlers (Keep mostly as is) ---
    function handleCellClick(event) {
        if (isGameOver) return;
        const cellElement = event.target.closest('.cell'); // Handle clicks on icons inside cell
        if (!cellElement) return;
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cellData = board[row][col];

        if (cellData.revealed || cellData.flagged) return;

        if (firstClick) {
            console.log("First click detected.");
            placeMines(row, col);
            firstClick = false;
            startTimer();
        }

        if (cellData.mine) {
            console.log("Mine hit!");
            cellData.revealed = true; // Mark revealed to show mine in gameOver
            gameOver(false);
            return;
        }

        revealCell(row, col);
        checkWinCondition();
    }

    function handleCellFlag(event) {
        event.preventDefault();
        if (isGameOver) return;
        const cellElement = event.target.closest('.cell');
        if (!cellElement) return;
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        const cellData = board[row][col];

        if (cellData.revealed) return;

        cellData.flagged = !cellData.flagged;
        if (cellData.flagged) {
            flagsPlaced++;
            cellElement.classList.add('flagged');
            cellElement.innerHTML = '<i class="fas fa-flag"></i>';
        } else {
            flagsPlaced--;
            cellElement.classList.remove('flagged');
            cellElement.innerHTML = '';
        }
        minesCountElement.textContent = Math.max(0, MINES - flagsPlaced); // Prevent negative count display
    }

    // --- Reveal Logic (Keep as is) ---
    function revealCell(row, col) { /* ... (Keep implementation) ... */ if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return; const cellData = board[row][col]; if (cellData.revealed || cellData.flagged || cellData.mine) return; cellData.revealed = true; revealedCount++; cellData.element.classList.remove('hidden'); cellData.element.classList.add('revealed'); cellData.element.innerHTML = ''; if (cellData.adjacentMines > 0) { cellData.element.textContent = cellData.adjacentMines; cellData.element.classList.add(`num-${cellData.adjacentMines}`); } else { for (let dr = -1; dr <= 1; dr++) { for (let dc = -1; dc <= 1; dc++) { revealCell(row + dr, col + dc); } } } }

    // --- Win Condition Check (Keep as is) ---
    function checkWinCondition() { /* ... (Keep implementation) ... */ if (revealedCount === ROWS * COLS - MINES) { console.log("Win condition met."); gameOver(true); } }

    // --- Game Over Handling (Keep as is, ensure Chinese text) ---
    function gameOver(isWin) { /* ... (Keep implementation, ensure text uses Chinese) ... */ console.log(`Game Over. Win: ${isWin}`); isGameOver = true; stopTimer(); mineLocations.forEach(loc => { const cell = board[loc.row][loc.col]; if (!cell) return; const element = cell.element; if(!element) return; if (!cell.revealed && !cell.flagged) { element.classList.remove('hidden'); element.classList.add('revealed', 'mine'); element.innerHTML = '<i class="fas fa-bomb"></i>'; } else if (cell.flagged && !cell.mine && !isWin) { element.classList.add('incorrect-flag'); element.innerHTML = '<i class="fas fa-times"></i>'; } else if (cell.revealed && cell.mine) { element.classList.add('mine'); element.style.backgroundColor = '#ff0000'; element.innerHTML = '<i class="fas fa-bomb"></i>'; } }); messageText.textContent = isWin ? "WIN！" : "LOSE"; gameMessageScreen.style.display = 'flex'; }

    // --- Timer Logic (Keep as is) ---
    function startTimer() { /* ... (Keep implementation) ... */ if (timerInterval) return; startTime = Date.now(); timerInterval = setInterval(updateTimerDisplay, 1000); console.log("Timer started."); }
    function stopTimer() { /* ... (Keep implementation) ... */ clearInterval(timerInterval); timerInterval = null; console.log("Timer stopped."); }
    function updateTimerDisplay() { /* ... (Keep implementation) ... */ const elapsedTime = Math.floor((Date.now() - startTime) / 1000); timerElement.textContent = elapsedTime; }

    // --- Event Listeners Binding ---
    difficultySelect.addEventListener('change', (e) => initGame(e.target.value));
    newGameButtonPanel.addEventListener('click', () => initGame(difficultySelect.value));
    newGameButtonOverlay.addEventListener('click', () => initGame(difficultySelect.value));

    // --- Prevent Context Menu on Grid Container (Optional but helpful on desktop) ---
     gameScreenContainer.addEventListener('contextmenu', e => e.preventDefault());


    // --- Initial Game Setup ---
    initGame(difficultySelect.value);

}); // End DOMContentLoaded