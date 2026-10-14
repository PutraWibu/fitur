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
<div class="h"><div class="t">🔨 WHACK-A-MOLE</div><div class="s">Nixel Games</div></div>
<div style="display:flex;justify-content:space-between;margin-bottom:10px"><div>SCORE <b id="score">0</b></div><div>TIME <b id="time">20</b></div></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div>
<button class="btn" id="start" style="width:100%;margin-top:10px">START</button>
<div class="msg" id="msg">Pukul mole secepat mungkin</div>
</div></div>
<script>
(function(){
const g=document.getElementById("grid"),sc=document.getElementById("score"),tm=document.getElementById("time"),msg=document.getElementById("msg");let active=-1,score=0,time=20,timer=null,pop=null,run=false;
function render(){g.innerHTML="";for(let i=0;i<9;i++){let b=document.createElement("button");b.style="aspect-ratio:1;border:0;border-radius:50%;background:#3f3f46;font-size:28px";b.textContent=i===active?"🐹":"🕳️";b.onpointerdown=e=>{e.preventDefault();if(run&&i===active){GameSFX.hit();score++;sc.textContent=score;active=-1;render()}};g.appendChild(b)}}
function start(){clearInterval(timer);clearInterval(pop);score=0;time=20;run=true;sc.textContent=0;tm.textContent=20;msg.textContent="GO!";pop=setInterval(()=>{active=Math.floor(Math.random()*9);render()},520);timer=setInterval(()=>{time--;tm.textContent=time;if(time<=0){GameSFX.win();run=false;clearInterval(timer);clearInterval(pop);active=-1;render();msg.textContent="Selesai! Score "+score}},1000)}
document.getElementById("start").onpointerdown=e=>{e.preventDefault();start()};render()
})()
</script>
`,a=`whackamole-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,o=Buffer.from(JSON.stringify({response_id:a,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:a}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Whack-a-Mole"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:a})}catch(t){console.error("[WHACKAMOLE ERROR]",t),await e.reply("✗ Gagal membuka Whack-a-Mole.")}},cmd:"whackamole",alias:["mole","whack"],type:"games",limit:!1,location:"plugins/games/whackamole.js"};