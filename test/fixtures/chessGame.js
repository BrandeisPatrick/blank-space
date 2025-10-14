/**
 * Chess Game Test Scenario
 * Advanced test case for complex state management and game logic
 */

export const chessGameScenario = {
  name: "Interactive Chess Game",
  userRequest: "build a chess board",

  expectedIntent: {
    intent: "create_new",
    confidence: 0.9
  },

  expectedPlan: {
    filesToCreate: [
      "App.jsx",
      "components/ChessBoard.jsx",
      "components/Square.jsx",
      "components/GameInfo.jsx",
      "components/MoveHistory.jsx",
      "hooks/useChessLogic.js"
    ],
    filesToModify: [],
    npmPackages: []
  },

  requiredFeatures: [
    "8x8 chess board grid",
    "Chess piece rendering (♔♕♖♗♘♙)",
    "Piece selection and movement",
    "Move validation",
    "Turn-based gameplay (white/black)",
    "Move history tracking",
    "Captured pieces display",
    "Game state management (playing, check, checkmate)",
    "Visual indicators for selected pieces and valid moves"
  ],

  codeQualityChecks: {
    "App.jsx": {
      mustImport: ["ChessBoard", "GameInfo", "MoveHistory"],
      folderImports: ["./components/ChessBoard", "./components/GameInfo", "./components/MoveHistory"],
      mustHaveState: ["gameState", "currentPlayer", "moveHistory"],
      requiredFunctions: ["handleMove", "resetGame"]
    },
    "components/ChessBoard.jsx": {
      mustImport: ["useChessLogic", "Square"],
      mustHaveTailwind: true,
      requiredElements: ["<div", "grid"],
      mustHaveProps: ["currentPlayer", "gameState", "onMove"],
      requiredClasses: ["grid", "grid-cols-8", "aspect-square"]
    },
    "components/Square.jsx": {
      mustHaveProps: ["piece", "isLight", "isSelected", "isValidMove", "onClick"],
      mustHaveTailwind: true,
      requiredClasses: ["cursor-pointer", "hover:", "transition"],
      requiredElements: ["<div"]
    },
    "components/GameInfo.jsx": {
      mustHaveProps: ["currentPlayer", "gameState", "capturedPieces", "onReset"],
      mustHaveTailwind: true,
      requiredElements: ["<button"],
      requiredClasses: ["bg-", "rounded", "shadow"]
    },
    "components/MoveHistory.jsx": {
      mustHaveProps: ["moves"],
      mustHaveTailwind: true,
      requiredElements: ["<div"],
      requiredClasses: ["overflow-y-auto", "space-y-"]
    },
    "hooks/useChessLogic.js": {
      mustExport: "useChessLogic",
      mustHaveFunctions: ["initializeBoard", "calculateValidMoves", "selectSquare", "movePiece"],
      mustImport: ["useState"],
      mustReturn: ["board", "selectedSquare", "validMoves", "selectSquare", "movePiece"]
    }
  },

  complexityChecks: {
    stateManagement: {
      multiDimensional: true, // 8x8 board array
      nested: true, // Piece objects with type/color
      derived: true // Valid moves calculated from board state
    },
    interactions: {
      clickHandling: true,
      conditionalLogic: true, // Move validation
      turnBasedLogic: true
    },
    dataStructures: {
      arrays: true, // Board array, move history array
      objects: true, // Piece objects, game state
      maps: false
    }
  },

  stylingRequirements: {
    modernUI: true,
    tailwindClasses: true,
    shadowsAndRounded: true,
    hoverStates: true,
    gradients: true,
    animations: true,
    responsiveGrid: true,
    visualFeedback: true // Selected pieces, valid moves
  },

  performanceConsiderations: {
    memoization: false, // Optional for this complexity
    virtualScrolling: false,
    lazyLoading: false,
    optimizedReRenders: true // Prevent unnecessary board re-renders
  }
};

export default chessGameScenario;
