// MAGICAL INTRO TIMING LOADER & AUTO-PLAY UNLOCKER
let musicPlaying = false;

window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('introOverlay');
    
    // Smooth fade out for the cinematic screen
    setTimeout(() => {
        overlay.classList.add('fade-out');
    }, 3500);

    // AUTO-PLAY FIX: Unlocks audio as soon as Safae interacts anywhere on the board
    document.addEventListener('click', () => {
        if (!musicPlaying) {
            startMusic();
        }
    }, { once: true });
});

function startMusic() {
    const iframe = document.getElementById('youtubeAudio');
    const btn = document.getElementById('musicBtn');
    if (!iframe) return;
    
    iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    btn.innerText = "⏸ Mute Lofi Music 🐾";
    musicPlaying = true;
}

function stopMusic() {
    const iframe = document.getElementById('youtubeAudio');
    const btn = document.getElementById('musicBtn');
    if (!iframe) return;
    
    iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    btn.innerText = "🎵 Play Lofi Music 🐾";
    musicPlaying = false;
}

function toggleMusic() {
    if (!musicPlaying) {
        startMusic();
    } else {
        stopMusic();
    }
}

// REAL CHESS RULES & MATRIX DATA STRUCTURE
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
let currentTurn = 'w'; // 'w' = Safae (Pink), 'b' = Cat-AI (Chocolate)
let moveCounter = 1;
let legalMovesCache = [];

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

// INITIALIZE BOARD VIEWPORT
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

            // Check if this cell is calculated as a valid destination path
            if (legalMovesCache.some(m => m.r === r && m.c === c)) {
                square.classList.add('legal-dot');
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

        // Clicking the same cell cancels selection
        if (fromR === r && fromC === c) {
            clearSelection();
            return;
        }

        // Switching piece choice to another White/Pink tile
        if (color === 'w') {
            highlightSquare(r, c);
            return;
        }

        // ACCURATE LEGAL VALIDATION STRUCT
        const isMoveLegal = legalMovesCache.some(m => m.r === r && m.c === c);
        if (!isMoveLegal) {
            clearSelection();
            return; 
        }

        executeMove(fromR, fromC, r, c);
        
        currentTurn = 'b';
        turnIndicator.innerText = "Meow-AI is crafting... 🧠🐾";
        aiStatus.innerText = "Looking for a counter-attack...";
        
        setTimeout(makeAIMove, 900);
    } else {
        if (color === 'w') {
            highlightSquare(r, c);
        }
    }
}

function highlightSquare(r, c) {
    selectedSquare = { row: r, col: c };
    legalMovesCache = calculateLegalMoves(r, c);
    initBoard(); 

    const index = r * 8 + c;
    boardElement.children[index].classList.add('selected');
}

function clearSelection() {
    selectedSquare = null;
    legalMovesCache = [];
    initBoard();
}

// REAL PIECE PATH PLANNING & LEGALITY CALCULATION MATRIX
function calculateLegalMoves(r, c) {
    const piece = boardState[r][c];
    let paths = [];
    if (!piece) return paths;

    const myColor = getPieceColor(piece);

    // PAWNS RULE ENGINE
    if (piece === '♙' || piece === '♟') {
        const dir = (myColor === 'w') ? -1 : 1;
        // Step forward
        if (r + dir >= 0 && r + dir < 8 && boardState[r + dir][c] === '') {
            paths.push({ r: r + dir, c: c, weight: 1 });
            // Double step on start lines
            const startRow = (myColor === 'w') ? 6 : 1;
            if (r === startRow && boardState[r + (dir * 2)][c] === '') {
                paths.push({ r: r + (dir * 2), c: c, weight: 2 });
            }
        }
        // Diagonal attacks
        const attackCols = [c - 1, c + 1];
        attackCols.forEach(ac => {
            if (ac >= 0 && ac < 8 && r + dir >= 0 && r + dir < 8) {
                const target = boardState[r + dir][ac];
                if (target && getPieceColor(target) !== myColor) {
                    paths.push({ r: r + dir, c: ac, weight: 15 });
                }
            }
        });
    }

    // KNIGHTS RULE ENGINE (L-Shape Vectors)
    if (piece === '♙' === false && (piece === '♞' || piece === '♘')) {
        const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        offsets.forEach(o => {
            const nr = r + o[0], nc = c + o[1];
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = boardState[nr][nc];
                if (target === '' || getPieceColor(target) !== myColor) {
                    paths.push({ r: nr, c: nc, weight: target ? 12 : 2 });
                }
            }
        });
    }

    // SLIDING PIECES (Rooks, Bishops, Queens, Kings Directions Engine)
    let directions = [];
    let infinite = true;

    if (piece === '♖' || piece === '♜') directions = [[1,0],[-1,0],[0,1],[0,-1]];
    if (piece === '♗' || piece === '♝') directions = [[1,1],[1,-1],[-1,1],[-1,-1]];
    if (piece === '♕' || piece === '♛') directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    if (piece === '♔' || piece === '♚') {
        directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        infinite = false;
    }

    directions.forEach(d => {
        let nr = r + d[0], nc = c + d[1];
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = boardState[nr][nc];
            if (target === '') {
                paths.push({ r: nr, c: nc, weight: 1 });
            } else {
                if (getPieceColor(target) !== myColor) {
                    paths.push({ r: nr, c: nc, weight: 20 });
                }
                break; 
            }
            if (!infinite) break;
            nr += d[0]; nc += d[1];
        }
    });

    return paths;
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
    selectedSquare = null;
    legalMovesCache = [];
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
            rowDiv.querySelector('.ai-part').innerText = `AI: ${moveText}`;
        }
        moveCounter++;
    }
}

// INTELLIGENT AI TURN ENGINE
function makeAIMove() {
    let allAIValidMoves = [];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (getPieceColor(boardState[r][c]) === 'b') {
                const partials = calculateLegalMoves(r, c);
                partials.forEach(m => {
                    allAIValidMoves.push({ fromR: r, fromC: c, toR: m.r, toC: m.c, weight: m.weight });
                });
            }
        }
    }

    if (allAIValidMoves.length === 0) {
        turnIndicator.innerText = "Checkmate or Draw 🌷";
        aiStatus.innerText = "Match concluded cleanly.";
        return;
    }

    allAIValidMoves.sort((a, b) => b.weight - a.weight);
    const maxWeight = allAIValidMoves[0].weight;
    const bestOptions = allAIValidMoves.filter(m => m.weight === maxWeight);
    const selectedAIMove = bestOptions[Math.floor(Math.random() * bestOptions.length)];

    executeMove(selectedAIMove.fromR, selectedAIMove.fromC, selectedAIMove.toR, selectedAIMove.toC);

    currentTurn = 'w';
    turnIndicator.innerText = "It's Safae's turn to play 🌷";
    aiStatus.innerText = "The Meow-AI is waiting for Safae...";
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
    legalMovesCache = [];
    currentTurn = 'w';
    moveCounter = 1;
    movesList.innerHTML = '';
    capWhite.innerHTML = '';
    capBlack.innerHTML = '';
    turnIndicator.innerText = "It's Safae's turn to play 🌷";
    aiStatus.innerText = "The Meow-AI is waiting for Safae...";
    initBoard();
}

initBoard();