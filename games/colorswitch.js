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

<div class="wrap"><div class="card"><div class="head"><div class="title">🎨 COLOR SWITCH</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">SCORE <b id="sc">0</b></div><canvas id="cv" style="aspect-ratio:.75"></canvas>
<button class="btn" id="jump" style="width:100%;margin-top:8px">JUMP</button><div class="msg" id="msg">Lewati bagian lingkaran dengan warna yang sama</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let w,h,dpr,last=0,p,obs=[],score=0,run=true;const C=["#ef4444","#38bdf8","#facc15","#22c55e"];
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);p={x:w/2,y:h*.78,vy:0,color:0};obs=[{y:h*.42,r:48,a:0},{y:h*.12,r:48,a:1.2}]}
function jump(){if(!run)return;p.vy=-245;GameSFX.jump()}
function loop(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run){p.vy+=520*dt;p.y+=p.vy*dt;obs.forEach(o=>{o.a+=1.1*dt;o.y+=25*dt});if(p.y<h*.45){let dy=h*.45-p.y;p.y=h*.45;obs.forEach(o=>o.y+=dy);score+=Math.floor(dy);sc.textContent=score}for(let i=obs.length-1;i>=0;i--){let o=obs[i],dist=Math.abs(p.y-o.y);if(dist>o.r-7&&dist<o.r+7){let ang=Math.atan2(p.y-o.y,p.x-w/2)-o.a;while(ang<0)ang+=Math.PI*2;let seg=Math.floor(ang/(Math.PI/2))%4;if(seg!==p.color){run=false;GameSFX.lose();msg.textContent="WARNA SALAH";break}}if(o.y>h+70){obs.splice(i,1);p.color=Math.floor(Math.random()*4);GameSFX.point()}}while(obs.length<2){let top=Math.min(...obs.map(o=>o.y),h);obs.push({y:top-180,r:48,a:Math.random()*6.2})}if(p.y>h+30){run=false;GameSFX.lose();msg.textContent="GAME OVER"}}draw();requestAnimationFrame(loop)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#020617";x.fillRect(0,0,w,h);x.lineWidth=9;obs.forEach(o=>{for(let i=0;i<4;i++){x.strokeStyle=C[i];x.beginPath();x.arc(w/2,o.y,o.r,o.a+i*Math.PI/2,o.a+(i+1)*Math.PI/2);x.stroke()}});x.fillStyle=C[p.color];x.beginPath();x.arc(p.x,p.y,9,0,Math.PI*2);x.fill()}
document.getElementById("jump").onpointerdown=e=>{e.preventDefault();jump()};c.onpointerdown=e=>{e.preventDefault();jump()};window.addEventListener("resize",rs);rs();requestAnimationFrame(loop)
})()
</script>
`,i=t(),n=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await o.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Color Switch"}],unifiedResponse:{data:n},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(t){console.error("[COLORSWITCH ERROR]",t),await e.reply("✗ Gagal membuka Color Switch.")}},cmd:"colorswitch",alias:["color","switchcolor"],type:"games",limit:!1,location:"plugins/games/colorswitch.js"};