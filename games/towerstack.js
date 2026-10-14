export default{run:async(e,t)=>{try{const n=String.raw`<style>
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

<div class="w"><div class="c"><div class="h"><div class="t">🏗️ TOWER STACK</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">SCORE <b id="sc">0</b></div>
<canvas id="cv" style="width:100%;aspect-ratio:.8;background:#0f172a;border-radius:10px;display:block"></canvas>
<button class="btn" id="drop" style="width:100%;margin-top:8px">DROP</button><div class="msg" id="msg">Tumpuk setepat mungkin</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let w,h,dpr,blocks=[],cur=null,dir=1,speed=110,score=0,run=true,last=0;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);if(!blocks.length){blocks=[{x:w*.2,y:h-28,w:w*.6,h:22}];cur={x:0,y:h-56,w:w*.6,h:22}}draw()}
function drop(){if(!run)return;let b=blocks[blocks.length-1],L=Math.max(cur.x,b.x),R=Math.min(cur.x+cur.w,b.x+b.w),nw=R-L;if(nw<=4){run=false;GameSFX.lose();msg.textContent="GAME OVER";return}blocks.push({x:L,y:cur.y,w:nw,h:22});score++;sc.textContent=score;GameSFX.point();blocks.forEach(v=>v.y+=24);cur={x:dir>0?0:w-nw,y:h-56,w:nw,h:22};speed=Math.min(260,speed+8)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#0f172a";x.fillRect(0,0,w,h);x.fillStyle="#38bdf8";blocks.forEach(b=>x.fillRect(b.x,b.y,b.w,b.h));x.fillStyle="#f59e0b";if(cur)x.fillRect(cur.x,cur.y,cur.w,cur.h)}
function loop(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run&&cur){cur.x+=dir*speed*dt;if(cur.x<=0){cur.x=0;dir=1}if(cur.x+cur.w>=w){cur.x=w-cur.w;dir=-1}}draw();requestAnimationFrame(loop)}
document.getElementById("drop").onpointerdown=e=>{e.preventDefault();GameSFX.click();drop()};window.addEventListener("resize",rs);rs();requestAnimationFrame(loop)
})()
</script>
`,a=`towerstack-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,i=Buffer.from(JSON.stringify({response_id:a,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:a}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Tower Stack"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:a})}catch(t){console.error("[TOWERSTACK ERROR]",t),await e.reply("✗ Gagal membuka Tower Stack.")}},cmd:"towerstack",alias:["stack","tower"],type:"games",limit:!1,location:"plugins/games/towerstack.js"};