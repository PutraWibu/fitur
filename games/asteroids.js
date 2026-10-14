import{randomUUID as t}from"crypto";export default{run:async(e,a)=>{try{const i=String.raw`
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

<div class="wrap"><div class="card"><div class="head"><div class="title">☄️ ASTEROIDS</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">SCORE <b id="sc">0</b></div><canvas id="cv" style="aspect-ratio:1"></canvas>
<div class="btns" style="grid-template-columns:1fr 1fr 1fr"><button class="btn" id="l">↶ LEFT</button><button class="btn" id="fire">🔥 FIRE</button><button class="btn" id="r">RIGHT ↷</button></div>
<div class="msg" id="msg">Hancurkan asteroid sebelum menabrak kapal</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let w,h,dpr,last=0,spawn=0,score=0,run=true,turn=0,ship,bul=[],ast=[];
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);ship={x:w/2,y:h/2,a:-Math.PI/2,r:10}}
function fire(){if(!run)return;bul.push({x:ship.x,y:ship.y,vx:Math.cos(ship.a)*260,vy:Math.sin(ship.a)*260,life:1.2});GameSFX.shoot()}
function loop(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run){ship.a+=turn*2.5*dt;ship.x+=Math.cos(ship.a)*25*dt;ship.y+=Math.sin(ship.a)*25*dt;if(ship.x<0)ship.x=w;if(ship.x>w)ship.x=0;if(ship.y<0)ship.y=h;if(ship.y>h)ship.y=0;spawn+=dt;if(spawn>.75){spawn=0;let side=Math.floor(Math.random()*4),a={r:10+Math.random()*12};if(side===0){a.x=Math.random()*w;a.y=-20}else if(side===1){a.x=w+20;a.y=Math.random()*h}else if(side===2){a.x=Math.random()*w;a.y=h+20}else{a.x=-20;a.y=Math.random()*h}let dx=ship.x-a.x,dy=ship.y-a.y,l=Math.hypot(dx,dy)||1;a.vx=dx/l*(35+Math.random()*30);a.vy=dy/l*(35+Math.random()*30);ast.push(a)}bul.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt});bul=bul.filter(b=>b.life>0);ast.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt});for(let i=ast.length-1;i>=0;i--){let a=ast[i];if(Math.hypot(a.x-ship.x,a.y-ship.y)<a.r+ship.r){run=false;GameSFX.lose();msg.textContent="GAME OVER";break}for(let j=bul.length-1;j>=0;j--)if(Math.hypot(a.x-bul[j].x,a.y-bul[j].y)<a.r+3){ast.splice(i,1);bul.splice(j,1);score+=10;sc.textContent=score;GameSFX.point();break}}}draw();requestAnimationFrame(loop)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#020617";x.fillRect(0,0,w,h);x.save();x.translate(ship.x,ship.y);x.rotate(ship.a);x.strokeStyle="#38bdf8";x.lineWidth=2;x.beginPath();x.moveTo(14,0);x.lineTo(-9,-8);x.lineTo(-5,0);x.lineTo(-9,8);x.closePath();x.stroke();x.restore();x.fillStyle="#f8fafc";bul.forEach(b=>{x.beginPath();x.arc(b.x,b.y,3,0,Math.PI*2);x.fill()});x.strokeStyle="#94a3b8";ast.forEach(a=>{x.beginPath();x.arc(a.x,a.y,a.r,0,Math.PI*2);x.stroke()})}
document.getElementById("l").onpointerdown=e=>{e.preventDefault();turn=-1;GameSFX.move()};document.getElementById("r").onpointerdown=e=>{e.preventDefault();turn=1;GameSFX.move()};document.getElementById("l").onpointerup=document.getElementById("r").onpointerup=()=>turn=0;document.getElementById("fire").onpointerdown=e=>{e.preventDefault();fire()};window.addEventListener("resize",rs);rs();requestAnimationFrame(loop)
})()
</script>
`,n=t(),s=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:i,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await a.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Asteroids"}],unifiedResponse:{data:s},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[ASTEROIDS ERROR]",t),await e.reply("✗ Gagal membuka Asteroids.")}},cmd:"asteroids",alias:["asteroid","spaceasteroids"],type:"games",limit:!1,location:"plugins/games/asteroids.js"};