const searchButton = document.getElementById("player-search");
const board = document.getElementById("board");
const message = document.getElementById("message");
const turnMessage = document.getElementById("turn-announcement");
const restartButton = document.getElementById("restart-button");
const cells = document.querySelectorAll(".cell");

let ws;
let currentPlayer = null;
let gameOver = false;

searchButton.addEventListener("click", () => {
    if (ws) {
        ws.close();
    }
    ws = new WebSocket("ws://localhost:3000");
    clearBoard();
    searchButton.style.display = "none";
    message.textContent = "Searching for an opponent...";
    turnMessage.textContent = "";
    restartButton.style.display = "none";
    gameOver = false;

    ws.onopen = () => {
        board.style.display = "none";
    };

    function highlightWinningLine(combo) {
        combo.forEach(index => {
            cells[index].classList.add('highlight');
        });
    }

    ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "start") {
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? "Your Turn" : "Waiting For Opponent";
            message.textContent = "Game Started!";
            board.style.display = "grid";
            restartButton.style.display = "none";
            searchButton.style.display = "none";
        } else if (data.type === "move") {
            updateBoard(data.board);
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? "Your Turn" : "Waiting For Opponent";
        } else if (data.type === "win") {
            if (data.winCombo) {
                highlightWinningLine(data.winCombo);
            }
            message.textContent = `Player ${data.winner} Wins! 🎉`;
            gameOver = true;
            restartButton.style.display = "inline-block";
        } else if (data.type === "draw") {
            message.textContent = "It's a Draw!";
            gameOver = true;
            restartButton.style.display = "inline-block";
        } else if (data.type === "restart") {
            currentPlayer = data.currentPlayer;
            turnMessage.textContent = currentPlayer ? "Your Turn" : "Waiting For Opponent";
            message.textContent = "Game Restarted";
            restartButton.style.display = "none";
            gameOver = false;
            enableBoard();
            updateBoard(Array(9).fill(null));
        } else if (data.type === "disconnect") {
            message.textContent = "Opponent Disconnected.";
            gameOver = true;
            disableBoard();
            restartButton.style.display = "none";
            searchButton.style.display = "inline-block";
        }
    };

    ws.onclose = () => {
        message.textContent = "Disconnected. Search for a new opponent!";
        gameOver = true;
        disableBoard();
        restartButton.style.display = "none";
        searchButton.style.display = "inline-block";
    };
});

cells.forEach(cell => {
    cell.addEventListener("click", () => {
        if (currentPlayer && cell.textContent === "" && !gameOver) {
            const index = cell.dataset.index;
            ws.send(JSON.stringify({ type: "move", index }));
        }
    });
});

restartButton.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "restart" }));
});

function updateBoard(gameState) {
    cells.forEach((cell, index) => {
        cell.textContent = gameState[index];
        cell.classList.remove("highlight");
    });
}


function disableBoard() {
    cells.forEach(cell => {
        cell.style.pointerEvents = "none";
    });
}

function enableBoard() {
    cells.forEach(cell => {
        cell.style.pointerEvents = "auto";
    });
}

function clearBoard() {
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("highlight");
    });
}









