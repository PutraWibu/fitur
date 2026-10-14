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

<div class="w"><div class="c"><div class="h"><div class="t">🔪 KNIFE HIT</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">KNIFE <b id="left">8</b> • SCORE <b id="sc">0</b></div><canvas id="cv" style="width:100%;aspect-ratio:1;background:#0f172a;border-radius:10px;display:block"></canvas>
<button class="btn" id="hit" style="width:100%;margin-top:8px">THROW</button><div class="msg" id="msg">Jangan kena pisau lain</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),left=document.getElementById("left"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let w,h,dpr,ang=0,knives=[],remain=8,score=0,run=true,last=0;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
function throwK(){if(!run)return;let target=-Math.PI/2;for(const a of knives){let d=Math.atan2(Math.sin(a-target),Math.cos(a-target));if(Math.abs(d)<.22){run=false;GameSFX.lose();msg.textContent="GAME OVER";return}}knives.push(target);remain--;score++;left.textContent=remain;sc.textContent=score;GameSFX.hit();if(remain<=0){run=false;GameSFX.win();msg.textContent="🎉 LEVEL CLEAR"}}
function draw(){x.clearRect(0,0,w,h);let cx=w/2,cy=h*.45,R=w*.22;x.save();x.translate(cx,cy);x.rotate(ang);x.fillStyle="#b45309";x.beginPath();x.arc(0,0,R,0,Math.PI*2);x.fill();x.strokeStyle="#fff";x.lineWidth=4;knives.forEach(a=>{x.save();x.rotate(a-ang);x.beginPath();x.moveTo(0,-R);x.lineTo(0,-R-45);x.stroke();x.restore()});x.restore();x.strokeStyle="#f8fafc";x.lineWidth=4;x.beginPath();x.moveTo(cx,h-18);x.lineTo(cx,h-65);x.stroke()}
function loop(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run)ang+=1.8*dt;draw();requestAnimationFrame(loop)}
document.getElementById("hit").onpointerdown=e=>{e.preventDefault();GameSFX.shoot();throwK()};window.addEventListener("resize",rs);rs();requestAnimationFrame(loop)
})()
</script>
`,n=`knifehit-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,i=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Knife Hit"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[KNIFEHIT ERROR]",t),await e.reply("✗ Gagal membuka Knife Hit.")}},cmd:"knifehit",alias:["knife","knifegame"],type:"games",limit:!1,location:"plugins/games/knifehit.js"};