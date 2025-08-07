const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

/** In-memory store **/
const games = new Map();

function createInitialBoard() {
  const points = Array.from({ length: 24 }, () => ({ player: null, count: 0 }));
  // Player A setup
  points[23] = { player: 'A', count: 2 }; // 24
  points[12] = { player: 'A', count: 5 }; // 13
  points[7] = { player: 'A', count: 3 };  // 8
  points[5] = { player: 'A', count: 5 };  // 6
  // Player B setup (mirror)
  points[0] = { player: 'B', count: 2 };  // 1
  points[11] = { player: 'B', count: 5 }; // 12
  points[16] = { player: 'B', count: 3 }; // 17
  points[18] = { player: 'B', count: 5 }; // 19
  return {
    points,
    bar: { A: 0, B: 0 },
    borneOff: { A: 0, B: 0 }
  };
}

function serializeGame(game) {
  return {
    id: game.id,
    createdAt: game.createdAt,
    status: game.status,
    players: game.players.map(p => ({ id: p.id, name: p.name, color: p.color })),
    turn: game.turn,
    dice: game.dice,
    movesRemaining: game.movesRemaining,
    board: game.board,
    winner: game.winner
  };
}

function getOpponent(color) {
  return color === 'A' ? 'B' : 'A';
}

function isHomeIndex(color, index) {
  return color === 'A' ? index >= 0 && index <= 5 : index >= 18 && index <= 23;
}

function enterIndexFromBar(color, die) {
  return color === 'A' ? 24 - die : die - 1;
}

function direction(color) {
  return color === 'A' ? -1 : 1;
}

function canLandOn(point, color) {
  return point.count === 0 || point.player === color || (point.player !== color && point.count === 1);
}

function allInHome(board, color) {
  const range = color === 'A' ? [0, 5] : [18, 23];
  let total = board.borneOff[color];
  for (let i = 0; i < 24; i++) {
    const p = board.points[i];
    if (p.player === color) {
      total += p.count;
      if (i < range[0] || i > range[1]) return false;
    }
  }
  // If none on board, technically all in home
  return true;
}

function hasAnyLegalMove(game, color) {
  const dice = game.dice.filter(d => d > 0);
  if (dice.length === 0) return false;
  const board = game.board;
  // If on bar, must enter
  if (board.bar[color] > 0) {
    for (const d of dice) {
      const idx = enterIndexFromBar(color, d);
      const point = board.points[idx];
      if (canLandOn(point, color)) return true;
    }
    return false;
  }
  // Otherwise try any checker
  for (let i = 0; i < 24; i++) {
    const p = board.points[i];
    if (p.player !== color || p.count === 0) continue;
    for (const d of dice) {
      const to = i + direction(color) * d;
      if (to >= 0 && to <= 23) {
        if (canLandOn(board.points[to], color)) return true;
      } else if (allInHome(board, color)) {
        // Bearing off
        if (color === 'A') {
          if (to < 0) {
            // Exact or highest checker rule
            const needed = i + 1; // need die >= needed
            if (d >= needed) return true;
            // Or if no checker behind i
            let hasBehind = false;
            for (let j = 0; j < i; j++) if (board.points[j].player === 'A') { hasBehind = true; break; }
            if (!hasBehind && d < needed) return true;
          }
        } else {
          if (to > 23) {
            const needed = 24 - i; // die >= needed
            if (d >= needed) return true;
            let hasBehind = false;
            for (let j = 23; j > i; j--) if (board.points[j].player === 'B') { hasBehind = true; break; }
            if (!hasBehind && d < needed) return true;
          }
        }
      }
    }
  }
  return false;
}

