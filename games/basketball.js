import{randomUUID as t}from"crypto";export default{run:async(e,o)=>{try{const a=String.raw`
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

<div class="wrap"><div class="card"><div class="head"><div class="title">🏀 BASKETBALL</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">SCORE <b id="sc">0</b> • SHOTS <b id="sh">10</b></div><canvas id="cv" style="aspect-ratio:1"></canvas>
<div class="btns" style="grid-template-columns:1fr 1fr"><button class="btn" id="less">− POWER</button><button class="btn" id="more">+ POWER</button></div><button class="btn" id="shoot" style="width:100%;margin-top:6px">🏀 SHOOT</button>
<div class="msg" id="msg">POWER 55%</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc"),sh=document.getElementById("sh"),msg=document.getElementById("msg");let w,h,dpr,last=0,power=55,ball=null,score=0,shots=10;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
function setPower(v){power=Math.max(25,Math.min(90,power+v));msg.textContent="POWER "+power+"%";GameSFX.move()}
function shoot(){if(ball||shots<=0)return;shots--;sh.textContent=shots;let s=power*4.2;ball={x:42,y:h-38,vx:s*.72,vy:-s};GameSFX.shoot()}
function loop(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(ball){let py=ball.y;ball.vy+=520*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;let rimX=w-70,rimY=h*.42;if(py<rimY&&ball.y>=rimY&&ball.x>rimX-20&&ball.x<rimX+20&&ball.vy>0){score++;sc.textContent=score;GameSFX.point();ball=null;if(shots===0)finish()}else if(ball.y>h+30||ball.x>w+30){GameSFX.hit();ball=null;if(shots===0)finish()}}draw();requestAnimationFrame(loop)}
function finish(){msg.textContent="SELESAI • SCORE "+score;if(score>=5)GameSFX.win();else GameSFX.lose()}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#0f172a";x.fillRect(0,0,w,h);let rx=w-70,ry=h*.42;x.strokeStyle="#ef4444";x.lineWidth=4;x.beginPath();x.moveTo(rx-22,ry);x.lineTo(rx+22,ry);x.stroke();x.strokeStyle="#f8fafc";x.lineWidth=2;x.beginPath();x.moveTo(rx-18,ry+3);x.lineTo(rx-11,ry+30);x.lineTo(rx+11,ry+30);x.lineTo(rx+18,ry+3);x.stroke();x.fillStyle="#f97316";let b=ball||{x:42,y:h-38};x.beginPath();x.arc(b.x,b.y,11,0,Math.PI*2);x.fill()}
document.getElementById("less").onpointerdown=e=>{e.preventDefault();setPower(-5)};document.getElementById("more").onpointerdown=e=>{e.preventDefault();setPower(5)};document.getElementById("shoot").onpointerdown=e=>{e.preventDefault();shoot()};window.addEventListener("resize",rs);rs();requestAnimationFrame(loop)
})()
</script>
`,n=t(),i=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await o.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Basketball Shot"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[BASKETBALL ERROR]",t),await e.reply("✗ Gagal membuka Basketball Shot.")}},cmd:"basketball",alias:["basket","hoop"],type:"games",limit:!1,location:"plugins/games/basketball.js"};