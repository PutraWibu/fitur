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
<div class="h"><div class="t">🏓 PONG</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:8px"><b id="sc">0 : 0</b></div>
<canvas id="cv" style="width:100%;aspect-ratio:1.7;background:#0b1220;border-radius:10px;display:block"></canvas>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px"><button class="btn" id="up">⬆ UP</button><button class="btn" id="down">⬇ DOWN</button></div>
<div class="msg">Kamu kiri • Bot kanan</div>
</div></div>
<script>
(function(){
const c=document.getElementById("cv"),x=c.getContext("2d"),sc=document.getElementById("sc");let w,h,dpr,py,by,bx,ball,vx,vy,us=0,bs=0,run=true;
function rs(){let r=c.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);c.width=w*dpr;c.height=h*dpr;x.setTransform(dpr,0,0,dpr,0,0);py=by=h/2-30;resetBall()}
function resetBall(){ball={x:w/2,y:h/2,r:6};vx=(Math.random()>.5?1:-1)*w*.45;vy=(Math.random()-.5)*h*.5}
function step(t){if(!run)return;let dt=.016;by+=(ball.y-(by+30))*2.4*dt;ball.x+=vx*dt;ball.y+=vy*dt;if(ball.y<6||ball.y>h-6){vy*=-1;GameSFX.hit();}if(ball.x<26&&ball.y>py&&ball.y<py+60&&vx<0){vx*=-1.04;GameSFX.hit();}if(ball.x>w-26&&ball.y>by&&ball.y<by+60&&vx>0){vx*=-1.04;GameSFX.hit();}if(ball.x<0){GameSFX.lose();bs++;sc.textContent=us+" : "+bs;resetBall()}if(ball.x>w){GameSFX.point();us++;sc.textContent=us+" : "+bs;resetBall()}draw();requestAnimationFrame(step)}
function draw(){x.clearRect(0,0,w,h);x.fillStyle="#fff";x.fillRect(12,py,8,60);x.fillRect(w-20,by,8,60);x.beginPath();x.arc(ball.x,ball.y,6,0,Math.PI*2);x.fill();x.globalAlpha=.2;for(let y=0;y<h;y+=18)x.fillRect(w/2-1,y,2,9);x.globalAlpha=1}
function move(d){py=Math.max(0,Math.min(h-60,py+d*28))}
document.getElementById("up").onpointerdown=e=>{e.preventDefault();move(-1)};document.getElementById("down").onpointerdown=e=>{e.preventDefault();move(1)};window.addEventListener("resize",rs);rs();requestAnimationFrame(step)
})()
</script>
`,n=`pong-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,i=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Pong"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[PONG ERROR]",t),await e.reply("✗ Gagal membuka Pong.")}},cmd:"pong",alias:["pingpong"],type:"games",limit:!1,location:"plugins/games/pong.js"};