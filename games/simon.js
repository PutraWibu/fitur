export default{run:async(t,e)=>{try{const o=String.raw`
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
<div class="h"><div class="t">🧠 SIMON SAYS</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;margin-bottom:9px">LEVEL <b id="lv">0</b></div>
<div id="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
<button data-i="0" style="aspect-ratio:1;border:0;border-radius:14px;background:#ef4444"></button>
<button data-i="1" style="aspect-ratio:1;border:0;border-radius:14px;background:#3b82f6"></button>
<button data-i="2" style="aspect-ratio:1;border:0;border-radius:14px;background:#22c55e"></button>
<button data-i="3" style="aspect-ratio:1;border:0;border-radius:14px;background:#eab308"></button>
</div>
<button class="btn" id="start" style="width:100%;margin-top:10px">START</button>
<div class="msg" id="msg">Ingat urutannya</div>
</div></div>
<script>
(function(){
const btns=[...document.querySelectorAll("[data-i]")],lv=document.getElementById("lv"),msg=document.getElementById("msg");let seq=[],pos=0,lock=true;
function flash(i){GameSFX.simon(i);let b=btns[i],old=b.style.opacity;b.style.opacity=".3";setTimeout(()=>b.style.opacity=old||"1",250)}
async function show(){lock=true;msg.textContent="Perhatikan...";for(const i of seq){await new Promise(r=>setTimeout(r,420));flash(i)}setTimeout(()=>{lock=false;pos=0;msg.textContent="Giliran kamu"},380)}
function next(){seq.push(Math.floor(Math.random()*4));lv.textContent=seq.length;show()}
btns.forEach(b=>b.onpointerdown=e=>{e.preventDefault();if(lock)return;let i=Number(b.dataset.i);flash(i);if(i!==seq[pos]){GameSFX.lose();lock=true;msg.textContent="❌ Salah! Level "+seq.length;return}pos++;if(pos===seq.length){GameSFX.point();lock=true;msg.textContent="✅ Benar!";setTimeout(next,650)}})
document.getElementById("start").onpointerdown=e=>{e.preventDefault();seq=[];lv.textContent=0;next()}
})()
</script>
`,a=`simon-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,n=Buffer.from(JSON.stringify({response_id:a,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await e.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:a}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Simon Says"}],unifiedResponse:{data:n},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:a})}catch(e){console.error("[SIMON ERROR]",e),await t.reply("✗ Gagal membuka Simon Says.")}},cmd:"simon",alias:["simonsays"],type:"games",limit:!1,location:"plugins/games/simon.js"};