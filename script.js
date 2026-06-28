// GESTION DE LA CINÉMATIQUE D'OUVERTURE
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('introOverlay');
    
    // Garde l'écran de bienvenue magique pendant 3.5 secondes puis l'efface avec style
    setTimeout(() => {
        overlay.classList.add('fade-out');
    }, 3500);
});

// ÉTAT DU PLATEAU ET SYSTÈME DE JEU
let boardState = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'], 
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'], 
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

let selectedSquare = null;
let currentTurn = 'w'; // 'w' pour Safae, 'b' pour IA
let moveCounter = 1;

const boardElement = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const aiStatus = document.getElementById('aiStatus');
const movesList = document.getElementById('movesList');
const capWhite = document.getElementById('capturedByWhite');
const capBlack = document.getElementById('capturedByBlack');

function getPieceColor(symbol) {
    if (!symbol) return null;
    return ['♙', '♖', '♘', '♗', '♕', '♔'].includes(symbol) ? 'w' : 'b';
}

function initBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = r;
            square.dataset.col = c;

            const symbol = boardState[r][c];
            if (symbol) {
                const piece = document.createElement('span');
                piece.className = `piece ${getPieceColor(symbol)}`;
                piece.innerText = symbol;
                square.appendChild(piece);
            }

            square.addEventListener('click', () => onSquareClick(r, c));
            boardElement.appendChild(square);
        }
    }
}

function onSquareClick(r, c) {
    if (currentTurn === 'b') return; 

    const symbol = boardState[r][c];
    const color = getPieceColor(symbol);

    if (selectedSquare) {
        const fromR = selectedSquare.row;
        const fromC = selectedSquare.col;

        if (fromR === r && fromC === c) {
            clearSelection();
            return;
        }

        if (color === 'w') {
            highlightSquare(r, c);
            return;
        }

        executeMove(fromR, fromC, r, c);
        
        currentTurn = 'b';
        turnIndicator.innerText = "L'IA compose... 🧠";
        aiStatus.innerText = "Recherche d'un coup face à Safae...";
        
        setTimeout(makeAIMove, 800);
    } else {
        if (color === 'w') {
            highlightSquare(r, c);
        }
    }
}

function highlightSquare(r, c) {
    clearSelection();
    selectedSquare = { row: r, col: c };
    const index = r * 8 + c;
    boardElement.children[index].classList.add('selected');
}

function clearSelection() {
    selectedSquare = null;
    document.querySelectorAll('.square').forEach(s => s.classList.remove('selected'));
}

function executeMove(fromR, fromC, toR, toC) {
    const piece = boardState[fromR][fromC];
    const target = boardState[toR][toC];

    if (target) {
        const capSpan = document.createElement('span');
        capSpan.innerText = target;
        if (getPieceColor(target) === 'w') {
            capBlack.appendChild(capSpan); 
        } else {
            capWhite.appendChild(capSpan); 
        }
    }

    boardState[toR][toC] = piece;
    boardState[fromR][fromC] = '';
    
    logMove(piece, fromR, fromC, toR, toC);
    clearSelection();
    initBoard();
}

function logMove(piece, fR, fC, tR, tC) {
    const cols = ['A','B','C','D','E','F','G','H'];
    const rows = ['8','7','6','5','4','3','2','1'];
    const moveText = `${piece} ${cols[fC]}${rows[fR]}➔${cols[tC]}${rows[tR]}`;

    if (getPieceColor(piece) === 'w') {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'move-row';
        rowDiv.id = `move-${moveCounter}`;
        rowDiv.innerHTML = `<span>${moveCounter}. Safae: ${moveText}</span><span class="ai-part">...</span>`;
        movesList.appendChild(rowDiv);
        movesList.scrollTop = movesList.scrollHeight;
    } else {
        const rowDiv = document.getElementById(`move-${moveCounter}`);
        if (rowDiv) {
            rowDiv.querySelector('.ai-part').innerText = `IA: ${moveText}`;
        }
        moveCounter++;
    }
}

function makeAIMove() {
    let allMoves = [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (getPieceColor(boardState[r][c]) === 'b') {
                const moves = getPseudoLegalMoves(r, c);
                moves.forEach(m => {
                    allMoves.push({ fromR: r, fromC: c, toR: m.r, toC: m.c, weight: m.weight });
                });
            }
        }
    }

    if (allMoves.length === 0) {
        turnIndicator.innerText = "Fin de partie 🌷";
        aiStatus.innerText = "Plus aucun mouvement.";
        return;
    }

    allMoves.sort((a, b) => b.weight - a.weight);
    const maxWeight = allMoves[0].weight;
    const bestMoves = allMoves.filter(m => m.weight === maxWeight);
    const chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];

    executeMove(chosenMove.fromR, chosenMove.fromC, chosenMove.toR, chosenMove.toC);

    currentTurn = 'w';
    turnIndicator.innerText = "C'est à Safae de jouer 🌷";
    aiStatus.innerText = "L'IA attend le coup de Safae...";
}

function getPseudoLegalMoves(r, c) {
    const piece = boardState[r][c];
    let targets = [];

    if (piece === '♟') {
        if (r + 1 < 8 && boardState[r + 1][c] === '') targets.push({ r: r + 1, c: c, weight: 1 });
        if (r + 1 < 8 && c - 1 >= 0 && getPieceColor(boardState[r + 1][c - 1]) === 'w') targets.push({ r: r + 1, c: c - 1, weight: 12 });
        if (r + 1 < 8 && c + 1 < 8 && getPieceColor(boardState[r + 1][c + 1]) === 'w') targets.push({ r: r + 1, c: c + 1, weight: 12 });
    } 
    else {
        const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
        directions.forEach(d => {
            let nextR = r + d[0];
            let nextC = c + d[1];
            if (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
                const targetPiece = boardState[nextR][nextC];
                if (targetPiece === '') {
                    targets.push({ r: nextR, c: nextC, weight: 1 });
                } else if (getPieceColor(targetPiece) === 'w') {
                    let weight = 6;
                    if (targetPiece === '♕') weight = 30;
                    if (targetPiece === '♖') weight = 18;
                    targets.push({ r: nextR, c: nextC, weight: weight });
                }
            }
        });
    }
    return targets;
}

function resetGame() {
    boardState = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];
    selectedSquare = null;
    currentTurn = 'w';
    moveCounter = 1;
    movesList.innerHTML = '';
    capWhite.innerHTML = '';
    capBlack.innerHTML = '';
    turnIndicator.innerText = "C'est à Safae de jouer 🌷";
    aiStatus.innerText = "L'IA attend le coup de Safae...";
    initBoard();
}

initBoard();