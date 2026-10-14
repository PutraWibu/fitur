export default{run:async(e,t)=>{try{const n=String.raw`
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
<div class="h"><div class="t">🚀 SPACE SHOOTER</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">SCORE <b id="score">0</b></div>
<canvas id="cv" style="width:100%;aspect-ratio:1;background:#020617;border-radius:10px;display:block"></canvas>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:9px"><button class="btn" id="l">⬅</button><button class="btn" id="fire">🔥 FIRE</button><button class="btn" id="r">➡</button></div>
<div class="msg" id="msg">Hancurkan musuh</div>
</div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("score"),msg=document.getElementById("msg");let w,h,dpr,ship,bul=[],en=[],score=0,spawn=0,run=true;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);ship={x:w/2,y:h-28};}
function fire(){GameSFX.shoot();bul.push({x:ship.x,y:ship.y-8})}
function step(){if(!run)return;spawn+=.016;if(spawn>.7){spawn=0;en.push({x:15+Math.random()*(w-30),y:-12,v:60+Math.random()*45})}bul.forEach(b=>b.y-=180*.016);en.forEach(a=>a.y+=a.v*.016);for(let i=en.length-1;i>=0;i--){if(en[i].y>h){GameSFX.lose();run=false;msg.textContent="GAME OVER";break}for(let j=bul.length-1;j>=0;j--){let dx=en[i].x-bul[j].x,dy=en[i].y-bul[j].y;if(dx*dx+dy*dy<180){en.splice(i,1);bul.splice(j,1);GameSFX.point();score++;sc.textContent=score;break}}}bul=bul.filter(b=>b.y>-10);draw();if(run)requestAnimationFrame(step)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#fff";for(let i=0;i<30;i++)x.fillRect((i*53)%w,(i*97+score*3)%h,1,1);x.fillStyle="#22d3ee";x.beginPath();x.moveTo(ship.x,ship.y-12);x.lineTo(ship.x-9,ship.y+10);x.lineTo(ship.x+9,ship.y+10);x.closePath();x.fill();x.fillStyle="#facc15";bul.forEach(b=>x.fillRect(b.x-2,b.y,4,8));x.fillStyle="#ef4444";en.forEach(a=>{x.beginPath();x.arc(a.x,a.y,8,0,Math.PI*2);x.fill()})}
function mv(d){ship.x=Math.max(10,Math.min(w-10,ship.x+d*24))}
document.getElementById("l").onpointerdown=e=>{e.preventDefault();mv(-1)};document.getElementById("r").onpointerdown=e=>{e.preventDefault();mv(1)};document.getElementById("fire").onpointerdown=e=>{e.preventDefault();fire()};window.addEventListener("resize",rs);rs();requestAnimationFrame(step)
})()
</script>
`,i=`spaceshooter-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,a=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Space Shooter"}],unifiedResponse:{data:a},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(t){console.error("[SPACESHOOTER ERROR]",t),await e.reply("✗ Gagal membuka Space Shooter.")}},cmd:"spaceshooter",alias:["shooter","space"],type:"games",limit:!1,location:"plugins/games/spaceshooter.js"};