export default{run:async(e,t)=>{try{const a=String.raw`
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;background:transparent;font-family:Arial,sans-serif;touch-action:manipulation}
.w{width:100%;padding:10px;border-radius:16px;background:linear-gradient(145deg,#111,#262626);color:#fff}
.c{max-width:330px;margin:auto;padding:14px;border-radius:16px;background:#151b24;border:1px solid rgba(255,255,255,.08)}
.h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.t{font-size:19px;font-weight:900}.s{font-size:9px;opacity:.55}
.btn{border:0;border-radius:9px;padding:9px 14px;background:#2d3a4f;color:#fff;font-weight:900;font-size:11px}
.msg{text-align:center;font-size:11px;font-weight:800;margin-top:10px;min-height:18px}
</style>
<script>
(function(){
  if(window.GameSFX)return;
  let ac=null;
  function ctx(){
    try{
      if(!ac){
        const A=window.AudioContext||window.webkitAudioContext;
        if(!A)return null;
        ac=new A();
      }
      if(ac.state==="suspended")ac.resume();
      return ac;
    }catch(e){return null}
  }
  function tone(f,d,type,vol,delay){
    try{
      const a=ctx(); if(!a)return;
      const o=a.createOscillator(),g=a.createGain();
      const t=a.currentTime+(delay||0);
      o.type=type||"square";o.frequency.setValueAtTime(f,t);
      g.gain.setValueAtTime(vol||.025,t);
      g.gain.exponentialRampToValueAtTime(.001,t+d);
      o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02);
    }catch(e){}
  }
  window.GameSFX={
    click:()=>tone(430,.035,"square",.012),
    move:()=>tone(520,.035,"square",.014),
    hit:()=>tone(680,.045,"square",.018),
    shoot:()=>tone(820,.045,"square",.018),
    slice:()=>{tone(900,.035,"sawtooth",.018);tone(1250,.025,"square",.012,.025)},
    point:()=>tone(760,.055,"square",.018),
    bomb:()=>{tone(150,.18,"sawtooth",.045);tone(90,.25,"square",.03,.06)},
    lose:()=>{tone(220,.12,"sawtooth",.035);tone(140,.22,"sawtooth",.03,.10)},
    win:()=>{tone(660,.08,"square",.025);tone(880,.09,"square",.025,.09);tone(1100,.12,"square",.025,.18)},
    simon:(i)=>tone([330,440,550,660][i]||440,.16,"sine",.03)
  };
})();
</script>


<div class="w"><div class="c">
<div class="h"><div class="t">🟡 PAC-MAN MINI</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">SCORE <b id="score">0</b></div>
<canvas id="cv" style="width:100%;aspect-ratio:1;background:#000;border-radius:10px;display:block"></canvas>
<div style="display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,45px);gap:6px;justify-content:center;margin-top:9px">
<button class="btn" data-d="u" style="grid-column:2">⬆</button><button class="btn" data-d="l">⬅</button><button class="btn" data-d="d">⬇</button><button class="btn" data-d="r">➡</button>
</div>
<div class="msg" id="msg">Makan semua titik</div>
</div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("score"),msg=document.getElementById("msg");const N=11;let w,h,dpr,cell,p={x:1,y:1},g={x:9,y:9},dir={x:1,y:0},score=0,food=new Set(),run=true;
const walls=new Set(["0,0","1,0","2,0","3,0","4,0","5,0","6,0","7,0","8,0","9,0","10,0","0,1","10,1","0,2","2,2","3,2","5,2","7,2","8,2","10,2","0,3","5,3","10,3","0,4","2,4","3,4","7,4","8,4","10,4","0,5","5,5","10,5","0,6","2,6","3,6","7,6","8,6","10,6","0,7","5,7","10,7","0,8","2,8","3,8","5,8","7,8","8,8","10,8","0,9","10,9","0,10","1,10","2,10","3,10","4,10","5,10","6,10","7,10","8,10","9,10","10,10"]);
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);cell=w/N;draw()}
function init(){food.clear();for(let y=0;y<N;y++)for(let xx=0;xx<N;xx++){let k=xx+","+y;if(!walls.has(k)&&!(xx===1&&y===1))food.add(k)}}
function move(d){let m={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]}[d];let nx=p.x+m[0],ny=p.y+m[1],k=nx+","+ny;if(!walls.has(k)){p.x=nx;p.y=ny;if(food.delete(k)){GameSFX.point();score++;sc.textContent=score}if(food.size===0){GameSFX.win();run=false;msg.textContent="🎉 MENANG!"}}let dx=Math.sign(p.x-g.x),dy=Math.sign(p.y-g.y);let opts=[[dx,0],[0,dy],[-dx,0],[0,-dy]].filter(a=>a[0]||a[1]);for(const a of opts){let gx=g.x+a[0],gy=g.y+a[1];if(!walls.has(gx+","+gy)){g.x=gx;g.y=gy;break}}if(g.x===p.x&&g.y===p.y){GameSFX.lose();run=false;msg.textContent="👻 GAME OVER"}draw()}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#1d4ed8";walls.forEach(k=>{let [a,b]=k.split(",").map(Number);x.fillRect(a*cell,b*cell,cell,cell)});x.fillStyle="#fff";food.forEach(k=>{let [a,b]=k.split(",").map(Number);x.beginPath();x.arc((a+.5)*cell,(b+.5)*cell,2,0,Math.PI*2);x.fill()});x.fillStyle="#facc15";x.beginPath();x.arc((p.x+.5)*cell,(p.y+.5)*cell,cell*.35,.25,Math.PI*1.75);x.lineTo((p.x+.5)*cell,(p.y+.5)*cell);x.fill();x.fillStyle="#ef4444";x.beginPath();x.arc((g.x+.5)*cell,(g.y+.5)*cell,cell*.32,Math.PI,0);x.lineTo((g.x+.82)*cell,(g.y+.8)*cell);x.lineTo((g.x+.18)*cell,(g.y+.8)*cell);x.closePath();x.fill()}
document.querySelectorAll("[data-d]").forEach(b=>b.onpointerdown=e=>{e.preventDefault();if(run)move(b.dataset.d)});window.addEventListener("resize",rs);init();rs()
})()
</script>
`,n=`pacman-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,o=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Pac-Man Mini"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[PACMAN ERROR]",t),await e.reply("✗ Gagal membuka Pac-Man Mini.")}},cmd:"pacman",alias:["pacmanmini"],type:"games",limit:!1,location:"plugins/games/pacman.js"};