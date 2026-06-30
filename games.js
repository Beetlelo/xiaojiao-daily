/**
 * 虾饺每日9选3 - 小游戏模块
 * 包含：贪吃蛇、俄罗斯方块、华容道
 */

let currentGame = null;
let gameInterval = null;
let gameAnimFrame = null;
let gameState = {};

// ==================== 弹层控制 ====================
function showGamesModal() {
  document.getElementById('gamesOverlay').style.display = 'flex';
}
function closeGamesModal() {
  document.getElementById('gamesOverlay').style.display = 'none';
}
function closeGame() {
  if (gameInterval) clearInterval(gameInterval);
  if (gameAnimFrame) cancelAnimationFrame(gameAnimFrame);
  currentGame = null;
  gameState = {};
  document.getElementById('gamePlayOverlay').style.display = 'none';
  document.getElementById('gamesOverlay').style.display = 'none';
}

// ==================== 贪吃蛇 ====================
function initSnake() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const size = Math.min(window.innerWidth - 32, 380);
  canvas.width = size;
  canvas.height = size;
  const GS = 20; // grid size
  const TC = Math.floor(size / GS); // tile count

  gameState = {
    ctx, size, GS, TC,
    snake: [{x: Math.floor(TC/2), y: Math.floor(TC/2)}],
    food: {x: 5, y: 5},
    dx: 1, dy: 0,
    score: 0,
    over: false
  };
  placeFood();

  function placeFood() {
    let x, y;
    do {
      x = Math.floor(Math.random() * TC);
      y = Math.floor(Math.random() * TC);
    } while (gameState.snake.some(s => s.x === x && s.y === y));
    gameState.food = {x, y};
  }

  function draw() {
    const {ctx, size, GS, TC, snake, food, over, score} = gameState;
    // 背景
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, size, size);
    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < TC; i++) {
      ctx.beginPath(); ctx.moveTo(i*GS,0); ctx.lineTo(i*GS,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*GS); ctx.lineTo(size,i*GS); ctx.stroke();
    }
    // 食物
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(food.x*GS+GS/2, food.y*GS+GS/2, GS/2-2, 0, Math.PI*2);
    ctx.fill();
    // 蛇
    snake.forEach((s, i) => {
      const t = i / snake.length;
      ctx.fillStyle = `rgb(${Math.round(76+t*179)},${Math.round(175+t*84)},${Math.round(80+t*175)})`;
      ctx.fillRect(s.x*GS+1, s.y*GS+1, GS-2, GS-2);
    });
    // 分数
    document.getElementById('gamePlayScore').textContent = '得分: ' + score;
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束!', size/2, size/2-10);
      ctx.font = '15px sans-serif';
      ctx.fillText('得分: ' + score + '  (点击重来)', size/2, size/2+20);
    }
  }

  function step() {
    if (gameState.over) return;
    const {snake, food, TC} = gameState;
    const head = {x: snake[0].x + gameState.dx, y: snake[0].y + gameState.dy};
    // 撞墙/撞自己
    if (head.x < 0 || head.x >= TC || head.y < 0 || head.y >= TC ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      gameState.over = true; return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      gameState.score += 10;
      placeFood();
    } else {
      snake.pop();
    }
  }

  // 键盘
  document.onkeydown = (e) => {
    if (over && gameState.over) { resetSnake(); return; }
    if (e.key === 'ArrowUp' && gameState.dy === 0) { gameState.dx = 0; gameState.dy = -1; }
    if (e.key === 'ArrowDown' && gameState.dy === 0) { gameState.dx = 0; gameState.dy = 1; }
    if (e.key === 'ArrowLeft' && gameState.dx === 0) { gameState.dx = -1; gameState.dy = 0; }
    if (e.key === 'ArrowRight' && gameState.dx === 0) { gameState.dx = 1; gameState.dy = 0; }
  };

  // 触屏控制
  setupControls('snake');

  gameInterval = setInterval(() => { step(); draw(); }, 130);
  draw();
}

function resetSnake() {
  const TC = gameState.TC;
  gameState.snake = [{x: Math.floor(TC/2), y: Math.floor(TC/2)}];
  gameState.dx = 1; gameState.dy = 0;
  gameState.score = 0; gameState.over = false;
  placeFood();
}

// ==================== 俄罗斯方块 ====================
const TET_COLORS = ['#ff6b6b','#4ecdc4','#45b7d1','#f9ca24','#6c5ce7','#fd79a8','#00b894'];
const TET_SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]]
];

