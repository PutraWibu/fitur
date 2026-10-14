export default{run:async(e,t)=>{try{const o=String.raw`
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
<div class="h"><div class="t">⚡ REACTION TEST</div><div class="s">Nixel Games</div></div>
<button id="box" style="width:100%;aspect-ratio:1.5;border:0;border-radius:12px;background:#334155;color:#fff;font-size:20px;font-weight:900">START</button>
<div class="msg" id="msg">Tekan START lalu tunggu hijau</div>
</div></div>
<script>
(function(){
const box=document.getElementById("box"),msg=document.getElementById("msg");let state=0,timer=null,start=0,best=99999;
box.onpointerdown=e=>{e.preventDefault();if(state===0){GameSFX.click();state=1;box.textContent="TUNGGU...";box.style.background="#ef4444";msg.textContent="Jangan tekan dulu";timer=setTimeout(()=>{state=2;start=performance.now();box.textContent="TEKAN!";box.style.background="#22c55e"},900+Math.random()*2200)}else if(state===1){clearTimeout(timer);state=0;box.textContent="START";box.style.background="#334155";GameSFX.lose();msg.textContent="❌ Terlalu cepat!"}else{GameSFX.point();let ms=Math.round(performance.now()-start);best=Math.min(best,ms);state=0;box.textContent="START";box.style.background="#334155";msg.textContent="⚡ "+ms+" ms • BEST "+best+" ms"}}
})()
</script>
`,a=`reaction-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,n=Buffer.from(JSON.stringify({response_id:a,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:a}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Reaction Test"}],unifiedResponse:{data:n},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:a})}catch(t){console.error("[REACTION ERROR]",t),await e.reply("✗ Gagal membuka Reaction Test.")}},cmd:"reaction",alias:["reactiontest","reflex"],type:"games",limit:!1,location:"plugins/games/reaction.js"};