import{randomUUID as e}from"crypto";export default{run:async(t,n)=>{try{const a=String.raw`
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

<div class="wrap"><div class="card"><div class="head"><div class="title">🎲 DICE DUEL</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">KAMU <b id="u">0</b> • BOT <b id="b">0</b></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center;margin:18px 0"><div><div style="font-size:11px;opacity:.6">KAMU</div><div id="du" style="font-size:54px">⚀</div></div><div><div style="font-size:11px;opacity:.6">BOT</div><div id="db" style="font-size:54px">⚀</div></div></div>
<button class="btn" id="roll" style="width:100%">ROLL DICE</button><div class="msg" id="msg">First to 5 wins</div></div></div>
<script>
(function(){
const faces=["⚀","⚁","⚂","⚃","⚄","⚅"],du=document.getElementById("du"),db=document.getElementById("db"),ue=document.getElementById("u"),be=document.getElementById("b"),msg=document.getElementById("msg");let u=0,b=0,busy=false;
function roll(){if(busy||u>=5||b>=5)return;busy=true;GameSFX.click();let n=0,t=setInterval(()=>{du.textContent=faces[Math.floor(Math.random()*6)];db.textContent=faces[Math.floor(Math.random()*6)];if(++n>8){clearInterval(t);let a=Math.floor(Math.random()*6)+1,c=Math.floor(Math.random()*6)+1;du.textContent=faces[a-1];db.textContent=faces[c-1];if(a>c){u++;ue.textContent=u;GameSFX.point();msg.textContent="KAMU MENANG RONDE"}else if(c>a){b++;be.textContent=b;GameSFX.hit();msg.textContent="BOT MENANG RONDE"}else msg.textContent="SERI";if(u>=5){GameSFX.win();msg.textContent="🎉 KAMU MENANG DUEL"}else if(b>=5){GameSFX.lose();msg.textContent="BOT MENANG DUEL"}busy=false}},60)}
document.getElementById("roll").onpointerdown=e=>{e.preventDefault();roll()}
})()
</script>
`,i=e(),o=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await n.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Dice Duel"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(e){console.error("[DICEDUEL ERROR]",e),await t.reply("✗ Gagal membuka Dice Duel.")}},cmd:"diceduel",alias:["dice","daduduel"],type:"games",limit:!1,location:"plugins/games/diceduel.js"};