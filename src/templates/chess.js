// Interactive Chess Game - Complex state management and drag & drop
export const chess = {
  name: "Interactive Chess Game",
  files: {
    "App.jsx": `import { useState } from "react";
import ChessBoard from "./components/ChessBoard";
import GameInfo from "./components/GameInfo";
import MoveHistory from "./components/MoveHistory";

export default function App() {
  const [gameState, setGameState] = useState("playing"); // playing, check, checkmate, stalemate
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });

  const handleMove = (from, to, piece, captured) => {
    const move = {
      from,
      to,
      piece,
      player: currentPlayer,
      captured,
      timestamp: Date.now()
    };

    setMoveHistory([...moveHistory, move]);
    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [currentPlayer]: [...prev[currentPlayer], captured]
      }));
    }
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
  };

  const resetGame = () => {
    setGameState("playing");
    setCurrentPlayer("white");
    setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Chess Master
          </h1>
          <p className="text-lg text-gray-300">
            Play, practice, and perfect your strategy
          </p>
        </div>

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chess Board - Left/Center */}
          <div className="lg:col-span-2">
            <ChessBoard
              currentPlayer={currentPlayer}
              gameState={gameState}
              onMove={handleMove}
            />
          </div>

          {/* Side Panel - Right */}
          <div className="space-y-6">
            <GameInfo
              currentPlayer={currentPlayer}
              gameState={gameState}
              capturedPieces={capturedPieces}
              moveCount={moveHistory.length}
              onReset={resetGame}
            />
            <MoveHistory moves={moveHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}`,

    "components/ChessBoard.jsx": `import { useState } from "react";
import { useChessLogic } from "../hooks/useChessLogic";
import Square from "./Square";

export default function ChessBoard({ currentPlayer, gameState, onMove }) {
  const { board, selectedSquare, validMoves, selectSquare, movePiece } = useChessLogic(onMove);

  const handleSquareClick = (row, col) => {
    if (gameState !== "playing") return;

    const clickedPiece = board[row][col];

    if (selectedSquare) {
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);
      if (isValidMove) {
        movePiece(selectedSquare.row, selectedSquare.col, row, col);
      } else if (clickedPiece && clickedPiece.color === currentPlayer) {
        selectSquare(row, col);
      } else {
        selectSquare(null);
      }
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      selectSquare(row, col);
    }
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-3xl shadow-2xl p-6">
      {/* Column Labels */}
      <div className="flex justify-center mb-3">
        <div className="grid grid-cols-8 gap-0 w-full max-w-2xl">
          {["a", "b", "c", "d", "e", "f", "g", "h"].map(letter => (
            <div key={letter} className="text-center text-blue-300 font-medium text-sm">
              {letter}
            </div>
          ))}
        </div>
      </div>

      {/* Chess Board */}
      <div className="grid grid-cols-8 gap-0 w-full max-w-2xl mx-auto aspect-square border-2 border-gray-600 rounded-2xl overflow-hidden shadow-2xl">
        {board.map((row, rowIndex) => (
          row.map((square, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
            const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);

            return (
              <Square
                key={\`\${rowIndex}-\${colIndex}\`}
                piece={square}
                isLight={isLight}
                isSelected={isSelected}
                isValidMove={isValidMove}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              />
            );
          })
        ))}
      </div>

      {/* Row Labels */}
      <div className="flex justify-center mt-3">
        <div className="grid grid-cols-8 gap-0 w-full max-w-2xl">
          {[8, 7, 6, 5, 4, 3, 2, 1].reverse().map(num => (
            <div key={num} className="text-center text-blue-300 font-medium text-sm">
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="mt-6 text-center">
        <div className="inline-block bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl px-6 py-2.5">
          <span className="text-gray-200 text-base">
            Current Turn: <span className="font-semibold text-blue-400">{currentPlayer === "white" ? "White" : "Black"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}`,

    "components/Square.jsx": `export default function Square({ piece, isLight, isSelected, isValidMove, onClick }) {
  const baseClasses = isLight
    ? "bg-gray-100"
    : "bg-blue-900";

  const selectedClasses = isSelected
    ? "ring-4 ring-blue-400 ring-inset shadow-lg shadow-blue-400/50"
    : "";

  const validMoveClasses = isValidMove
    ? "ring-2 ring-green-400 ring-inset shadow-md shadow-green-400/30"
    : "";

  // Use outline symbols for consistency - pawn uses outline to match other pieces
  const pieceSymbols = {
    king: "♔", queen: "♕", rook: "♖",
    bishop: "♗", knight: "♘", pawn: "♙"
  };

  // Consistent styling with fills and strokes for uniformity
  const getPieceStyle = (color, pieceType) => {
    const baseStyle = {
      fontWeight: "700",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    };

    if (color === "white") {
      return {
        ...baseStyle,
        color: "#ffffff",
        WebkitTextFillColor: "#ffffff",
        WebkitTextStroke: "2px rgba(0, 0, 0, 0.8)",
        textShadow: "0 3px 6px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 1)",
        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
      };
    } else {
      return {
        ...baseStyle,
        color: "#000000",
        WebkitTextFillColor: "#1a1a1a",
        WebkitTextStroke: "2px rgba(0, 0, 0, 0.9)",
        textShadow: "0 2px 4px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(255, 255, 255, 0.2)",
        filter: "drop-shadow(0 1px 2px rgba(255, 255, 255, 0.2))",
      };
    }
  };

  return (
    <div
      onClick={onClick}
      className={\`
        \${baseClasses}
        \${selectedClasses}
        \${validMoveClasses}
        aspect-square flex items-center justify-center cursor-pointer
        hover:brightness-110 transition-all duration-200
        relative
      \`}
    >
      {piece && (
        <span
          className="text-5xl select-none"
          style={getPieceStyle(piece.color, piece.type)}
        >
          {pieceSymbols[piece.type]}
        </span>
      )}
      {isValidMove && !piece && (
        <div className="w-3.5 h-3.5 rounded-full bg-green-400/70 shadow-lg shadow-green-400/50" />
      )}
    </div>
  );
}`,

    "components/GameInfo.jsx": `export default function GameInfo({ currentPlayer, gameState, capturedPieces, moveCount, onReset }) {
  const pieceValues = {
    pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9
  };

  const calculateScore = (pieces) => {
    return pieces.reduce((sum, piece) => sum + (pieceValues[piece.type] || 0), 0);
  };

  const whiteScore = calculateScore(capturedPieces.white);
  const blackScore = calculateScore(capturedPieces.black);

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-3xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Game Info</h2>

      {/* Scores */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-700/40 rounded-2xl p-4 border border-gray-600/50">
          <div className="text-gray-300 text-sm mb-1 font-medium">White Score</div>
          <div className="text-3xl font-bold text-blue-400">{whiteScore}</div>
          <div className="text-xs text-gray-400 mt-1">
            {capturedPieces.white.map(p => p.type).join(", ") || "No captures"}
          </div>
        </div>

        <div className="bg-gray-700/40 rounded-2xl p-4 border border-gray-600/50">
          <div className="text-gray-300 text-sm mb-1 font-medium">Black Score</div>
          <div className="text-3xl font-bold text-purple-400">{blackScore}</div>
          <div className="text-xs text-gray-400 mt-1">
            {capturedPieces.black.map(p => p.type).join(", ") || "No captures"}
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="bg-gray-700/40 rounded-2xl p-4 mb-4 border border-gray-600/50">
        <div className="text-gray-300 text-sm mb-1 font-medium">Status</div>
        <div className="text-lg font-semibold text-gray-100">
          {gameState === "playing" && "Game in Progress"}
          {gameState === "check" && "Check!"}
          {gameState === "checkmate" && "Checkmate!"}
          {gameState === "stalemate" && "Stalemate"}
        </div>
        <div className="text-sm text-gray-300 mt-2">
          Moves: {moveCount}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
      >
        New Game
      </button>
    </div>
  );
}`,

    "components/MoveHistory.jsx": `export default function MoveHistory({ moves }) {
  const formatMove = (move, index) => {
    const moveNum = Math.floor(index / 2) + 1;
    const isWhiteMove = index % 2 === 0;
    return \`\${moveNum}. \${move.piece.type[0].toUpperCase()}\${move.from} → \${move.to}\`;
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-3xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Move History</h2>

      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {moves.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No moves yet
          </div>
        ) : (
          moves.map((move, index) => (
            <div
              key={index}
              className={\`
                p-3 rounded-xl transition-colors
                \${move.player === "white" ? "bg-blue-900/20 border-blue-700/30" : "bg-purple-900/20 border-purple-700/30"}
                border
              \`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-200">
                  {formatMove(move, index)}
                </span>
                {move.captured && (
                  <span className="text-xs text-red-400 font-medium">
                    Captured: {move.captured.type}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`,

    "hooks/useChessLogic.js": `import { useState } from "react";

export function useChessLogic(onMove) {
  const [board, setBoard] = useState(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const selectSquare = (row, col) => {
    if (row === null) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    const piece = board[row][col];
    if (!piece) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    setSelectedSquare({ row, col });
    setValidMoves(calculateValidMoves(board, row, col, piece));
  };

  const movePiece = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    const captured = newBoard[toRow][toCol];

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);

    if (onMove) {
      onMove(
        \`\${String.fromCharCode(97 + fromCol)}\${8 - fromRow}\`,
        \`\${String.fromCharCode(97 + toCol)}\${8 - toRow}\`,
        piece,
        captured
      );
    }
  };

  return { board, selectedSquare, validMoves, selectSquare, movePiece };
}

function initializeBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: "pawn", color: "black" };
    board[6][i] = { type: "pawn", color: "white" };
  }

  // Rooks
  board[0][0] = board[0][7] = { type: "rook", color: "black" };
  board[7][0] = board[7][7] = { type: "rook", color: "white" };

  // Knights
  board[0][1] = board[0][6] = { type: "knight", color: "black" };
  board[7][1] = board[7][6] = { type: "knight", color: "white" };

  // Bishops
  board[0][2] = board[0][5] = { type: "bishop", color: "black" };
  board[7][2] = board[7][5] = { type: "bishop", color: "white" };

  // Queens
  board[0][3] = { type: "queen", color: "black" };
  board[7][3] = { type: "queen", color: "white" };

  // Kings
  board[0][4] = { type: "king", color: "black" };
  board[7][4] = { type: "king", color: "white" };

  return board;
}

function calculateValidMoves(board, row, col, piece) {
  const moves = [];

  // Simplified move calculation (pawn forward only as example)
  if (piece.type === "pawn") {
    const direction = piece.color === "white" ? -1 : 1;
    const newRow = row + direction;

    if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
      moves.push({ row: newRow, col });
    }
  }

  // Add more piece logic here for full chess rules
  // This is simplified for the example

  return moves;
}
`
  }
};
