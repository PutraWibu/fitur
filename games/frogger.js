import{randomUUID as t}from"crypto";export default{run:async(e,a)=>{try{const r=String.raw`
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

<div class="wrap"><div class="card"><div class="head"><div class="title">🐸 FROGGER</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">LEVEL <b id="lv">1</b></div><canvas id="cv" style="aspect-ratio:.9"></canvas>
<div class="btns" style="grid-template-columns:repeat(3,1fr)"><span></span><button class="btn" id="u">⬆</button><span></span><button class="btn" id="l">⬅</button><button class="btn" id="d">⬇</button><button class="btn" id="r">➡</button></div>
<div class="msg" id="msg">Seberangi jalan tanpa tertabrak</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),lv=document.getElementById("lv"),msg=document.getElementById("msg");let w,h,dpr,p,cars=[],level=1,run=true,last=0;
function reset(){p={col:2,row:5};cars=[];for(let r=1;r<=4;r++)for(let i=0;i<2;i++)cars.push({row:r,x:Math.random()*w,v:(r%2?1:-1)*(55+r*12),ww:45});run=true}
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);reset()}
function move(dx,dy){if(!run)return;p.col=Math.max(0,Math.min(4,p.col+dx));p.row=Math.max(0,Math.min(5,p.row+dy));GameSFX.jump();if(p.row===0){level++;lv.textContent=level;GameSFX.win();msg.textContent="LEVEL CLEAR!";setTimeout(()=>{msg.textContent="Seberangi jalan tanpa tertabrak";reset()},600)}}
function loop(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run){cars.forEach(a=>{a.x+=a.v*dt;if(a.v>0&&a.x>w+50)a.x=-50;if(a.v<0&&a.x<-50)a.x=w+50});let cw=w/5,rh=h/6,px=(p.col+.5)*cw,py=(p.row+.5)*rh;for(const a of cars){let ay=(a.row+.5)*rh;if(Math.abs(py-ay)<rh*.32&&Math.abs(px-a.x)<a.ww*.55){run=false;GameSFX.lose();msg.textContent="TERTABRAK!";setTimeout(()=>{msg.textContent="Coba lagi";reset()},700);break}}}draw();requestAnimationFrame(loop)}
function draw(){x.clearRect(0,0,w,h);let rh=h/6;x.fillStyle="#14532d";x.fillRect(0,0,w,rh);x.fillRect(0,5*rh,w,rh);x.fillStyle="#334155";x.fillRect(0,rh,w,4*rh);x.strokeStyle="#e2e8f0";x.setLineDash([12,12]);for(let r=2;r<=4;r++){x.beginPath();x.moveTo(0,r*rh);x.lineTo(w,r*rh);x.stroke()}x.setLineDash([]);x.font="24px Arial";x.textAlign="center";x.textBaseline="middle";cars.forEach(a=>x.fillText("🚗",a.x,(a.row+.5)*rh));x.fillText("🐸",(p.col+.5)*(w/5),(p.row+.5)*rh)}
["u","d","l","r"].forEach(id=>document.getElementById(id).onpointerdown=e=>{e.preventDefault();if(id==="u")move(0,-1);if(id==="d")move(0,1);if(id==="l")move(-1,0);if(id==="r")move(1,0)});window.addEventListener("resize",rs);rs();requestAnimationFrame(loop)
})()
</script>
`,n=t(),i=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:r,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await a.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Frogger Mini"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[FROGGER ERROR]",t),await e.reply("✗ Gagal membuka Frogger Mini.")}},cmd:"frogger",alias:["frog","crossfrog"],type:"games",limit:!1,location:"plugins/games/frogger.js"};