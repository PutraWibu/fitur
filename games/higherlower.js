import{randomUUID as e}from"crypto";export default{run:async(t,n)=>{try{const o=String.raw`
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif;touch-action:manipulation}
.wrap{width:100%;padding:11px;border-radius:17px;background:linear-gradient(145deg,#151515,#272727);color:#fff}
.card{max-width:330px;margin:auto;padding:13px;border-radius:15px;background:#111827;border:1px solid rgba(255,255,255,.08)}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.title{font-size:19px;font-weight:900}.brand{font-size:8px;opacity:.45;letter-spacing:.7px}
.stat{text-align:center;font-size:10px;margin-bottom:7px}.stat b{font-size:15px}
.btns{display:grid;gap:6px;margin-top:8px}.btn{min-height:42px;border:0;border-radius:9px;background:#334155;color:white;font-weight:900;font-size:11px}
.msg{text-align:center;margin-top:7px;min-height:14px;font-size:9px;opacity:.75;font-weight:700}
canvas{display:block;width:100%;border-radius:10px;background:#020617}
</style>
<script>
(function(){
 if(window.GameSFX)return;
 let ac=null;
 function ctx(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A()}if(ac.state==="suspended")ac.resume();return ac}catch(e){return null}}
 function tone(f,d,type,vol,delay){try{const a=ctx();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+(delay||0);o.type=type||"square";o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol||.02,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
 window.GameSFX={
  click:()=>tone(430,.04,"square",.012),
  move:()=>tone(510,.035,"square",.012),
  jump:()=>tone(720,.06,"square",.018),
  hit:()=>tone(180,.08,"sawtooth",.025),
  point:()=>tone(760,.06,"triangle",.02),
  lose:()=>{tone(200,.14,"sawtooth",.03);tone(115,.22,"sawtooth",.025,.1)},
  win:()=>{tone(660,.08,"triangle",.025);tone(880,.09,"triangle",.025,.09);tone(1100,.14,"triangle",.025,.18)}
 };
})();
</script>

<div class="wrap"><div class="card"><div class="head"><div class="title">⬆️⬇️ HIGHER / LOWER</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">STREAK <b id="st">0</b></div><div id="num" style="font-size:56px;font-weight:900;text-align:center;margin:20px 0">50</div>
<div class="btns" style="grid-template-columns:1fr 1fr"><button class="btn" id="hi">HIGHER</button><button class="btn" id="lo">LOWER</button></div>
<div class="msg" id="msg">Tebak angka berikutnya</div></div></div>
<script>
(function(){
const num=document.getElementById("num"),st=document.getElementById("st"),msg=document.getElementById("msg");let cur=50,score=0,over=false;
function pick(high){if(over)return;let next=1+Math.floor(Math.random()*99),ok=high?next>cur:next<cur;num.textContent=next;if(next===cur){msg.textContent="SAMA • ULANG";GameSFX.click();cur=next;return}if(ok){score++;st.textContent=score;GameSFX.point();msg.textContent="BENAR!"}else{over=true;GameSFX.lose();msg.textContent="SALAH • STREAK "+score;setTimeout(()=>{score=0;st.textContent=0;cur=50;num.textContent=50;over=false;msg.textContent="Tebak angka berikutnya"},900);return}cur=next}
document.getElementById("hi").onpointerdown=e=>{e.preventDefault();pick(true)};document.getElementById("lo").onpointerdown=e=>{e.preventDefault();pick(false)}
})()
</script>
`,a=e(),i=Buffer.from(JSON.stringify({response_id:a,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await n.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:a}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Higher or Lower"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:a})}catch(e){console.error("[HIGHERLOWER ERROR]",e),await t.reply("✗ Gagal membuka Higher or Lower.")}},cmd:"higherlower",alias:["highlow","tebakangka"],type:"games",limit:!1,location:"plugins/games/higherlower.js"};