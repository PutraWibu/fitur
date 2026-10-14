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
<div class="h"><div class="t">🧠 MEMORY</div><div class="s">Nixel Games</div></div>
<div style="display:flex;justify-content:space-between;margin-bottom:10px"><div>MOVE <b id="mv">0</b></div><button class="btn" id="new">NEW</button></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px"></div>
<div class="msg" id="msg">Cari semua pasangan</div>
</div></div>
<script>
(function(){
const icons=["🍎","🍋","💎","🔔","⭐","🍇","🍒","⚽"];let deck=[],first=-1,lock=false,moves=0,done=0;
const g=document.getElementById("grid"),mv=document.getElementById("mv"),msg=document.getElementById("msg");
function setup(){deck=[...icons,...icons].sort(()=>Math.random()-.5).map(v=>({v,open:false,done:false}));first=-1;lock=false;moves=0;done=0;mv.textContent=0;msg.textContent="Cari semua pasangan";render()}
function render(){g.innerHTML="";deck.forEach((x,i)=>{let b=document.createElement("button");b.style="aspect-ratio:1;border:0;border-radius:9px;background:"+(x.done?"#294b3a":x.open?"#fff":"#334155")+";font-size:24px";b.textContent=(x.open||x.done)?x.v:"❓";b.onpointerdown=e=>{e.preventDefault();pick(i)};g.appendChild(b)})}
function pick(i){if(lock||deck[i].open||deck[i].done)return;GameSFX.click();deck[i].open=true;render();if(first<0){first=i;return}moves++;mv.textContent=moves;if(deck[first].v===deck[i].v){deck[first].done=deck[i].done=true;GameSFX.point();done+=2;first=-1;if(done===deck.length){GameSFX.win();msg.textContent="🎉 Selesai!"};render()}else{GameSFX.lose();lock=true;let a=first;first=-1;setTimeout(()=>{deck[a].open=false;deck[i].open=false;lock=false;render()},550)}}
document.getElementById("new").onpointerdown=e=>{e.preventDefault();setup()};setup()
})()
</script>
`,o=`memory-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,i=Buffer.from(JSON.stringify({response_id:o,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:o}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Memory Card"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:o})}catch(t){console.error("[MEMORY ERROR]",t),await e.reply("✗ Gagal membuka Memory Card.")}},cmd:"memory",alias:["memorycard","match"],type:"games",limit:!1,location:"plugins/games/memory.js"};