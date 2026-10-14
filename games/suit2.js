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
<div class="h"><div class="t">✊✋✌️ SUIT</div><div class="s">Nixel Games</div></div>
<div style="text-align:center;font-size:11px;margin-bottom:10px">KAMU <b id="u">0</b> • BOT <b id="b">0</b> • SERI <b id="d">0</b></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
<button class="btn" data-v="0" style="font-size:24px">✊</button><button class="btn" data-v="1" style="font-size:24px">✋</button><button class="btn" data-v="2" style="font-size:24px">✌️</button>
</div>
<div class="msg" id="msg">Pilih batu, kertas, atau gunting</div>
</div></div>
<script>
(function(){
let u=0,b=0,d=0;const ue=document.getElementById("u"),be=document.getElementById("b"),de=document.getElementById("d"),msg=document.getElementById("msg"),names=["Batu ✊","Kertas ✋","Gunting ✌️"];
document.querySelectorAll("[data-v]").forEach(x=>x.onpointerdown=e=>{e.preventDefault();let a=Number(x.dataset.v),z=Math.floor(Math.random()*3);GameSFX.click();if(a===z){d++;msg.textContent="🤝 Seri! Bot: "+names[z]}else if((a-z+3)%3===1){GameSFX.win();u++;msg.textContent="🎉 Menang! Bot: "+names[z]}else{GameSFX.lose();b++;msg.textContent="🤖 Kalah! Bot: "+names[z]}ue.textContent=u;be.textContent=b;de.textContent=d})
})()
</script>
`,n=`suit-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,o=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Rock Paper Scissors"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[SUIT ERROR]",t),await e.reply("✗ Gagal membuka Rock Paper Scissors.")}},cmd:"suit2",alias:["rps","rockpaperscissors"],type:"games",limit:!1,location:"plugins/games/suit2.js"};