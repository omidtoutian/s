import { useEffect, useMemo, useState } from 'react';
import { socket } from './socket';
import { fetchGames } from './api';
import './app.css';

function Lobby({ onEnterGame }) {
  const [games, setGames] = useState([]);
  const [name, setName] = useState('');

  const load = async () => {
    const list = await fetchGames();
    setGames(list);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    socket.on('lobbyUpdate', handler);
    return () => socket.off('lobbyUpdate', handler);
  }, []);

  const createGame = () => {
    socket.emit('createGame', { name }, (res) => {
      if (res.ok) onEnterGame(res.game);
      else alert(res.error);
    });
  };

  const joinGame = (gameId) => {
    socket.emit('joinGame', { gameId, name }, (res) => {
      if (res.ok) onEnterGame(res.game);
      else alert(res.error);
    });
  };

  return (
    <div className="lobby">
      <h2>Backgammon Lobby</h2>
      <div className="name-row">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        <button onClick={createGame}>Create Game</button>
      </div>
      <h3>Open Games</h3>
      <div className="game-list">
        {games.length === 0 && <div>No games yet</div>}
        {games.map(g => (
          <div key={g.id} className="game-item">
            <div>Game {g.id}</div>
            <div>{g.players.length}/2 players</div>
            <button disabled={g.players.length >= 2} onClick={() => joinGame(g.id)}>Join</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Checker({ color }) {
  return <div className={`checker ${color === 'A' ? 'a' : 'b'}`} />;
}

function Point({ index, point, isSelected, onClick, highlight }) {
  return (
    <div className={`point ${index % 2 === 0 ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${highlight ? 'highlight' : ''}`} onClick={onClick}>
      <div className="stack">
        {Array.from({ length: point.count }).map((_, i) => (
          <Checker key={i} color={point.player} />
        ))}
      </div>
      <div className="idx">{index + 1}</div>
    </div>
  );
}

function Board({ game, meColor, onMove, selected, setSelected, legalTargets }) {
  const top = useMemo(() => game.board.points.slice(12, 24), [game.board.points]);
  const bottom = useMemo(() => game.board.points.slice(0, 12), [game.board.points]);

  const selectPoint = (idx) => {
    const p = game.board.points[idx];
    if (!p.player || p.player !== meColor) return;
    setSelected({ from: idx });
  };

  const onPointClick = (idx) => {
    if (!selected) {
      selectPoint(idx);
    } else if (selected.from === idx) {
      setSelected(null);
    } else {
      onMove(selected.from, idx);
      setSelected(null);
    }
  };

  return (
    <div className="board">
      <div className="row top">
        {top.map((p, i) => (
          <Point key={i} index={i + 12} point={p} isSelected={selected?.from === i + 12} onClick={() => onPointClick(i + 12)} highlight={legalTargets.has(i + 12)} />
        ))}
      </div>
      <div className="mid">
        <div className="bar">
          <div>Bar A: {game.board.bar.A}</div>
          <div>Bar B: {game.board.bar.B}</div>
        </div>
        <div className="off">
          <div>Off A: {game.board.borneOff.A}</div>
          <div>Off B: {game.board.borneOff.B}</div>
        </div>
      </div>
      <div className="row bottom">
        {bottom.map((p, i) => (
          <Point key={i} index={i} point={p} isSelected={selected?.from === i} onClick={() => onPointClick(i)} highlight={legalTargets.has(i)} />
        ))}
      </div>
    </div>
  );
}

function Game({ initialGame, onLeave }) {
  const [game, setGame] = useState(initialGame);
  const me = useMemo(() => game.players.find(p => p.id === socket.id), [game, socket.id]);
  const meColor = me?.color;
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const handler = (g) => setGame(g);
    socket.on('gameState', handler);
    return () => socket.off('gameState', handler);
  }, []);

  const roll = () => {
    socket.emit('rollDice', { gameId: game.id }, (res) => {
      if (!res.ok) alert(res.error);
    });
  };

  const computeLegalTargets = useMemo(() => {
    const targets = new Set();
    if (!selected || !meColor) return targets;
    const dice = (game.dice || []).filter(d => d > 0);
    const dir = meColor === 'A' ? -1 : 1;

    if (selected.from === 'bar') {
      for (const d of dice) {
        const idx = meColor === 'A' ? 24 - d : d - 1;
        targets.add(idx);
      }
      return targets;
    }

    for (const d of dice) {
      const to = selected.from + dir * d;
      if (to >= 0 && to <= 23) targets.add(to);
    }
    return targets;
  }, [selected, game.dice, meColor]);

  const onMove = (from, to) => {
    socket.emit('makeMove', { gameId: game.id, from, to }, (res) => {
      if (!res.ok) alert(res.error);
    });
  };

  const leave = () => {
    socket.emit('leaveGame', { gameId: game.id }, () => onLeave());
  };

  const myTurn = game.turn === meColor;

  return (
    <div className="game">
      <div className="topbar">
        <div>Game {game.id}</div>
        <div>Players: {game.players.map(p => `${p.name}(${p.color})`).join(' vs ')}</div>
        <div>Turn: {game.turn}</div>
        <div>Dice: {(game.dice || []).filter(d => d > 0).join(', ') || '-'}</div>
        <button onClick={roll} disabled={!myTurn || (game.dice && game.dice.some(d => d > 0))}>Roll</button>
        <button onClick={leave}>Leave</button>
      </div>
      <Board game={game} meColor={meColor} onMove={onMove} selected={selected} setSelected={setSelected} legalTargets={computeLegalTargets} />
      {game.status === 'finished' && (
        <div className="winner">Winner: {game.winner}</div>
      )}
    </div>
  );
}

export default function App() {
  const [current, setCurrent] = useState(null);

  return (
    <div className="app">
      {!current ? (
        <Lobby onEnterGame={(g) => setCurrent(g)} />
      ) : (
        <Game initialGame={current} onLeave={() => setCurrent(null)} />
      )}
    </div>
  );
}
