import{randomUUID as e}from"crypto";export default{run:async(t,n)=>{try{const a=String.raw`
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif;touch-action:manipulation}
.wrap{width:100%;padding:11px;border-radius:17px;background:linear-gradient(145deg,#151515,#272727);color:#fff}
.card{max-width:330px;margin:auto;padding:13px;border-radius:15px;background:#111827;border:1px solid rgba(255,255,255,.08)}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.title{font-size:19px;font-weight:900}.brand{font-size:8px;opacity:.45;letter-spacing:.7px}
.stat{text-align:center;font-size:10px;margin-bottom:7px}.stat b{font-size:15px}
.btns{display:grid;gap:6px;margin-top:8px}.btn{min-height:42px;border:0;border-radius:9px;background:#334155;color:white;font-weight:900;font-size:11px}
.msg{text-align:center;margin-top:7px;min-height:14px;font-size:9px;opacity:.75;font-weight:700}
canvas{display:block;width:100%;border-radius:10px;background:#020617}
</style>
<script>
(function(){
 if(window.GameSFX)return;
 let ac=null;
 function ctx(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A()}if(ac.state==="suspended")ac.resume();return ac}catch(e){return null}}
 function tone(f,d,type,vol,delay){try{const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+(delay||0);o.type=type||"square";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol||.02,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
 window.GameSFX={
  click:()=>tone(430,.04,"square",.012),
  move:()=>tone(510,.035,"square",.012),
  jump:()=>tone(720,.06,"square",.018),
  shoot:()=>tone(960,.045,"square",.018),
  hit:()=>tone(180,.08,"sawtooth",.025),
  point:()=>tone(760,.06,"triangle",.02),
  lose:()=>{tone(200,.14,"sawtooth",.03);tone(115,.22,"sawtooth",.025,.1)},
  win:()=>{tone(660,.08,"triangle",.025);tone(880,.09,"triangle",.025,.09);tone(1100,.14,"triangle",.025,.18)}
 };
})();
</script>

<div class="wrap"><div class="card"><div class="head"><div class="title">🧭 MAZE ESCAPE</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">MOVES <b id="mv">0</b></div><canvas id="cv" style="aspect-ratio:1"></canvas>
<div class="btns" style="grid-template-columns:repeat(3,1fr)"><span></span><button class="btn" id="u">⬆</button><span></span><button class="btn" id="l">⬅</button><button class="btn" id="d">⬇</button><button class="btn" id="r">➡</button></div>
<div class="msg" id="msg">Cari jalan menuju kotak hijau</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),mv=document.getElementById("mv"),msg=document.getElementById("msg");
const M=["111111111","100000001","101111101","101000101","101010101","100010101","111010101","100000001","111111101"],N=9;let w,h,dpr,p={x:1,y:1},moves=0,done=false;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);draw()}
function move(dx,dy){if(done)return;let nx=p.x+dx,ny=p.y+dy;if(nx<0||ny<0||nx>=N||ny>=N||M[ny][nx]==="1"){GameSFX.hit();return}p={x:nx,y:ny};moves++;mv.textContent=moves;GameSFX.move();if(p.x===7&&p.y===8){done=true;GameSFX.win();msg.textContent="🎉 BERHASIL KELUAR!"}draw()}
function draw(){let s=w/N;x.clearRect(0,0,w,h);for(let y=0;y<N;y++)for(let q=0;q<N;q++){x.fillStyle=M[y][q]==="1"?"#334155":"#e2e8f0";x.fillRect(q*s,y*s,s,s)}x.fillStyle="#22c55e";x.fillRect(7*s+3,8*s+3,s-6,s-6);x.fillStyle="#0ea5e9";x.beginPath();x.arc((p.x+.5)*s,(p.y+.5)*s,s*.28,0,Math.PI*2);x.fill()}
["u","d","l","r"].forEach(id=>document.getElementById(id).onpointerdown=e=>{e.preventDefault();if(id==="u")move(0,-1);if(id==="d")move(0,1);if(id==="l")move(-1,0);if(id==="r")move(1,0)});window.addEventListener("resize",rs);rs()
})()
</script>
`,i=e(),o=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await n.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Maze Escape"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(e){console.error("[MAZEESCAPE ERROR]",e),await t.reply("✗ Gagal membuka Maze Escape.")}},cmd:"mazeescape",alias:["maze","labirin"],type:"games",limit:!1,location:"plugins/games/mazeescape.js"};