export default{run:async(t,e)=>{try{const n=String.raw`
<style>
*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
  user-select:none;
}

html,body{
  margin:0;
  padding:0;
  width:100%;
  background:transparent;
  font-family:Arial,sans-serif;
  touch-action:manipulation;
}

.tttWrap{
  width:100%;
  padding:10px;
  border-radius:16px;
  background:linear-gradient(145deg,#111922,#1c2734);
  color:#fff;
  border:1px solid rgba(255,255,255,.10);
}

.tttCard{
  width:100%;
  max-width:330px;
  margin:auto;
  padding:14px;
  border-radius:17px;
  background:linear-gradient(145deg,#111827,#162033);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:
    inset 0 0 24px rgba(0,0,0,.30),
    0 5px 18px rgba(0,0,0,.25);
}

.tttHeader{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.tttTitle{
  display:flex;
  align-items:center;
  gap:7px;
  font-size:20px;
  font-weight:900;
  letter-spacing:.3px;
}

.tttTitle .xo{
  font-size:25px;
}

.tttCreator{
  font-size:9px;
  opacity:.55;
}

.modeRow{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px;
  margin-bottom:11px;
}

.modeBtn{
  border:0;
  border-radius:10px;
  padding:11px;
  background:#263247;
  color:#d9e1ec;
  font-size:12px;
  font-weight:900;
  transition:.12s;
}

.modeBtn.active{
  background:#25c6de;
  color:#06202a;
  box-shadow:
    0 4px 0 #147e91,
    inset 0 1px 0 rgba(255,255,255,.25);
}

.stats{
  display:flex;
  justify-content:center;
  gap:24px;
  margin:7px 0 13px;
  font-size:11px;
  font-weight:900;
}

.stats span{
  color:#27d3e7;
}

.board{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
  width:100%;
  aspect-ratio:1;
}

.cell{
  border:1px solid rgba(255,255,255,.07);
  border-radius:13px;
  background:#111927;
  color:#fff;
  font-size:38px;
  font-weight:900;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:
    inset 0 0 13px rgba(0,0,0,.25),
    0 2px 4px rgba(0,0,0,.18);
}

.cell.x{
  color:#ff5c62;
  text-shadow:0 0 10px rgba(255,92,98,.20);
}

.cell.o{
  color:#27cfe5;
  text-shadow:0 0 10px rgba(39,207,229,.20);
}

.cell.win{
  background:#20364b;
  border-color:#2acfe5;
}

.status{
  min-height:22px;
  text-align:center;
  margin-top:13px;
  color:#fff;
  font-size:12px;
  font-weight:800;
}

.restartWrap{
  text-align:center;
  margin-top:11px;
}

.restart{
  border:1px solid rgba(255,255,255,.10);
  border-radius:9px;
  padding:9px 20px;
  background:#253148;
  color:#dbe5f0;
  font-size:11px;
  font-weight:900;
}

.footer{
  text-align:center;
  margin-top:8px;
  font-size:8px;
  opacity:.4;
}
</style>

<div class="tttWrap">
  <div class="tttCard">

    <div class="tttHeader">
      <div class="tttTitle">
        <span class="xo">❌⭕</span>
        <span>TIC TAC TOE</span>
      </div>
      <div class="tttCreator">
        Nixel Games
      </div>
    </div>

    <div class="modeRow">
      <button class="modeBtn active" id="easyBtn">
        EASY
      </button>

      <button class="modeBtn" id="hardBtn">
        HARD
      </button>
    </div>

    <div class="stats">
      <div>KAMU <span id="userScore">0</span></div>
      <div>BOT <span id="botScore">0</span></div>
      <div>SERI <span id="drawScore">0</span></div>
    </div>

    <div class="board" id="board">
      <button class="cell" data-i="0"></button>
      <button class="cell" data-i="1"></button>
      <button class="cell" data-i="2"></button>
      <button class="cell" data-i="3"></button>
      <button class="cell" data-i="4"></button>
      <button class="cell" data-i="5"></button>
      <button class="cell" data-i="6"></button>
      <button class="cell" data-i="7"></button>
      <button class="cell" data-i="8"></button>
    </div>

    <div class="status" id="status">
      Giliranmu, pilih kotak
    </div>

    <div class="restartWrap">
      <button class="restart" id="restart">
        RESTART
      </button>
    </div>

    <div class="footer">
      KAMU = X &nbsp;•&nbsp; BOT = O
    </div>

  </div>
</div>

<script>
(function(){

const wins = [
  [0,1,2],
  [3,4,5],
  [6,7,8],
  [0,3,6],
  [1,4,7],
  [2,5,8],
  [0,4,8],
  [2,4,6]
];

const cells =
  Array.from(
    document.querySelectorAll(".cell")
  );

const statusEl =
  document.getElementById("status");

const easyBtn =
  document.getElementById("easyBtn");

const hardBtn =
  document.getElementById("hardBtn");

const restartBtn =
  document.getElementById("restart");

const userScoreEl =
  document.getElementById("userScore");

const botScoreEl =
  document.getElementById("botScore");

const drawScoreEl =
  document.getElementById("drawScore");

let board =
  ["","","","","","","","",""];

let mode =
  "easy";

let gameOver =
  false;

let botThinking =
  false;

let userScore =
  0;

let botScore =
  0;

let drawScore =
  0;


/*
=========================
SCORE STORAGE
=========================
*/

try{

  const saved =
    JSON.parse(
      localStorage.getItem(
        "ttt2_score"
      ) || "{}"
    );

  userScore =
    Number(saved.user || 0);

  botScore =
    Number(saved.bot || 0);

  drawScore =
    Number(saved.draw || 0);

}catch(err){}


function saveScore(){

  try{

    localStorage.setItem(
      "ttt2_score",
      JSON.stringify({
        user:userScore,
        bot:botScore,
        draw:drawScore
      })
    );

  }catch(err){}

}


function updateScore(){

  userScoreEl.textContent =
    String(userScore);

  botScoreEl.textContent =
    String(botScore);

  drawScoreEl.textContent =
    String(drawScore);

}


updateScore();


/*
=========================
AUDIO
=========================
*/

let audioContext = null;

function initAudio(){

  try{

    if(!audioContext){

      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if(!AudioCtx){
        return;
      }

      audioContext =
        new AudioCtx();

    }

    if(
      audioContext.state ===
      "suspended"
    ){

      audioContext.resume();

    }

  }catch(err){}

}


function tone(
  frequency,
  duration,
  type,
  volume
){

  try{

    initAudio();

    if(!audioContext){
      return;
    }

    const osc =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    osc.type =
      type || "sine";

    osc.frequency.value =
      frequency;

    gain.gain.setValueAtTime(
      volume || .03,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      .001,
      audioContext.currentTime +
      duration
    );

    osc.connect(gain);

    gain.connect(
      audioContext.destination
    );

    osc.start();

    osc.stop(
      audioContext.currentTime +
      duration +
      .02
    );

  }catch(err){}

}


/*
=========================
HELPERS
=========================
*/

function checkWinner(
  state
){

  for(
    let i = 0;
    i < wins.length;
    i++
  ){

    const combo =
      wins[i];

    const a =
      combo[0];

    const b =
      combo[1];

    const c =
      combo[2];

    if(
      state[a] &&
      state[a] === state[b] &&
      state[b] === state[c]
    ){

      return {
        winner:state[a],
        combo:combo
      };

    }

  }

  if(
    state.every(
      function(v){
        return v !== "";
      }
    )
  ){

    return {
      winner:"draw",
      combo:[]
    };

  }

  return null;

}


function render(){

  cells.forEach(
    function(cell,index){

      cell.textContent =
        board[index];

      cell.classList.remove(
        "x",
        "o",
        "win"
      );

      if(
        board[index] === "X"
      ){

        cell.classList.add(
          "x"
        );

      }

      if(
        board[index] === "O"
      ){

        cell.classList.add(
          "o"
        );

      }

    }
  );

}


function markWinner(
  combo
){

  combo.forEach(
    function(index){

      cells[index].classList.add(
        "win"
      );

    }
  );

}


function endGame(
  result
){

  gameOver = true;

  botThinking = false;

  if(
    result.winner === "X"
  ){

    userScore++;

    statusEl.textContent =
      "🎉 Kamu menang!";

    tone(
      760,
      .10,
      "square",
      .035
    );

    setTimeout(
      function(){

        tone(
          980,
          .11,
          "square",
          .03
        );

      },
      80
    );

  }else if(
    result.winner === "O"
  ){

    botScore++;

    statusEl.textContent =
      "🤖 Bot menang!";

    tone(
      190,
      .20,
      "sawtooth",
      .04
    );

  }else{

    drawScore++;

    statusEl.textContent =
      "🤝 Seri!";

    tone(
      420,
      .10,
      "triangle",
      .025
    );

  }

  if(
    result.combo &&
    result.combo.length
  ){

    markWinner(
      result.combo
    );

  }

  updateScore();

  saveScore();

}


/*
=========================
EASY BOT
=========================
*/

function easyMove(){

  const empty =
    board
      .map(
        function(value,index){

          return value === ""
            ? index
            : -1;

        }
      )
      .filter(
        function(index){

          return index !== -1;

        }
      );

  if(
    empty.length === 0
  ){

    return -1;

  }

  return empty[
    Math.floor(
      Math.random() *
      empty.length
    )
  ];

}


/*
=========================
MINIMAX HARD BOT
=========================
*/

function minimax(
  state,
  maximizing
){

  const result =
    checkWinner(
      state
    );

  if(result){

    if(
      result.winner === "O"
    ){
      return 10;
    }

    if(
      result.winner === "X"
    ){
      return -10;
    }

    return 0;

  }


  if(maximizing){

    let best =
      -Infinity;

    for(
      let i = 0;
      i < 9;
      i++
    ){

      if(
        state[i] === ""
      ){

        state[i] =
          "O";

        const score =
          minimax(
            state,
            false
          );

        state[i] =
          "";

        best =
          Math.max(
            best,
            score
          );

      }

    }

    return best;

  }else{

    let best =
      Infinity;

    for(
      let i = 0;
      i < 9;
      i++
    ){

      if(
        state[i] === ""
      ){

        state[i] =
          "X";

        const score =
          minimax(
            state,
            true
          );

        state[i] =
          "";

        best =
          Math.min(
            best,
            score
          );

      }

    }

    return best;

  }

}


function hardMove(){

  let bestScore =
    -Infinity;

  let move =
    -1;

  for(
    let i = 0;
    i < 9;
    i++
  ){

    if(
      board[i] === ""
    ){

      board[i] =
        "O";

      const score =
        minimax(
          board,
          false
        );

      board[i] =
        "";

      if(
        score > bestScore
      ){

        bestScore =
          score;

        move =
          i;

      }

    }

  }

  return move;

}


/*
=========================
BOT TURN
=========================
*/

function botTurn(){

  if(
    gameOver ||
    botThinking
  ){

    return;

  }

  botThinking =
    true;

  statusEl.textContent =
    "Bot sedang berpikir...";

  setTimeout(
    function(){

      if(gameOver){
        return;
      }

      const move =
        mode === "hard"
          ? hardMove()
          : easyMove();

      if(
        move !== -1
      ){

        board[move] =
          "O";

        tone(
          520,
          .06,
          "square",
          .025
        );

        render();

      }

      const result =
        checkWinner(
          board
        );

      if(result){

        endGame(
          result
        );

        return;

      }

      botThinking =
        false;

      statusEl.textContent =
        "Giliranmu, pilih kotak";

    },
    420
  );

}


/*
=========================
PLAYER TURN
=========================
*/

function playerMove(
  index
){

  initAudio();

  if(
    gameOver ||
    botThinking
  ){

    return;

  }

  if(
    board[index] !== ""
  ){

    statusEl.textContent =
      "Kotak itu sudah terisi";

    return;

  }

  board[index] =
    "X";

  tone(
    700,
    .05,
    "square",
    .025
  );

  render();

  const result =
    checkWinner(
      board
    );

  if(result){

    endGame(
      result
    );

    return;

  }

  botTurn();

}


/*
=========================
RESET
=========================
*/

function resetBoard(){

  board =
    ["","","","","","","","",""];

  gameOver =
    false;

  botThinking =
    false;

  statusEl.textContent =
    "Giliranmu, pilih kotak";

  render();

}


/*
=========================
MODE
=========================
*/

function setMode(
  selected
){

  mode =
    selected;

  if(
    selected === "easy"
  ){

    easyBtn.classList.add(
      "active"
    );

    hardBtn.classList.remove(
      "active"
    );

  }else{

    hardBtn.classList.add(
      "active"
    );

    easyBtn.classList.remove(
      "active"
    );

  }

  resetBoard();

}


/*
=========================
EVENTS
=========================
*/

cells.forEach(
  function(cell){

    cell.addEventListener(
      "pointerdown",
      function(event){

        event.preventDefault();

        playerMove(
          Number(
            this.dataset.i
          )
        );

      }
    );

  }
);


easyBtn.addEventListener(
  "pointerdown",
  function(event){

    event.preventDefault();

    setMode(
      "easy"
    );

  }
);


hardBtn.addEventListener(
  "pointerdown",
  function(event){

    event.preventDefault();

    setMode(
      "hard"
    );

  }
);


restartBtn.addEventListener(
  "pointerdown",
  function(event){

    event.preventDefault();

    resetBoard();

  }
);


render();

})();
</script>
`,o=`ttt2-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,a=Buffer.from(JSON.stringify({response_id:o,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await e.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:o}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Tic Tac Toe 2"}],unifiedResponse:{data:a},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:o})}catch(e){console.error("[TICTACTOE2 ERROR]",e),await t.reply("✗ Gagal membuka Tic Tac Toe 2.")}},cmd:["tictactoe2"],alias:["ttt2","ttt2","tictactoe2","xo2"],type:"games",limit:!1,location:"plugins/games/tictactoe2.js"};