export default{run:async(e,t)=>{try{const a=String.raw`<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;background:transparent;font-family:Arial,sans-serif;touch-action:manipulation}
.w{width:100%;padding:10px;border-radius:16px;background:linear-gradient(145deg,#111,#252525);color:#fff}
.c{max-width:330px;margin:auto;padding:14px;border-radius:16px;background:#111827;border:1px solid rgba(255,255,255,.08)}
.h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.t{font-size:19px;font-weight:900}.s{font-size:9px;opacity:.5}
.btn{border:0;border-radius:9px;padding:9px 12px;background:#334155;color:#fff;font-size:11px;font-weight:900}
.msg{text-align:center;margin-top:9px;font-size:10px;font-weight:800;min-height:16px}
</style>
<script>
(function(){
 if(window.GameSFX)return;
 let ac=null;
 function ctx(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A()}if(ac.state==="suspended")ac.resume();return ac}catch(e){return null}}
 function tone(f,d,type,vol,delay){try{const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+(delay||0);o.type=type||"square";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol||.02,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
 window.GameSFX={click:()=>tone(430,.035,"square",.012),move:()=>tone(520,.035,"square",.014),hit:()=>tone(680,.045,"square",.018),shoot:()=>tone(820,.045,"square",.018),point:()=>tone(760,.055,"square",.018),lose:()=>{tone(220,.12,"sawtooth",.035);tone(140,.22,"sawtooth",.03,.1)},win:()=>{tone(660,.08,"square",.025);tone(880,.09,"square",.025,.09);tone(1100,.12,"square",.025,.18)}};
})();
</script>

<div class="w"><div class="c"><div class="h"><div class="t">🏎️ ENDLESS RACING</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">SCORE <b id="sc">0</b></div><canvas id="cv" style="width:100%;aspect-ratio:.72;background:#334155;border-radius:10px;display:block"></canvas>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="btn" id="l">⬅ LEFT</button><button class="btn" id="r">RIGHT ➡</button></div><div class="msg" id="msg">Hindari mobil di depan</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let w,h,dpr,lane=1,enemy=[],score=0,run=true,spawn=0,last=0;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
function carX(l){return w*(.25+.25*l)}
function step(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run){spawn+=dt;if(spawn>.7){spawn=0;enemy.push({lane:Math.floor(Math.random()*3),y:-50,v:150+Math.random()*80})}enemy.forEach(a=>a.y+=a.v*dt);for(const a of enemy){if(a.lane===lane&&a.y>h-105&&a.y<h-35){run=false;GameSFX.lose();msg.textContent="GAME OVER"}}enemy=enemy.filter(a=>a.y<h+60);score+=dt*10;sc.textContent=Math.floor(score)}draw();requestAnimationFrame(step)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#475569";x.fillRect(0,0,w,h);x.strokeStyle="#e2e8f0";x.setLineDash([18,18]);x.lineWidth=3;for(let i=1;i<3;i++){x.beginPath();x.moveTo(w*i/3,0);x.lineTo(w*i/3,h);x.stroke()}x.setLineDash([]);function car(xx,yy,col){x.fillStyle=col;x.fillRect(xx-16,yy-28,32,56);x.fillStyle="#111827";x.fillRect(xx-11,yy-20,22,14)}car(carX(lane),h-55,"#22d3ee");enemy.forEach(a=>car(carX(a.lane),a.y,"#ef4444"))}
function mv(d){if(!run)return;lane=Math.max(0,Math.min(2,lane+d));GameSFX.move()}
document.getElementById("l").onpointerdown=e=>{e.preventDefault();mv(-1)};document.getElementById("r").onpointerdown=e=>{e.preventDefault();mv(1)};window.addEventListener("resize",rs);rs();requestAnimationFrame(step)
})()
</script>
`,n=`carracing-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,i=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Endless Car Racing"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[CARRACING ERROR]",t),await e.reply("✗ Gagal membuka Endless Car Racing.")}},cmd:"carracing",alias:["racing","car"],type:"games",limit:!1,location:"plugins/games/carracing.js"};