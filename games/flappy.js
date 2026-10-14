export default{run:async(t,e)=>{try{const i=String.raw`
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif;touch-action:none}
.wrap{width:100%;padding:10px;border-radius:16px;background:linear-gradient(145deg,#111,#272727);border:1px solid rgba(255,255,255,.12);color:#fff}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.title{font-size:19px;font-weight:700}.creator{font-size:8px;opacity:.5}
.game{position:relative;width:100%;max-width:330px;margin:auto;aspect-ratio:.78;border-radius:13px;overflow:hidden;border:2px solid #333;background:#5b9ba0}
canvas{display:block;width:100%;height:100%}
.score{position:absolute;z-index:5;top:12px;left:0;right:0;text-align:center;font-size:27px;font-weight:900;color:#fff;text-shadow:-2px -2px #333,2px -2px #333,-2px 2px #333,2px 2px #333;pointer-events:none}
.overlay{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.08)}
.overlay.hide{display:none}.over{display:none;background:rgba(0,0,0,.4)}.over.show{display:flex}
.logo{font-size:34px;line-height:1.05;font-weight:900;text-align:center;color:#ffe37a;-webkit-text-stroke:2px #5b471b;text-shadow:0 3px #fff,0 5px rgba(0,0,0,.25);margin-bottom:28px}
button{padding:10px 30px;border:3px solid #1e2618;outline:3px solid #fff;border-radius:2px;background:#78cf27;color:#fff;font-size:16px;font-weight:900;text-shadow:0 2px rgba(0,0,0,.35)}
.overTitle{font-size:27px;font-weight:900;color:#ffe37a;-webkit-text-stroke:1px #604a19;text-shadow:0 2px #fff;margin-bottom:10px}
.overScore{font-size:13px;font-weight:700;margin-bottom:16px;background:rgba(0,0,0,.4);border-radius:8px;padding:8px 14px}
.hint{text-align:center;margin-top:8px;font-size:8px;opacity:.5}
</style>

<div class="wrap">
  <div class="head">
    <div class="title">🐤 FLAPPY BIRD</div>
    <div class="creator">Nixel Games</div>
  </div>

  <div class="game" id="game">
    <canvas id="c"></canvas>
    <div class="score" id="score">0</div>

    <div class="overlay" id="start">
      <div class="logo">FLAPPY<br>BIRD</div>
      <button id="startBtn">START</button>
    </div>

    <div class="overlay over" id="over">
      <div class="overTitle">GAME OVER</div>
      <div class="overScore">
        SCORE: <span id="final">0</span>
        &nbsp; | &nbsp;
        BEST: <span id="best">0</span>
      </div>
      <button id="restart">PLAY AGAIN</button>
    </div>
  </div>

  <div class="hint">TAP LAYAR UNTUK TERBANG</div>
</div>

<script>
(function(){
const canvas=document.getElementById("c");
const ctx=canvas.getContext("2d");
const game=document.getElementById("game");
const start=document.getElementById("start");
const over=document.getElementById("over");
const startBtn=document.getElementById("startBtn");
const restart=document.getElementById("restart");
const scoreEl=document.getElementById("score");
const finalEl=document.getElementById("final");
const bestEl=document.getElementById("best");

let w=0,h=0,dpr=1,running=false,dead=false,last=0,raf=null;
let score=0,best=0,pipeClock=0,groundOffset=0,pipes=[];
let bird={x:80,y:180,r:13,v:0,rot:0};

try{
  best=parseInt(localStorage.getItem("flappy_best")||"0");
  if(!Number.isFinite(best)) best=0;
}catch(e){best=0}
bestEl.textContent=String(best);

let ac=null;
function initAudio(){
  try{
    if(!ac){
      const A=window.AudioContext||window.webkitAudioContext;
      if(!A)return;
      ac=new A();
    }
    if(ac.state==="suspended")ac.resume();
  }catch(e){}
}
function tone(f,d,t,v){
  try{
    initAudio();
    if(!ac)return;
    const o=ac.createOscillator();
    const g=ac.createGain();
    o.type=t||"square";
    o.frequency.value=f;
    g.gain.setValueAtTime(v||.04,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);
    o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d+.02);
  }catch(e){}
}

function resize(){
  const rect=game.getBoundingClientRect();
  w=rect.width;h=rect.height;
  dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.floor(w*dpr);
  canvas.height=Math.floor(h*dpr);
  canvas.style.width=w+"px";
  canvas.style.height=h+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!running)draw();
}

function reset(){
  score=0;pipeClock=0;groundOffset=0;pipes=[];dead=false;running=true;
  bird={x:w*.30,y:h*.42,r:Math.max(11,w*.043),v:0,rot:0};
  scoreEl.textContent="0";
  start.classList.add("hide");
  over.classList.remove("show");
  last=performance.now();
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
}

function flap(){
  initAudio();
  if(!running){
    if(dead)return;
    reset();
    return;
  }
  if(dead)return;
  bird.v=-h*.52;
  tone(620,.07,"square",.035);
}

function addPipe(){
  const gap=h*.235;
  const min=h*.25,max=h*.62;
  const center=min+Math.random()*(max-min);
  pipes.push({x:w+20,w:w*.145,top:center-gap/2,bottom:center+gap/2,scored:false});
}

function hitCircleRect(cx,cy,r,rx,ry,rw,rh){
  const x=Math.max(rx,Math.min(cx,rx+rw));
  const y=Math.max(ry,Math.min(cy,ry+rh));
  const dx=cx-x,dy=cy-y;
  return dx*dx+dy*dy<r*r;
}

function finish(){
  if(dead)return;
  dead=true;running=false;
  tone(160,.18,"sawtooth",.055);
  if(score>best){
    best=score;
    try{localStorage.setItem("flappy_best",String(best))}catch(e){}
  }
  finalEl.textContent=String(score);
  bestEl.textContent=String(best);
  over.classList.add("show");
  draw();
}

function update(dt){
  const gravity=h*1.62;
  bird.v+=gravity*dt;
  bird.y+=bird.v*dt;
  bird.rot=Math.max(-.35,Math.min(1.15,bird.v/(h*.55)));

  pipeClock+=dt;
  if(pipeClock>=1.43){pipeClock=0;addPipe()}

  const speed=w*.39;
  pipes.forEach(p=>{
    p.x-=speed*dt;
    if(!p.scored&&p.x+p.w<bird.x){
      p.scored=true;score++;
      scoreEl.textContent=String(score);
      tone(880,.09,"square",.04);
    }
  });
  pipes=pipes.filter(p=>p.x+p.w>-20);

  const ground=h*.84;
  if(bird.y-bird.r<=0||bird.y+bird.r>=ground){finish();return}

  for(const p of pipes){
    const topHit=hitCircleRect(bird.x,bird.y,bird.r*.78,p.x,0,p.w,p.top);
    const botHit=hitCircleRect(bird.x,bird.y,bird.r*.78,p.x,p.bottom,p.w,ground-p.bottom);
    if(topHit||botHit){finish();return}
  }

  groundOffset+=speed*dt;
}

function drawBg(){
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,"#5b9ca2");g.addColorStop(.72,"#66a5a6");g.addColorStop(1,"#86c5bf");
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);

  const base=h*.69;
  ctx.fillStyle="rgba(170,220,215,.52)";
  for(let x=-10;x<w+30;x+=w*.11){
    const bh=h*(.055+Math.abs(Math.sin(x*.03))*.08);
    ctx.fillRect(x,base-bh,w*.065,bh);
  }
}

function pipePart(x,y,pw,ph,up){
  if(ph<=0)return;
  ctx.fillStyle="#6fc627";ctx.fillRect(x,y,pw,ph);
  ctx.fillStyle="#8fe83a";ctx.fillRect(x+pw*.13,y,pw*.18,ph);
  ctx.fillStyle="#479515";ctx.fillRect(x+pw*.80,y,pw*.20,ph);
  ctx.strokeStyle="#26331a";ctx.lineWidth=Math.max(2,w*.008);ctx.strokeRect(x,y,pw,ph);

  const lh=h*.035,lw=pw*1.18,lx=x-(lw-pw)/2,ly=up?y+ph-lh:y;
  ctx.fillStyle="#73ca2a";ctx.fillRect(lx,ly,lw,lh);
  ctx.fillStyle="#96e744";ctx.fillRect(lx+lw*.1,ly,lw*.15,lh);
  ctx.strokeRect(lx,ly,lw,lh);
}

function drawPipes(){
  const ground=h*.84;
  pipes.forEach(p=>{
    pipePart(p.x,0,p.w,p.top,true);
    pipePart(p.x,p.bottom,p.w,ground-p.bottom,false);
  });
}

function drawBird(){
  ctx.save();
  ctx.translate(bird.x,bird.y);
  ctx.rotate(bird.rot);
  const r=bird.r;

  ctx.fillStyle="#ffd83d";
  ctx.beginPath();ctx.ellipse(0,0,r*1.15,r*.85,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#4b3a12";ctx.lineWidth=Math.max(2,r*.14);ctx.stroke();

  ctx.fillStyle="#f7b928";
  ctx.beginPath();ctx.ellipse(-r*.45,r*.2,r*.55,r*.38,-.35,0,Math.PI*2);ctx.fill();

  ctx.fillStyle="#fff";
  ctx.beginPath();ctx.arc(r*.48,-r*.25,r*.34,0,Math.PI*2);ctx.fill();ctx.stroke();

  ctx.fillStyle="#222";
  ctx.beginPath();ctx.arc(r*.59,-r*.24,r*.12,0,Math.PI*2);ctx.fill();

  ctx.fillStyle="#ff7b27";
  ctx.beginPath();ctx.moveTo(r*.82,-r*.08);ctx.lineTo(r*1.62,r*.08);ctx.lineTo(r*.83,r*.32);ctx.closePath();ctx.fill();ctx.stroke();

  ctx.restore();
}

function drawGround(){
  const gy=h*.84;
  ctx.fillStyle="#76cf2c";ctx.fillRect(0,gy,w,h*.035);
  ctx.fillStyle="#4d9d1d";ctx.fillRect(0,gy+h*.025,w,h*.018);
  ctx.fillStyle="#aaa36b";ctx.fillRect(0,gy+h*.043,w,h-(gy+h*.043));

  ctx.fillStyle="rgba(122,112,72,.45)";
  const stripe=w*.08,offset=-(groundOffset%stripe);
  for(let x=offset-stripe;x<w+stripe;x+=stripe){
    ctx.beginPath();
    ctx.moveTo(x,gy+h*.043);
    ctx.lineTo(x+stripe*.45,gy+h*.043);
    ctx.lineTo(x+stripe*.15,h);
    ctx.lineTo(x-stripe*.30,h);
    ctx.closePath();ctx.fill();
  }
}

function draw(){
  if(!w||!h)return;
  ctx.clearRect(0,0,w,h);
  drawBg();drawPipes();drawBird();drawGround();
}

function loop(now){
  if(!running||dead)return;
  let dt=(now-last)/1000;last=now;if(dt>.04)dt=.04;
  update(dt);draw();
  if(running&&!dead)raf=requestAnimationFrame(loop);
}

startBtn.addEventListener("pointerdown",e=>{e.preventDefault();initAudio();reset()});
restart.addEventListener("pointerdown",e=>{e.preventDefault();initAudio();reset()});
canvas.addEventListener("pointerdown",e=>{e.preventDefault();flap()});
game.addEventListener("pointerdown",e=>{
  if(e.target===startBtn||e.target===restart)return;
  if(start.classList.contains("hide")&&!over.classList.contains("show")){e.preventDefault();flap()}
});
window.addEventListener("resize",resize);
resize();
draw();
})();
</script>
`,r=`flappy-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,n=Buffer.from(JSON.stringify({response_id:r,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:i,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await e.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:r}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Flappy Bird"}],unifiedResponse:{data:n},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:r})}catch(e){console.error("[FLAPPY ERROR]",e),await t.reply("✗ Gagal membuka Flappy Bird.")}},cmd:"flappy",alias:["flappybird","bird","clbgame"],type:"games",limit:!1,location:"plugins/games/flappy.js"};