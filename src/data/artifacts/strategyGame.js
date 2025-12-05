/**
 * War Grid - Tactical Combat Game
 * A military-themed turn-based strategy game.
 */

export const strategyGameArtifact = {
  id: 'war-grid',
  name: 'War Grid',
  description: 'Command your units in tactical grid combat.',
  icon: 'games',
  category: 'games',
  files: {
    'App.jsx': `
/* ========================================================================
   CONSTANTS & GAME RULES
   ======================================================================== */

const PIECE_TYPES = {
  TANK: 'tank',
  FIGHTER: 'fighter',
  MECH: 'mech',
};

const PLAYERS = {
  GOLD: 'gold',
  CRIMSON: 'crimson',
};

// Attack logic: Tank > Fighter > Mech > Tank
const ATTACK_RULES = {
  [PIECE_TYPES.TANK]: PIECE_TYPES.FIGHTER,
  [PIECE_TYPES.FIGHTER]: PIECE_TYPES.MECH,
  [PIECE_TYPES.MECH]: PIECE_TYPES.TANK,
};

const INITIAL_BOARD_SETUP = [
  // Crimson forces (top)
  [
    { player: PLAYERS.CRIMSON, type: PIECE_TYPES.TANK }, { player: PLAYERS.CRIMSON, type: PIECE_TYPES.FIGHTER },
    { player: PLAYERS.CRIMSON, type: PIECE_TYPES.MECH }, { player: PLAYERS.CRIMSON, type: PIECE_TYPES.MECH },
    { player: PLAYERS.CRIMSON, type: PIECE_TYPES.FIGHTER }, { player: PLAYERS.CRIMSON, type: PIECE_TYPES.TANK },
  ],
  Array(6).fill(null),
  Array(6).fill(null),
  Array(6).fill(null),
  Array(6).fill(null),
  // Gold forces (bottom)
  [
    { player: PLAYERS.GOLD, type: PIECE_TYPES.TANK }, { player: PLAYERS.GOLD, type: PIECE_TYPES.FIGHTER },
    { player: PLAYERS.GOLD, type: PIECE_TYPES.MECH }, { player: PLAYERS.GOLD, type: PIECE_TYPES.MECH },
    { player: PLAYERS.GOLD, type: PIECE_TYPES.FIGHTER }, { player: PLAYERS.GOLD, type: PIECE_TYPES.TANK },
  ],
];

/* ========================================================================
   HOOKS
   ======================================================================== */

const useGameLogic = () => {
  const [board, setBoard] = useState(INITIAL_BOARD_SETUP);
  const [currentPlayer, setCurrentPlayer] = useState(PLAYERS.GOLD);
  const [selectedPiece, setSelectedPiece] = useState(null); // { row, col }
  const [winner, setWinner] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);

  const getValidMoves = (row, col) => {
    const moves = [];
    const piece = board[row][col];
    if (!piece) return [];

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;

        const newRow = row + r;
        const newCol = col + c;

        if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 6) {
          const targetCell = board[newRow][newCol];
          // Can move to an empty cell or an opponent's cell
          if (!targetCell || targetCell.player !== piece.player) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    }
    return moves;
  };
  
  const handleCellClick = (row, col) => {
    if (winner) return;

    const pieceAtClick = board[row][col];

    // If a piece is selected
    if (selectedPiece) {
      const isValidMove = getValidMoves(selectedPiece.row, selectedPiece.col).some(
        move => move.row === row && move.col === col
      );

      // If clicking on a valid move destination
      if (isValidMove) {
        const newBoard = board.map(r => [...r]);
        const attacker = newBoard[selectedPiece.row][selectedPiece.col];

        // If it's an attack on an opponent
        if (pieceAtClick && pieceAtClick.player !== currentPlayer) {
          const defender = pieceAtClick;
          
          if (ATTACK_RULES[attacker.type] === defender.type) { // Attacker wins
            newBoard[row][col] = attacker;
            newBoard[selectedPiece.row][selectedPiece.col] = null;
          } else if (ATTACK_RULES[defender.type] === attacker.type) { // Defender wins
            newBoard[selectedPiece.row][selectedPiece.col] = null;
          } else { // Draw
            newBoard[row][col] = null;
            newBoard[selectedPiece.row][selectedPiece.col] = null;
          }
        } else { // It's a move to an empty cell
          newBoard[row][col] = attacker;
          newBoard[selectedPiece.row][selectedPiece.col] = null;
        }
        
        setBoard(newBoard);
        setMoveHistory([...moveHistory, { from: selectedPiece, to: {row, col}}]);
        setSelectedPiece(null);
        setCurrentPlayer(currentPlayer === PLAYERS.GOLD ? PLAYERS.CRIMSON : PLAYERS.GOLD);
        checkWinner(newBoard);
        return;
      }
    }
    
    // If clicking on one's own piece, select it
    if (pieceAtClick && pieceAtClick.player === currentPlayer) {
      setSelectedPiece({ row, col });
    } else {
      setSelectedPiece(null); // Deselect if clicking elsewhere
    }
  };

  const checkWinner = (currentBoard) => {
    const crimsonPieces = currentBoard.flat().filter(p => p && p.player === PLAYERS.CRIMSON).length;
    const goldPieces = currentBoard.flat().filter(p => p && p.player === PLAYERS.GOLD).length;
    if (crimsonPieces === 0) setWinner(PLAYERS.GOLD);
    if (goldPieces === 0) setWinner(PLAYERS.CRIMSON);
  };
  
  const resetGame = () => {
    setBoard(INITIAL_BOARD_SETUP);
    setCurrentPlayer(PLAYERS.GOLD);
    setSelectedPiece(null);
    setWinner(null);
    setMoveHistory([]);
  };

  return { board, currentPlayer, selectedPiece, winner, handleCellClick, getValidMoves, resetGame };
};


/* ========================================================================
   COMPONENTS
   ======================================================================== */

const Piece = ({ type, player }) => {
  const isGold = player === PLAYERS.GOLD;
  const primaryColor = isGold ? '#f59e0b' : '#dc2626';
  const darkColor = isGold ? '#b45309' : '#991b1b';

  const Icon = () => {
    switch (type) {
      case PIECE_TYPES.TANK:
        // Tank - blocky military shape
        return (
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4">
            <rect x="4" y="10" width="16" height="8" fill={primaryColor} rx="1"/>
            <rect x="7" y="6" width="10" height="6" fill={darkColor} rx="1"/>
            <rect x="14" y="4" width="6" height="4" fill={primaryColor} rx="0.5"/>
          </svg>
        );
      case PIECE_TYPES.FIGHTER:
        // Fighter - arrow/jet shape
        return (
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4">
            <polygon points="12,2 20,20 12,16 4,20" fill={primaryColor}/>
            <polygon points="12,6 16,16 12,14 8,16" fill={darkColor}/>
          </svg>
        );
      case PIECE_TYPES.MECH:
        // Mech - circular with inner core
        return (
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4">
            <circle cx="12" cy="12" r="10" fill={primaryColor}/>
            <circle cx="12" cy="12" r="6" fill={darkColor}/>
            <circle cx="12" cy="12" r="3" fill={primaryColor}/>
          </svg>
        );
      default: return null;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center cursor-pointer">
      <Icon />
    </div>
  );
};

const GameBoard = ({ board, onCellClick, selectedPiece, validMoves }) => {
  return (
    <div className="grid grid-cols-6 gap-0.5 bg-zinc-800 p-1 rounded-lg border-2 border-zinc-600">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isSelected = selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex;
          const isMoveTarget = validMoves.some(move => move.row === rowIndex && move.col === colIndex);
          const cellBg = (rowIndex + colIndex) % 2 === 0 ? 'bg-zinc-700' : 'bg-zinc-800';

          return (
            <div
              key={\`\${rowIndex}-\${colIndex}\`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={\`relative w-11 h-11 sm:w-14 sm:h-14 \${cellBg} flex items-center justify-center\`}
            >
              {piece && <Piece type={piece.type} player={piece.player} />}
              {isSelected && <div className="absolute inset-0 border-2 border-amber-400 bg-amber-400/20"></div>}
              {isMoveTarget && <div className="absolute inset-0 bg-emerald-500/30 border border-emerald-400/50"></div>}
            </div>
          );
        })
      )}
    </div>
  );
};

const GameStatus = ({ currentPlayer, winner, onReset }) => {
  const getStatusText = () => {
    if (winner) return <span className="font-bold uppercase tracking-widest">{winner} VICTORY</span>;
    return <><span className="font-bold uppercase tracking-wide">{currentPlayer}</span> turn</>;
  };

  return (
    <div className="w-full bg-zinc-800/90 border border-zinc-600 p-2 rounded-lg flex items-center justify-between">
      <div className={\`text-sm font-mono \${currentPlayer === PLAYERS.GOLD ? 'text-amber-400' : 'text-red-500'}\`}>
        {getStatusText()}
      </div>
      <button onClick={onReset} className="px-3 py-1 text-xs font-mono uppercase bg-zinc-700 text-zinc-300 rounded border border-zinc-600 hover:bg-zinc-600 transition-colors">
        Reset
      </button>
    </div>
  );
};


/* ========================================================================
   APP
   ======================================================================== */

function App() {
  const { board, currentPlayer, selectedPiece, winner, handleCellClick, getValidMoves, resetGame } = useGameLogic();

  const validMoves = selectedPiece ? getValidMoves(selectedPiece.row, selectedPiece.col) : [];

  return (
    <div className="min-h-screen w-full bg-zinc-900 text-zinc-100 p-2 sm:p-4 font-mono flex flex-col items-center">
      <header className="text-center mb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-widest text-zinc-100">
          WAR<span className="text-amber-500">GRID</span>
        </h1>
      </header>

      <main className="flex flex-col items-center gap-2 w-full max-w-sm">
        <GameStatus currentPlayer={currentPlayer} winner={winner} onReset={resetGame} />
        <GameBoard board={board} onCellClick={handleCellClick} selectedPiece={selectedPiece} validMoves={validMoves} />

        <div className="w-full bg-zinc-800/50 border border-zinc-700 p-2 rounded text-xs">
          <div className="grid grid-cols-3 gap-1 text-center text-zinc-400">
            <div><span className="text-amber-500">Tank</span> &gt; Fighter</div>
            <div><span className="text-amber-500">Fighter</span> &gt; Mech</div>
            <div><span className="text-amber-500">Mech</span> &gt; Tank</div>
          </div>
        </div>
      </main>
    </div>
  );
}
`,
    'styles.css': `
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `
  }
};
