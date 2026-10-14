export default{run:async(e,t)=>{try{const o=String.raw`
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

.wrap{
  width:100%;
  padding:10px;
  border-radius:16px;
  background:linear-gradient(145deg,#141414,#272727);
  color:#fff;
  border:1px solid rgba(255,255,255,.1);
}

.card{
  width:100%;
  max-width:330px;
  margin:auto;
  padding:14px;
  border-radius:16px;
  background:#faf8ef;
  color:#776e65;
  box-shadow:0 5px 18px rgba(0,0,0,.25);
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:10px;
}

.title{
  font-size:36px;
  font-weight:900;
  line-height:1;
}

.stats{
  display:flex;
  gap:7px;
}

.stat{
  min-width:65px;
  padding:7px 8px;
  border-radius:7px;
  background:#bbada0;
  color:#fff;
  text-align:center;
}

.statLabel{
  font-size:8px;
  font-weight:900;
  opacity:.8;
}

.statValue{
  font-size:14px;
  font-weight:900;
  margin-top:2px;
}

.infoRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  margin-bottom:10px;
}

.desc{
  font-size:9px;
  line-height:1.4;
  color:#776e65;
}

.restart{
  flex:none;
  border:0;
  border-radius:7px;
  padding:8px 11px;
  background:#8f7a66;
  color:#fff;
  font-size:9px;
  font-weight:900;
}

.board{
  position:relative;
  width:100%;
  aspect-ratio:1;
  border-radius:8px;
  padding:8px;
  background:#bbada0;
  touch-action:none;
}

.grid{
  width:100%;
  height:100%;
  display:grid;
  grid-template-columns:repeat(4,1fr);
  grid-template-rows:repeat(4,1fr);
  gap:8px;
}

.cell{
  border-radius:6px;
  background:#cdc1b4;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:25px;
  font-weight:900;
  transition:.08s;
}

.v0{color:transparent}
.v2{background:#eee4da;color:#776e65}
.v4{background:#ede0c8;color:#776e65}
.v8{background:#f2b179;color:#f9f6f2}
.v16{background:#f59563;color:#f9f6f2}
.v32{background:#f67c5f;color:#f9f6f2}
.v64{background:#f65e3b;color:#f9f6f2}
.v128{background:#edcf72;color:#f9f6f2;font-size:21px}
.v256{background:#edcc61;color:#f9f6f2;font-size:21px}
.v512{background:#edc850;color:#f9f6f2;font-size:21px}
.v1024{background:#edc53f;color:#f9f6f2;font-size:17px}
.v2048{background:#edc22e;color:#f9f6f2;font-size:17px}
.vbig{background:#3c3a32;color:#f9f6f2;font-size:15px}

.overlay{
  position:absolute;
  inset:0;
  z-index:10;
  display:none;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  border-radius:8px;
  background:rgba(238,228,218,.78);
}

.overlay.show{
  display:flex;
}

.overTitle{
  font-size:24px;
  font-weight:900;
  margin-bottom:10px;
  color:#776e65;
}

.overText{
  font-size:10px;
  margin-bottom:10px;
}

.overBtn{
  border:0;
  border-radius:7px;
  padding:9px 14px;
  background:#8f7a66;
  color:#fff;
  font-size:10px;
  font-weight:900;
}

.controls{
  display:grid;
  grid-template-columns:repeat(3,52px);
  grid-template-rows:repeat(2,48px);
  gap:6px;
  justify-content:center;
  margin:12px auto 2px;
}

.dir{
  border:0;
  border-radius:10px;
  background:#8f7a66;
  color:#fff;
  font-size:20px;
  font-weight:900;
}

.up{grid-column:2;grid-row:1}
.left{grid-column:1;grid-row:2}
.down{grid-column:2;grid-row:2}
.right{grid-column:3;grid-row:2}

.hint{
  text-align:center;
  margin-top:8px;
  font-size:8px;
  opacity:.45;
  color:#776e65;
}
</style>

<div class="wrap">
  <div class="card">

    <div class="header">
      <div class="title">2048</div>

      <div class="stats">
        <div class="stat">
          <div class="statLabel">SCORE</div>
          <div class="statValue" id="score">0</div>
        </div>

        <div class="stat">
          <div class="statLabel">BEST</div>
          <div class="statValue" id="best">0</div>
        </div>
      </div>
    </div>

    <div class="infoRow">
      <div class="desc">
        Gabungkan angka yang sama sampai jadi 2048.
      </div>

      <button class="restart" id="restart">
        NEW GAME
      </button>
    </div>

    <div class="board" id="board">
      <div class="grid" id="grid"></div>

      <div class="overlay" id="overlay">
        <div class="overTitle" id="overTitle">
          GAME OVER
        </div>

        <div class="overText" id="overText">
          Coba lagi.
        </div>

        <button class="overBtn" id="overBtn">
          PLAY AGAIN
        </button>
      </div>
    </div>

    <div class="controls">
      <button class="dir up" data-dir="up">⬆</button>
      <button class="dir left" data-dir="left">⬅</button>
      <button class="dir down" data-dir="down">⬇</button>
      <button class="dir right" data-dir="right">➡</button>
    </div>

    <div class="hint">
      SWIPE ATAU PAKAI TOMBOL ARAH
    </div>

  </div>
</div>

<script>
(function(){

const gridEl=document.getElementById("grid");
const scoreEl=document.getElementById("score");
const bestEl=document.getElementById("best");
const restartBtn=document.getElementById("restart");
const overlay=document.getElementById("overlay");
const overTitle=document.getElementById("overTitle");
const overText=document.getElementById("overText");
const overBtn=document.getElementById("overBtn");
const boardEl=document.getElementById("board");
const dirBtns=document.querySelectorAll(".dir");

let board=[];
let score=0;
let best=0;
let won=false;
let touchX=0;
let touchY=0;

try{
  best=parseInt(localStorage.getItem("game2048_best")||"0");
  if(!Number.isFinite(best)) best=0;
}catch(e){
  best=0;
}

bestEl.textContent=String(best);

let ac=null;

function initAudio(){
  try{
    if(!ac){
      const A=window.AudioContext||window.webkitAudioContext;
      if(!A)return;
      ac=new A();
    }

    if(ac.state==="suspended"){
      ac.resume();
    }
  }catch(e){}
}

function tone(f,d,type,vol){
  try{
    initAudio();
    if(!ac)return;

    const o=ac.createOscillator();
    const g=ac.createGain();

    o.type=type||"sine";
    o.frequency.value=f;

    g.gain.setValueAtTime(
      vol||.025,
      ac.currentTime
    );

    g.gain.exponentialRampToValueAtTime(
      .001,
      ac.currentTime+d
    );

    o.connect(g);
    g.connect(ac.destination);

    o.start();
    o.stop(ac.currentTime+d+.02);
  }catch(e){}
}

function emptyBoard(){
  return [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0
  ];
}

function saveBest(){
  if(score>best){
    best=score;

    try{
      localStorage.setItem(
        "game2048_best",
        String(best)
      );
    }catch(e){}
  }

  bestEl.textContent=String(best);
}

function newGame(){
  board=emptyBoard();
  score=0;
  won=false;

  overlay.classList.remove("show");

  addTile();
  addTile();

  render();
}

function addTile(){
  const empty=[];

  for(let i=0;i<16;i++){
    if(board[i]===0){
      empty.push(i);
    }
  }

  if(empty.length===0){
    return false;
  }

  const idx=
    empty[
      Math.floor(
        Math.random()*empty.length
      )
    ];

  board[idx]=
    Math.random()<.9
      ? 2
      : 4;

  return true;
}

function classForValue(v){
  if(v===0)return "v0";
  if(v<=2048)return "v"+v;
  return "vbig";
}

function render(){
  gridEl.innerHTML="";

  board.forEach(function(v){
    const cell=document.createElement("div");

    cell.className=
      "cell "+
      classForValue(v);

    cell.textContent=
      v===0
        ? ""
        : String(v);

    gridEl.appendChild(cell);
  });

  scoreEl.textContent=String(score);

  saveBest();
}

function compressAndMerge(line){
  const values=line.filter(function(v){
    return v!==0;
  });

  let gained=0;

  for(let i=0;i<values.length-1;i++){
    if(values[i]===values[i+1]){
      values[i]*=2;
      gained+=values[i];
      values.splice(i+1,1);
      i++;
    }
  }

  while(values.length<4){
    values.push(0);
  }

  return {
    line:values,
    gained:gained
  };
}

function sameBoard(a,b){
  for(let i=0;i<a.length;i++){
    if(a[i]!==b[i]){
      return false;
    }
  }
  return true;
}

function moveLeft(){
  const old=board.slice();
  let gained=0;

  for(let r=0;r<4;r++){
    const row=[
      board[r*4],
      board[r*4+1],
      board[r*4+2],
      board[r*4+3]
    ];

    const result=
      compressAndMerge(row);

    gained+=result.gained;

    for(let c=0;c<4;c++){
      board[r*4+c]=result.line[c];
    }
  }

  score+=gained;

  return !sameBoard(old,board);
}

function moveRight(){
  const old=board.slice();
  let gained=0;

  for(let r=0;r<4;r++){
    const row=[
      board[r*4+3],
      board[r*4+2],
      board[r*4+1],
      board[r*4]
    ];

    const result=
      compressAndMerge(row);

    gained+=result.gained;

    const out=
      result.line.reverse();

    for(let c=0;c<4;c++){
      board[r*4+c]=out[c];
    }
  }

  score+=gained;

  return !sameBoard(old,board);
}

function moveUp(){
  const old=board.slice();
  let gained=0;

  for(let c=0;c<4;c++){
    const col=[
      board[c],
      board[4+c],
      board[8+c],
      board[12+c]
    ];

    const result=
      compressAndMerge(col);

    gained+=result.gained;

    for(let r=0;r<4;r++){
      board[r*4+c]=result.line[r];
    }
  }

  score+=gained;

  return !sameBoard(old,board);
}

function moveDown(){
  const old=board.slice();
  let gained=0;

  for(let c=0;c<4;c++){
    const col=[
      board[12+c],
      board[8+c],
      board[4+c],
      board[c]
    ];

    const result=
      compressAndMerge(col);

    gained+=result.gained;

    const out=
      result.line.reverse();

    for(let r=0;r<4;r++){
      board[r*4+c]=out[r];
    }
  }

  score+=gained;

  return !sameBoard(old,board);
}

function hasMoves(){
  for(let i=0;i<16;i++){
    if(board[i]===0){
      return true;
    }
  }

  for(let r=0;r<4;r++){
    for(let c=0;c<4;c++){
      const i=r*4+c;

      if(
        c<3 &&
        board[i]===board[i+1]
      ){
        return true;
      }

      if(
        r<3 &&
        board[i]===board[i+4]
      ){
        return true;
      }
    }
  }

  return false;
}

function checkWin(){
  if(
    !won &&
    board.some(function(v){
      return v>=2048;
    })
  ){
    won=true;

    overTitle.textContent=
      "🎉 2048!";

    overText.textContent=
      "Kamu berhasil mencapai 2048.";

    overBtn.textContent=
      "LANJUT MAIN";

    overlay.classList.add("show");

    tone(
      880,
      .10,
      "square",
      .03
    );

    setTimeout(function(){
      tone(
        1080,
        .12,
        "square",
        .025
      );
    },80);

    return true;
  }

  return false;
}

function checkGameOver(){
  if(!hasMoves()){
    overTitle.textContent=
      "GAME OVER";

    overText.textContent=
      "Tidak ada langkah lagi.";

    overBtn.textContent=
      "PLAY AGAIN";

    overlay.classList.add("show");

    tone(
      180,
      .18,
      "sawtooth",
      .04
    );

    return true;
  }

  return false;
}

function performMove(dir){
  initAudio();

  let moved=false;

  if(dir==="left"){
    moved=moveLeft();
  }

  if(dir==="right"){
    moved=moveRight();
  }

  if(dir==="up"){
    moved=moveUp();
  }

  if(dir==="down"){
    moved=moveDown();
  }

  if(!moved){
    return;
  }

  tone(
    520,
    .035,
    "square",
    .018
  );

  addTile();

  render();

  if(checkWin()){
    return;
  }

  checkGameOver();
}

dirBtns.forEach(function(btn){
  btn.addEventListener(
    "pointerdown",
    function(ev){
      ev.preventDefault();

      performMove(
        this.dataset.dir
      );
    }
  );
});

restartBtn.addEventListener(
  "pointerdown",
  function(ev){
    ev.preventDefault();
    newGame();
  }
);

overBtn.addEventListener(
  "pointerdown",
  function(ev){
    ev.preventDefault();

    if(
      won &&
      hasMoves()
    ){
      overlay.classList.remove("show");
      overBtn.textContent="PLAY AGAIN";
      return;
    }

    newGame();
  }
);

boardEl.addEventListener(
  "touchstart",
  function(ev){
    const t=
      ev.changedTouches[0];

    touchX=t.clientX;
    touchY=t.clientY;
  },
  {
    passive:true
  }
);

boardEl.addEventListener(
  "touchend",
  function(ev){
    const t=
      ev.changedTouches[0];

    const dx=
      t.clientX-touchX;

    const dy=
      t.clientY-touchY;

    const ax=
      Math.abs(dx);

    const ay=
      Math.abs(dy);

    if(
      ax<18 &&
      ay<18
    ){
      return;
    }

    if(ax>ay){
      performMove(
        dx>0
          ? "right"
          : "left"
      );
    }else{
      performMove(
        dy>0
          ? "down"
          : "up"
      );
    }
  },
  {
    passive:true
  }
);

document.addEventListener(
  "keydown",
  function(ev){
    const map={
      ArrowUp:"up",
      ArrowDown:"down",
      ArrowLeft:"left",
      ArrowRight:"right",
      w:"up",
      W:"up",
      s:"down",
      S:"down",
      a:"left",
      A:"left",
      d:"right",
      D:"right"
    };

    if(map[ev.key]){
      ev.preventDefault();

      performMove(
        map[ev.key]
      );
    }
  }
);

newGame();

})();
</script>
`,r=`game2048-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,n=Buffer.from(JSON.stringify({response_id:r,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:r}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"2048 Game"}],unifiedResponse:{data:n},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:r})}catch(t){console.error("[2048 ERROR]",t),await e.reply("✗ Gagal membuka game 2048.")}},cmd:"2048",alias:["game2048","g2048"],type:"games",limit:!1,location:"plugins/games/2048.js"};