function applyMove(game, color, from, to, die) {
  const board = game.board;
  // From bar
  if (from === 'bar') {
    if (board.bar[color] <= 0) throw new Error('No checkers on bar');
    const entryIdx = enterIndexFromBar(color, die);
    if (to !== entryIdx) throw new Error('Invalid entry point');
    const dest = board.points[entryIdx];
    if (!canLandOn(dest, color)) throw new Error('Blocked entry');
    // Hit if blot
    if (dest.player && dest.player !== color && dest.count === 1) {
      const opp = dest.player;
      dest.player = color;
      dest.count = 1;
      board.bar[opp] += 1;
    } else if (dest.count === 0) {
      dest.player = color;
      dest.count = 1;
    } else {
      dest.count += 1;
    }
    board.bar[color] -= 1;
    return;
  }

  // Move from point index
  if (typeof from !== 'number') throw new Error('Invalid from');
  const fromPoint = board.points[from];
  if (fromPoint.player !== color || fromPoint.count <= 0) throw new Error('No checker at from');

  // Bearing off
  if (to === 'off') {
    if (!allInHome(board, color)) throw new Error('Not all checkers in home');
    if (color === 'A') {
      const targetIdx = from - die;
      if (targetIdx === -1) {
        // exact
        fromPoint.count -= 1;
        if (fromPoint.count === 0) fromPoint.player = null;
        board.borneOff[color] += 1;
      } else if (targetIdx < -1) {
        throw new Error('Die too large');
      } else {
        // Allowed only if no checker behind
        let hasBehind = false;
        for (let j = 0; j < from; j++) if (board.points[j].player === 'A') { hasBehind = true; break; }
        if (hasBehind) throw new Error('Cannot bear off with checker behind');
        fromPoint.count -= 1;
        if (fromPoint.count === 0) fromPoint.player = null;
        board.borneOff[color] += 1;
      }
    } else {
      const targetIdx = from + die;
      if (targetIdx === 24) {
        fromPoint.count -= 1;
        if (fromPoint.count === 0) fromPoint.player = null;
        board.borneOff[color] += 1;
      } else if (targetIdx > 24) {
        throw new Error('Die too large');
      } else {
        let hasBehind = false;
        for (let j = 23; j > from; j--) if (board.points[j].player === 'B') { hasBehind = true; break; }
        if (hasBehind) throw new Error('Cannot bear off with checker behind');
        fromPoint.count -= 1;
        if (fromPoint.count === 0) fromPoint.player = null;
        board.borneOff[color] += 1;
      }
    }
    return;
  }

  // Move to point index
  if (typeof to !== 'number') throw new Error('Invalid to');
  const destIdx = to;
  const dest = board.points[destIdx];
  if (!canLandOn(dest, color)) throw new Error('Destination blocked');

  // Move checker
  fromPoint.count -= 1;
  if (fromPoint.count === 0) fromPoint.player = null;

  if (dest.count === 0) {
    dest.player = color;
    dest.count = 1;
  } else if (dest.player === color) {
    dest.count += 1;
  } else {
    // hit blot
    const opp = dest.player;
    dest.player = color;
    dest.count = 1;
    board.bar[opp] += 1;
  }
}

function useDie(game, value) {
  for (let i = 0; i < game.dice.length; i++) {
    if (game.dice[i] === value) {
      game.dice[i] = 0; // mark used
      game.movesRemaining -= 1;
      return true;
    }
  }
  return false;
}

function nextTurn(game) {
  game.turn = getOpponent(game.turn);
  game.dice = [];
  game.movesRemaining = 0;
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/games', (req, res) => {
  const list = Array.from(games.values()).map(g => ({
    id: g.id,
    status: g.status,
    players: g.players.map(p => ({ id: p.id, name: p.name, color: p.color }))
  })).filter(g => g.status === 'waiting' || g.status === 'playing');
  res.json(list);
});