function initTetris() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const COLS = 10, ROWS = 20;
  const BS = Math.floor(Math.min(window.innerWidth - 32, 280) / COLS);
  canvas.width = BS * COLS;
  canvas.height = BS * ROWS;

  gameState = {
    ctx, BS, COLS, ROWS,
    board: Array(ROWS).fill().map(() => Array(COLS).fill(0)),
    piece: null, score: 0, over: false
  };
  newPiece();

  function newPiece() {
    const idx = Math.floor(Math.random() * TET_SHAPES.length);
    gameState.piece = {shape: TET_SHAPES[idx], color: TET_COLORS[idx], x: 3, y: 0};
  }

  function draw() {
    const {ctx, BS, COLS, ROWS, board, piece, score, over} = gameState;
    const W = BS*COLS, H = BS*ROWS;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i <= COLS; i++) { ctx.beginPath(); ctx.moveTo(i*BS,0); ctx.lineTo(i*BS,H); ctx.stroke(); }
    for (let i = 0; i <= ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*BS); ctx.lineTo(W,i*BS); ctx.stroke(); }
    // 已固定
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c]) { ctx.fillStyle = board[r][c]; ctx.fillRect(c*BS+1, r*BS+1, BS-2, BS-2); }
    // 当前方块
    if (piece && !over) {
      for (let r = 0; r < piece.shape.length; r++)
        for (let c = 0; c < piece.shape[r].length; c++)
          if (piece.shape[r][c]) {
            ctx.fillStyle = piece.color;
            ctx.fillRect((piece.x+c)*BS+1, (piece.y+r)*BS+1, BS-2, BS-2);
          }
    }
    document.getElementById('gamePlayScore').textContent = '得分: ' + score;
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束!', W/2, H/2-10);
      ctx.font = '15px sans-serif';
      ctx.fillText('得分: ' + score + '  (点击重来)', W/2, H/2+20);
    }
  }

  function collide(p, dx, dy) {
    for (let r = 0; r < p.shape.length; r++)
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const nx = p.x+c+dx, ny = p.y+r+dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && gameState.board[ny][nx]) return true;
      }
    return false;
  }

  function lock() {
    const {piece, board, ROWS, COLS, shapes, colors} = gameState;
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const y = piece.y + r;
        if (y < 0) { gameState.over = true; return; }
        board[y][piece.x+c] = piece.color;
      }
    // 消行
    let lines = 0;
    for (let r = ROWS-1; r >= 0; r--)
      if (board[r].every(c => c)) { board.splice(r,1); board.unshift(Array(COLS).fill(0)); lines++; r++; }
    gameState.score += [0,100,300,500,800][lines]||0;
    newPiece();
    if (collide(gameState.piece, 0, 0)) gameState.over = true;
  }

  function rotatePiece() {
    const p = gameState.piece;
    const ns = p.shape[0].map((_,i) => p.shape.map(r => r[i]).reverse());
    const old = p.shape;
    p.shape = ns;
    if (collide(p, 0, 0)) p.shape = old;
  }

  // 键盘
  document.onkeydown = (e) => {
    if (gameState.over) { gameState.board = Array(ROWS).fill().map(()=>Array(COLS).fill(0)); gameState.score=0; gameState.over=false; newPiece(); return; }
    if (e.key === 'ArrowLeft') { if (!collide(gameState.piece,-1,0)) gameState.piece.x--; }
    if (e.key === 'ArrowRight') { if (!collide(gameState.piece,1,0)) gameState.piece.x++; }
    if (e.key === 'ArrowDown') { if (!collide(gameState.piece,0,1)) gameState.piece.y++; }
    if (e.key === 'ArrowUp') rotatePiece();
  };

  setupControls('tetris', {
    left: () => { if (!collide(gameState.piece,-1,0)) gameState.piece.x--; },
    right: () => { if (!collide(gameState.piece,1,0)) gameState.piece.x++; },
    down: () => { if (!collide(gameState.piece,0,1)) gameState.piece.y++; },
    rotate: rotatePiece
  });

  // 游戏循环
  let last = 0;
  function loop(t) {
    if (gameState.over) { draw(); return; }
    if (t - last > 700) { if (!collide(gameState.piece,0,1)) gameState.piece.y++; else lock(); last = t; }
    draw();
    gameAnimFrame = requestAnimationFrame(loop);
  }
  gameAnimFrame = requestAnimationFrame(loop);
}

