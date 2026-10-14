export default{run:async(e,t)=>{try{const a=String.raw`
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
<div class="h"><div class="t">🧱 BREAKOUT</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px">SCORE <b id="score">0</b></div>
<canvas id="cv" style="width:100%;aspect-ratio:1.35;background:#0c1220;border-radius:10px;display:block"></canvas>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px"><button class="btn" id="l">⬅ LEFT</button><button class="btn" id="r">RIGHT ➡</button></div>
<div class="msg" id="msg">Hancurkan semua brick</div>
</div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),scoreEl=document.getElementById("score"),msg=document.getElementById("msg");let w,h,dpr,paddle,ball,bricks=[],score=0,run=true;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);start()}
function start(){paddle={x:w/2-35,y:h-22,w:70,h:8};ball={x:w/2,y:h-38,r:6,vx:w*.35,vy:-h*.45};bricks=[];for(let rr=0;rr<5;rr++)for(let cc=0;cc<7;cc++)bricks.push({x:8+cc*((w-16)/7),y:12+rr*18,w:(w-16)/7-4,h:12,on:true});score=0;scoreEl.textContent=0;run=true}
function step(){if(!run)return;let dt=.016;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;if(ball.x<6||ball.x>w-6){ball.vx*=-1;GameSFX.hit();}if(ball.y<6){ball.vy*=-1;GameSFX.hit();}if(ball.y>h){GameSFX.lose();run=false;msg.textContent="GAME OVER";draw();return}if(ball.y+ball.r>paddle.y&&ball.x>paddle.x&&ball.x<paddle.x+paddle.w&&ball.vy>0){ball.vy*=-1;GameSFX.hit();}for(const b of bricks){if(b.on&&ball.x>b.x&&ball.x<b.x+b.w&&ball.y>b.y&&ball.y<b.y+b.h){b.on=false;ball.vy*=-1;GameSFX.point();score++;scoreEl.textContent=score;break}}if(bricks.every(b=>!b.on)){GameSFX.win();run=false;msg.textContent="🎉 MENANG!";draw();return}draw();requestAnimationFrame(step)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#60a5fa";bricks.forEach(b=>{if(b.on)x.fillRect(b.x,b.y,b.w,b.h)});x.fillStyle="#fff";x.fillRect(paddle.x,paddle.y,paddle.w,paddle.h);x.beginPath();x.arc(ball.x,ball.y,ball.r,0,Math.PI*2);x.fill()}
function mv(d){paddle.x=Math.max(0,Math.min(w-paddle.w,paddle.x+d*28))}
document.getElementById("l").onpointerdown=e=>{e.preventDefault();mv(-1)};document.getElementById("r").onpointerdown=e=>{e.preventDefault();mv(1)};window.addEventListener("resize",rs);rs();requestAnimationFrame(step)
})()
</script>
`,n=`breakout-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,r=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Breakout"}],unifiedResponse:{data:r},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[BREAKOUT ERROR]",t),await e.reply("✗ Gagal membuka Breakout.")}},cmd:"breakout",alias:["brick","brickbreaker"],type:"games",limit:!1,location:"plugins/games/breakout.js"};