const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let games = []; // Store game states for multiple matches

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle new game search
    socket.on("search", () => {
        const game = findOrCreateGame(socket);
        socket.emit("start", { currentPlayer: game.currentPlayer });
        io.to(game.room).emit("update", { board: game.board });
    });

    // Handle moves
    socket.on("move", ({ index }) => {
        const game = getGameBySocket(socket);
        if (game && !game.gameOver && game.board[index] === null) {
            game.board[index] = game.currentPlayer ? "X" : "O";
            game.currentPlayer = !game.currentPlayer;
            io.to(game.room).emit("update", { board: game.board });
            checkWinner(game);
        }
    });

    // Handle restart
    socket.on("restart", () => {
        const game = getGameBySocket(socket);
        if (game) {
            game.board = Array(9).fill(null);
            game.gameOver = false;
            game.currentPlayer = true;
            io.to(game.room).emit("restart", { board: game.board });
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        const game = getGameBySocket(socket);
        if (game) {
            game.players = game.players.filter((player) => player !== socket.id);
            io.to(game.room).emit("disconnect", { message: "Opponent disconnected" });
            if (game.players.length === 0) {
                games = games.filter((g) => g.room !== game.room);
            }
        }
    });
});

function findOrCreateGame(socket) {
    let game = games.find((g) => g.players.length === 1);
    if (!game) {
        game = { room: `room-${Date.now()}`, players: [], board: Array(9).fill(null), currentPlayer: true, gameOver: false };
        games.push(game);
    }
    game.players.push(socket.id);
    socket.join(game.room);
    return game;
}

function getGameBySocket(socket) {
    return games.find((g) => g.players.includes(socket.id));
}

function checkWinner(game) {
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    for (const combo of winCombos) {
        const [a, b, c] = combo;
        if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
            game.gameOver = true;
            io.to(game.room).emit("win", { winner: game.board[a], winCombo: combo });
            return;
        }
    }
    if (game.board.every((cell) => cell !== null)) {
        game.gameOver = true;
        io.to(game.room).emit("draw", {});
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
