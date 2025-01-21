import { io } from "socket.io-client";

const searchButton = document.getElementById("player-search");
const board = document.getElementById("board");
const message = document.getElementById("message");
const turnMessage = document.getElementById("turn-announcement");
const restartButton = document.getElementById("restart-button");
const cells = document.querySelectorAll(".cell");

const socket = io("https://your-socket-server-url.com");

let currentPlayer = null;
let gameOver = false;

searchButton.addEventListener("click", () => {
    socket.emit("search");
    clearBoard();
    searchButton.style.display = "none";
    message.textContent = "Searching for an opponent...";
    turnMessage.textContent = "";
    restartButton.style.display = "none";
    gameOver = false;
});

socket.on("start", (data) => {
    currentPlayer = data.currentPlayer;
    turnMessage.textContent = currentPlayer ? "Your Turn" : "Waiting for Opponent";
    message.textContent = "Game Started!";
    board.style.display = "grid";
});

socket.on("update", (data) => {
    updateBoard(data.board);
    currentPlayer = !currentPlayer;
    turnMessage.textContent = currentPlayer ? "Your Turn" : "Waiting for Opponent";
});

socket.on("win", (data) => {
    highlightWinningLine(data.winCombo);
    message.textContent = `Player ${data.winner} Wins! 🎉`;
    gameOver = true;
    restartButton.style.display = "inline-block";
});

socket.on("draw", () => {
    message.textContent = "It's a Draw!";
    gameOver = true;
    restartButton.style.display = "inline-block";
});

socket.on("restart", (data) => {
    updateBoard(data.board);
    gameOver = false;
    restartButton.style.display = "none";
});

socket.on("disconnect", (data) => {
    message.textContent = data.message;
    gameOver = true;
    disableBoard();
    restartButton.style.display = "none";
    searchButton.style.display = "inline-block";
});

cells.forEach((cell) => {
    cell.addEventListener("click", () => {
        if (currentPlayer && cell.textContent === "" && !gameOver) {
            const index = cell.dataset.index;
            socket.emit("move", { index });
        }
    });
});

restartButton.addEventListener("click", () => {
    socket.emit("restart");
});

function updateBoard(gameState) {
    cells.forEach((cell, index) => {
        cell.textContent = gameState[index];
        cell.classList.remove("highlight");
    });
}

function highlightWinningLine(combo) {
    combo.forEach((index) => {
        cells[index].classList.add("highlight");
    });
}

function disableBoard() {
    cells.forEach((cell) => {
        cell.style.pointerEvents = "none";
    });
}

function enableBoard() {
    cells.forEach((cell) => {
        cell.style.pointerEvents = "auto";
    });
}

function clearBoard() {
    cells.forEach((cell) => {
        cell.textContent = "";
        cell.classList.remove("highlight");
    });
}
