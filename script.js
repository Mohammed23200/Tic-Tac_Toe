const screens = document.querySelectorAll(".screen");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("game-status");
const winnerMessageElement = document.getElementById("winner-message");
let currentPlayer, opponentPlayer, boardSize, difficulty, player1Name, player2Name, aiEnabled = false;
let board = [];
let aiSymbol, userSymbol;
let gameEnded = false; // متغير لتتبع حالة اللعبة

// Navigation between screens
function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

// Button handlers
document.getElementById("play-ai").addEventListener("click", () => {
    aiEnabled = true;
    document.getElementById("player2").style.display = "none"; // Hide second player input
    showScreen("player-names");
});

document.getElementById("play-friend").addEventListener("click", () => {
    aiEnabled = false;
    document.getElementById("player2").style.display = "block"; // Show second player input
    showScreen("player-names");
});

document.getElementById("start-game").addEventListener("click", () => {
    player1Name = document.getElementById("player1").value || "Player 1";
    player2Name = aiEnabled ? "AI" : document.getElementById("player2").value || "Player 2";
    showScreen("choose-symbol");
});

document.getElementById("choose-x").addEventListener("click", () => {
    userSymbol = "X";
    aiSymbol = "O";
    currentPlayer = userSymbol;
    opponentPlayer = aiEnabled ? aiSymbol : "O";
    if (aiEnabled) showScreen("difficulty");
    else startGame(3);
});

document.getElementById("choose-o").addEventListener("click", () => {
    userSymbol = "O";
    aiSymbol = "X";
    currentPlayer = userSymbol;
    opponentPlayer = aiEnabled ? aiSymbol : "X";
    if (aiEnabled) showScreen("difficulty");
    else startGame(3);
});

document.querySelectorAll("#difficulty .btn").forEach(button => {
    button.addEventListener("click", () => {
        difficulty = button.id; // Store difficulty level
        showScreen("board-size");
    });
});

document.querySelectorAll("#board-size .btn").forEach(button => {
    button.addEventListener("click", () => {
        boardSize = parseInt(button.dataset.size);
        startGame(boardSize);
    });
});

// Start game
function startGame(size) {
    gameEnded = false; // إعادة تعيين حالة اللعبة
    board = Array(size)
        .fill(null)
        .map(() => Array(size).fill(null));
    renderBoard(size);
    statusElement.textContent = `${currentPlayer}'s Turn`;
    winnerMessageElement.classList.remove("show");

    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    boardElement.style.width = `${size * 100}px`;
    boardElement.style.height = `${size * 100}px`;

    showScreen("game-board");
}

// Render board
function renderBoard(size) {
    boardElement.innerHTML = "";
    board.forEach((row, i) => {
        row.forEach((cell, j) => {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            if (cell === "X") {
                tile.textContent = "X";
                tile.classList.add("x");
            } else if (cell === "O") {
                tile.textContent = "O";
                tile.classList.add("o");
            }
            tile.addEventListener("click", () => handlePlayerMove(i, j));
            boardElement.appendChild(tile);
        });
    });
}

// Handle player move
function handlePlayerMove(row, col) {
    if (board[row][col] !== null || gameEnded) return; // إذا كانت الخانة مش فاضية أو اللعبة انتهت

    // تسجيل الحركة
    board[row][col] = currentPlayer;
    renderBoard(boardSize);

    // التحقق من الفائز بعد كل حركة
    if (checkWinner()) return; // إذا فيه فائز

    // التبديل بين اللاعبين
    const temp = currentPlayer;
    currentPlayer = opponentPlayer;
    opponentPlayer = temp;

    // تغيير النص المعروض
    statusElement.textContent = `${currentPlayer}'s Turn`;

    if (aiEnabled && currentPlayer === aiSymbol) {
        setTimeout(aiMove, 500); // حركة الذكاء الاصطناعي
    }
}

// AI Move
function aiMove() {
    let availableMoves = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === null) {
                availableMoves.push({ row: i, col: j });
            }
        }
    }

    if (availableMoves.length === 0) return;

    let aiMove;
    if (difficulty === "easy") {
        aiMove = randomMove(availableMoves, 0.3);
    } else if (difficulty === "medium") {
        aiMove = randomMove(availableMoves, 0.5);
    } else if (difficulty === "hard") {
        aiMove = randomMove(availableMoves, 0.8);
    } else if (difficulty === "extreme") {
        aiMove = bestMove(availableMoves); // AI always plays the optimal move
    }

    board[aiMove.row][aiMove.col] = aiSymbol;
    renderBoard(boardSize);
    if (checkWinner()) return;

    const temp = currentPlayer;
    currentPlayer = opponentPlayer;
    opponentPlayer = temp;
    statusElement.textContent = `${currentPlayer}'s Turn`;
}

// Random Move with Probability
function randomMove(moves, probability) {
    if (Math.random() <= probability) {
        return bestMove(moves);
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

// Best Move for AI
function bestMove(moves) {
    for (const move of moves) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[move.row][move.col] = aiSymbol;
        if (isWinningMove(tempBoard, aiSymbol)) return move;
    }

    for (const move of moves) {
        const tempBoard = board.map(row => [...row]);
        tempBoard[move.row][move.col] = userSymbol;
        if (isWinningMove(tempBoard, userSymbol)) return move;
    }

    return moves[Math.floor(Math.random() * moves.length)];
}

// Check Winning Move
function isWinningMove(tempBoard, symbol) {
    for (let i = 0; i < boardSize; i++) {
        if (tempBoard[i].every(cell => cell === symbol) || tempBoard.map(row => row[i]).every(cell => cell === symbol)) {
            return true;
        }
    }

    if (tempBoard.every((row, index) => row[index] === symbol) ||
        tempBoard.every((row, index) => row[boardSize - 1 - index] === symbol)) {
        return true;
    }

    return false;
}

// Check Winner
function checkWinner() {
    for (let i = 0; i < boardSize; i++) {
        // تحقق من كل صف وعمود
        if (board[i].every(cell => cell === currentPlayer) || board.map(row => row[i]).every(cell => cell === currentPlayer)) {
            declareWinner(currentPlayer);
            return true;
        }
    }

    // تحقق من الأقطار
    if (board.every((row, index) => row[index] === currentPlayer) ||
        board.every((row, index) => row[boardSize - 1 - index] === currentPlayer)) {
        declareWinner(currentPlayer);
        return true;
    }

    // تحقق من التعادل
    if (board.flat().every(cell => cell !== null)) {
        declareWinner(null);
        return true;
    }

    return false;
}

// Declare Winner
function declareWinner(winner) {
    gameEnded = true; // إيقاف اللعبة بعد تحديد الفائز
    if (winner) {
        winnerMessageElement.textContent = `${winner === userSymbol ? player1Name : player2Name} Wins!`;
    } else {
        winnerMessageElement.textContent = "It's a Draw!";
    }
    winnerMessageElement.classList.add("show");
    statusElement.textContent = "Game Over"; // رسالة إنتهاء اللعبة
}

// Reset Game
document.getElementById("reset").addEventListener("click", () => {
    location.reload(); // Reload the page to restart the game
});

// Initialize
showScreen("home");