// ==================== 华容道 ====================
function initHuarong() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const GW = 4, GH = 5;
  const CS = Math.floor(Math.min(window.innerWidth - 32, 320) / GW);
  canvas.width = CS * GW;
  canvas.height = CS * GH;

  gameState = {
    ctx, CS, GW, GH,
    pieces: [
      {id:'caocao', w:2, h:2, x:1, y:0, color:'#e74c3c', label:'曹操'},
      {id:'guanyu', w:1, h:2, x:0, y:0, color:'#3498db', label:'关羽'},
      {id:'zhangfei', w:1, h:2, x:3, y:0, color:'#2ecc71', label:'张飞'},
      {id:'zhaoyun', w:2, h:1, x:0, y:2, color:'#f39c12', label:'赵云'},
      {id:'s1', w:1, h:1, x:2, y:2, color:'#9b59b6', label:'兵'},
      {id:'s2', w:1, h:1, x:2, y:3, color:'#9b59b6', label:'兵'},
      {id:'s3', w:1, h:1, x:3, y:2, color:'#9b59b6', label:'兵'},
      {id:'s4', w:1, h:1, x:3, y:3, color:'#9b59b6', label:'兵'},
    ],
    selected: -1, won: false
  };

  function canMove(p, dx, dy) {
    const nx = p.x+dx, ny = p.y+dy;
    if (nx < 0 || nx+p.w > GW || ny < 0 || ny+p.h > GH) return false;
    for (let o of gameState.pieces)
      if (o !== p && !(nx+p.w<=o.x || nx>=o.x+o.w || ny+p.h<=o.y || ny>=o.y+o.h)) return false;
    return true;
  }

  function draw() {
    const {ctx, CS, GW, GH, pieces, won} = gameState;
    const W = CS*GW, H = CS*GH;
    ctx.fillStyle = '#f0ebe5';
    ctx.fillRect(0, 0, W, H);
    // 网格
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i <= GW; i++) { ctx.beginPath(); ctx.moveTo(i*CS,0); ctx.lineTo(i*CS,H); ctx.stroke(); }
    for (let i = 0; i <= GH; i++) { ctx.beginPath(); ctx.moveTo(0,i*CS); ctx.lineTo(W,i*CS); ctx.stroke(); }
    // 出口
    ctx.fillStyle = 'rgba(46,204,113,0.13)';
    ctx.fillRect(CS, (GH-1)*CS, CS*2, CS);
    ctx.fillStyle = '#2ecc71'; ctx.font = `${CS*0.35}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('出口', CS*2, GH*CS-CS*0.3);
    // 方块
    pieces.forEach((p, i) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x*CS+2, p.y*CS+2, p.w*CS-4, p.h*CS-4);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${p.w>1||p.h>1?CS*0.32:CS*0.28}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x*CS+p.w*CS/2, p.y*CS+p.h*CS/2);
      if (i === gameState.selected) {
        ctx.strokeStyle = '#e8734a'; ctx.lineWidth = 3;
        ctx.strokeRect(p.x*CS+1, p.y*CS+1, p.w*CS-2, p.h*CS-2);
      }
    });
    // 胜利
    const cc = pieces[0];
    if (cc.x === 1 && cc.y === 3) {
      gameState.won = true;
      ctx.fillStyle = 'rgba(46,204,113,0.82)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🎉 通关!', W/2, H/2-10);
      ctx.font = '14px sans-serif';
      ctx.fillText('曹操已逃脱华容道! (点击重来)', W/2, H/2+20);
    }
  }

  canvas.onclick = (e) => {
    if (gameState.won) { resetHuarong(); return; }
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX-rect.left)/CS);
    const y = Math.floor((e.clientY-rect.top)/CS);
    const idx = gameState.pieces.findIndex(p => x>=p.x && x<p.x+p.w && y>=p.y && y<p.y+p.h);
    if (gameState.selected >= 0 && idx === gameState.selected) {
      // 尝试移动：下右下左
      const p = gameState.pieces[idx];
      if (canMove(p,0,1)) p.y++;
      else if (canMove(p,1,0)) p.x++;
      else if (canMove(p,0,-1)) p.y--;
      else if (canMove(p,-1,0)) p.x--;
      else gameState.selected = -1;
    } else if (idx >= 0) {
      gameState.selected = idx;
    } else {
      gameState.selected = -1;
    }
    draw();
  };

  document.onkeydown = (e) => {
    if (gameState.won) { resetHuarong(); return; }
    if (gameState.selected < 0) { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) gameState.selected = 0; return; }
    const p = gameState.pieces[gameState.selected];
    if (e.key === 'ArrowUp' && canMove(p,0,-1)) p.y--;
    if (e.key === 'ArrowDown' && canMove(p,0,1)) p.y++;
    if (e.key === 'ArrowLeft' && canMove(p,-1,0)) p.x--;
    if (e.key === 'ArrowRight' && canMove(p,1,0)) p.x++;
    if (e.key === 'Tab') { e.preventDefault(); gameState.selected = (gameState.selected+1) % gameState.pieces.length; }
    draw();
  };

  function resetHuarong() {
    gameState.pieces = [
      {id:'caocao', w:2, h:2, x:1, y:0, color:'#e74c3c', label:'曹操'},
      {id:'guanyu', w:1, h:2, x:0, y:0, color:'#3498db', label:'关羽'},
      {id:'zhangfei', w:1, h:2, x:3, y:0, color:'#2ecc71', label:'张飞'},
      {id:'zhaoyun', w:2, h:1, x:0, y:2, color:'#f39c12', label:'赵云'},
      {id:'s1', w:1, h:1, x:2, y:2, color:'#9b59b6', label:'兵'},
      {id:'s2', w:1, h:1, x:2, y:3, color:'#9b59b6', label:'兵'},
      {id:'s3', w:1, h:1, x:3, y:2, color:'#9b59b6', label:'兵'},
      {id:'s4', w:1, h:1, x:3, y:3, color:'#9b59b6', label:'兵'},
    ];
    gameState.selected = -1; gameState.won = false;
    draw();
  }

  setupControls('huarong');
  draw();
}

// ==================== 控制按钮 ====================
function setupControls(type, extra) {
  const wrap = document.getElementById('gameControls');
  if (type === 'snake') {
    wrap.innerHTML = '<div class="ctrl-row"><div class="gcb" data-dir="up">↑</div></div>' +
      '<div class="ctrl-row"><div class="gcb" data-dir="left">←</div><div class="gcb" data-dir="ok" style="visibility:hidden"></div><div class="gcb" data-dir="right">→</div></div>' +
      '<div class="ctrl-row"><div class="gcb" data-dir="down">↓</div></div>';
    wrap.querySelectorAll('.gcb').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const d = btn.dataset.dir;
        if (d==='up'&&gameState.dy===0){gameState.dx=0;gameState.dy=-1;}
        if (d==='down'&&gameState.dy===0){gameState.dx=0;gameState.dy=1;}
        if (d==='left'&&gameState.dx===0){gameState.dx=-1;gameState.dy=0;}
        if (d==='right'&&gameState.dx===0){gameState.dx=1;gameState.dy=0;}
      });
    });
  } else if (type === 'tetris') {
    wrap.innerHTML = '<div class="ctrl-row"><div class="gcb" data-a="left">←</div><div class="gcb" data-a="rotate">↻</div><div class="gcb" data-a="right">→</div></div>' +
      '<div class="ctrl-row"><div class="gcb wide" data-a="down">⬇ 加速</div></div>';
    wrap.querySelectorAll('.gcb').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const a = btn.dataset.a;
        if (a==='left') extra.left();
        if (a==='right') extra.right();
        if (a==='down') extra.down();
        if (a==='rotate') extra.rotate();
      });
    });
  } else {
    wrap.innerHTML = '<div style="font-size:12px;color:#888;text-align:center;padding:8px">👆 点击方块选中，再点击方向键移动<br>⌨️ 方向键移动，Tab切换方块</div>';
  }
}

// ==================== 入口 ====================
function openGame(type) {
  document.getElementById('gamesOverlay').style.display = 'none';
  document.getElementById('gamePlayOverlay').style.display = 'flex';
  currentGame = type;
  const titles = {snake:'🐍 贪吃蛇', tetris:'🧱 俄罗斯方块', huarong:'🏯 华容道'};
  document.getElementById('gamePlayTitle').textContent = titles[type]||'游戏';
  document.getElementById('gamePlayScore').textContent = '得分: 0';
  document.onkeydown = null;
  setTimeout(() => {
    if (type==='snake') initSnake();
    else if (type==='tetris') initTetris();
    else if (type==='huarong') initHuarong();
  }, 80);
}