io.on('connection', (socket) => {
  socket.on('createGame', ({ name }, cb) => {
    const id = nanoid(6);
    const game = {
      id,
      createdAt: Date.now(),
      status: 'waiting',
      players: [{ id: socket.id, name: name || 'Player A', color: 'A' }],
      board: createInitialBoard(),
      turn: 'A',
      dice: [],
      movesRemaining: 0,
      winner: null
    };
    games.set(id, game);
    socket.join(id);
    cb && cb({ ok: true, game: serializeGame(game) });
    io.emit('lobbyUpdate');
  });

  socket.on('joinGame', ({ gameId, name }, cb) => {
    const game = games.get(gameId);
    if (!game) return cb && cb({ ok: false, error: 'Game not found' });
    if (game.players.length >= 2) return cb && cb({ ok: false, error: 'Game full' });
    game.players.push({ id: socket.id, name: name || 'Player B', color: 'B' });
    game.status = 'playing';
    socket.join(gameId);
    io.to(gameId).emit('gameState', serializeGame(game));
    cb && cb({ ok: true, game: serializeGame(game) });
    io.emit('lobbyUpdate');
  });

  socket.on('listGames', (cb) => {
    const list = Array.from(games.values()).map(g => ({
      id: g.id,
      status: g.status,
      players: g.players.map(p => ({ id: p.id, name: p.name, color: p.color }))
    })).filter(g => g.status === 'waiting' || g.status === 'playing');
    cb && cb(list);
  });

  socket.on('rollDice', ({ gameId }, cb) => {
    const game = games.get(gameId);
    if (!game) return cb && cb({ ok: false, error: 'Game not found' });
    const player = game.players.find(p => p.id === socket.id);
    if (!player) return cb && cb({ ok: false, error: 'Not in game' });
    if (player.color !== game.turn) return cb && cb({ ok: false, error: 'Not your turn' });
    if (game.dice.length && game.dice.some(d => d > 0)) return cb && cb({ ok: false, error: 'Dice already rolled' });

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    game.dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
    game.movesRemaining = game.dice.length;

    // If no legal moves, immediately pass turn
    if (!hasAnyLegalMove(game, player.color)) {
      nextTurn(game);
    }

    io.to(gameId).emit('gameState', serializeGame(game));
    cb && cb({ ok: true, game: serializeGame(game) });
  });

  socket.on('makeMove', ({ gameId, from, to }, cb) => {
    const game = games.get(gameId);
    if (!game) return cb && cb({ ok: false, error: 'Game not found' });
    const player = game.players.find(p => p.id === socket.id);
    if (!player) return cb && cb({ ok: false, error: 'Not in game' });
    if (player.color !== game.turn) return cb && cb({ ok: false, error: 'Not your turn' });
    const board = game.board;
    if (!game.dice.some(d => d > 0)) return cb && cb({ ok: false, error: 'Roll dice first' });

    // Determine die used based on from/to
    let dieUsed = null;
    const dir = direction(player.color);

    if (from === 'bar') {
      for (const d of game.dice) {
        if (d === 0) continue;
        const expected = enterIndexFromBar(player.color, d);
        if (to === expected) { dieUsed = d; break; }
      }
      if (dieUsed == null) return cb && cb({ ok: false, error: 'No matching die for entry' });
      try {
        applyMove(game, player.color, 'bar', to, dieUsed);
      } catch (e) {
        return cb && cb({ ok: false, error: e.message });
      }
      useDie(game, dieUsed);
    } else if (typeof from === 'number') {
      if (to === 'off') {
        // bearing off
        // find a die that bears off from from
        let candidate = null;
        for (const d of game.dice) {
          if (d === 0) continue;
          if (player.color === 'A') {
            if (from - d === -1) { candidate = d; break; }
            if (from - d < -1 && allInHome(board, 'A')) {
              // allow larger die if no checker behind
              let hasBehind = false;
              for (let j = 0; j < from; j++) if (board.points[j].player === 'A') { hasBehind = true; break; }
              if (!hasBehind) { candidate = d; break; }
            }
          } else {
            if (from + d === 24) { candidate = d; break; }
            if (from + d > 24 && allInHome(board, 'B')) {
              let hasBehind = false;
              for (let j = 23; j > from; j--) if (board.points[j].player === 'B') { hasBehind = true; break; }
              if (!hasBehind) { candidate = d; break; }
            }
          }
        }
        if (candidate == null) return cb && cb({ ok: false, error: 'No matching die to bear off' });
        try {
          applyMove(game, player.color, from, 'off', candidate);
        } catch (e) {
          return cb && cb({ ok: false, error: e.message });
        }
        useDie(game, candidate);
      } else if (typeof to === 'number') {
        const dist = Math.abs(to - from);
        const needed = dist;
        if (dir < 0 && to >= from) return cb && cb({ ok: false, error: 'Wrong direction' });
        if (dir > 0 && to <= from) return cb && cb({ ok: false, error: 'Wrong direction' });
        if (!game.dice.includes(needed)) return cb && cb({ ok: false, error: 'No matching die' });
        try {
          applyMove(game, player.color, from, to, needed);
        } catch (e) {
          return cb && cb({ ok: false, error: e.message });
        }
        useDie(game, needed);
      } else {
        return cb && cb({ ok: false, error: 'Invalid move' });
      }
    } else {
      return cb && cb({ ok: false, error: 'Invalid move' });
    }

    // Check win condition
    if (game.board.borneOff[player.color] >= 15) {
      game.winner = player.color;
      game.status = 'finished';
    }

    // If moves remain but no legal moves, or no dice left, switch turn
    if (!game.dice.some(d => d > 0) || !hasAnyLegalMove(game, player.color)) {
      nextTurn(game);
    }

    io.to(gameId).emit('gameState', serializeGame(game));
    cb && cb({ ok: true, game: serializeGame(game) });
  });

  socket.on('leaveGame', ({ gameId }, cb) => {
    const game = games.get(gameId);
    if (!game) return cb && cb({ ok: false, error: 'Game not found' });
    game.players = game.players.filter(p => p.id !== socket.id);
    socket.leave(gameId);
    if (game.players.length === 0) {
      games.delete(gameId);
    } else {
      game.status = 'waiting';
      game.dice = [];
      game.movesRemaining = 0;
      game.turn = 'A';
      game.board = createInitialBoard();
      io.to(gameId).emit('gameState', serializeGame(game));
    }
    cb && cb({ ok: true });
    io.emit('lobbyUpdate');
  });

  socket.on('disconnect', () => {
    // Optional: clean up games where a player disconnected
    for (const game of games.values()) {
      const before = game.players.length;
      game.players = game.players.filter(p => p.id !== socket.id);
      if (before !== game.players.length) {
        io.to(game.id).emit('gameState', serializeGame(game));
        io.emit('lobbyUpdate');
      }
      if (game.players.length === 0) {
        games.delete(game.id);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});