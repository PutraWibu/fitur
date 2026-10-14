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

<div class="w"><div class="c"><div class="h"><div class="t">🟢 DOODLE JUMP</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">SCORE <b id="sc">0</b></div><canvas id="cv" style="width:100%;aspect-ratio:.75;background:#f8fafc;border-radius:10px;display:block"></canvas>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="btn" id="l">⬅ LEFT</button><button class="btn" id="r">RIGHT ➡</button></div><div class="msg" id="msg">Pantul terus ke atas</div></div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let w,h,dpr,p,plats=[],score=0,run=true,last=0,move=0;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);p={x:w/2,y:h-60,vx:0,vy:-220,r:12};plats=[];for(let i=0;i<7;i++)plats.push({x:20+Math.random()*(w-80),y:h-i*(h/7),w:60,h:8})}
function step(t){let dt=Math.min(.03,(t-last||16)/1000);last=t;if(run){p.vx=move*140;p.x+=p.vx*dt;p.vy+=500*dt;p.y+=p.vy*dt;if(p.x<0)p.x=w;if(p.x>w)p.x=0;for(const pl of plats){if(p.vy>0&&p.y+p.r>pl.y&&p.y+p.r<pl.y+12&&p.x>pl.x&&p.x<pl.x+pl.w){p.vy=-280;GameSFX.hit()}}if(p.y<h*.35){let dy=h*.35-p.y;p.y=h*.35;plats.forEach(pl=>pl.y+=dy);score+=Math.floor(dy);sc.textContent=score}plats=plats.filter(pl=>pl.y<h+20);while(plats.length<7)plats.push({x:20+Math.random()*(w-80),y:-Math.random()*80,w:60,h:8});if(p.y>h+30){run=false;GameSFX.lose();msg.textContent="GAME OVER"}}draw();requestAnimationFrame(step)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#f8fafc";x.fillRect(0,0,w,h);x.fillStyle="#22c55e";plats.forEach(pl=>x.fillRect(pl.x,pl.y,pl.w,pl.h));x.fillStyle="#111827";x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);x.fill()}
document.getElementById("l").onpointerdown=e=>{e.preventDefault();move=-1;GameSFX.move()};document.getElementById("r").onpointerdown=e=>{e.preventDefault();move=1;GameSFX.move()};document.getElementById("l").onpointerup=document.getElementById("r").onpointerup=()=>move=0;window.addEventListener("resize",rs);rs();requestAnimationFrame(step)
})()
</script>
`,o=`doodlejump-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,n=Buffer.from(JSON.stringify({response_id:o,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:o}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Doodle Jump"}],unifiedResponse:{data:n},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:o})}catch(t){console.error("[DOODLEJUMP ERROR]",t),await e.reply("✗ Gagal membuka Doodle Jump.")}},cmd:"doodlejump",alias:["doodle","jump"],type:"games",limit:!1,location:"plugins/games/doodlejump.js"};