import{randomUUID as e}from"crypto";export default{run:async(t,i)=>{try{const n=String.raw`
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{margin:0;padding:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif;touch-action:manipulation}
.wrap{width:100%;padding:11px;border-radius:17px;background:linear-gradient(145deg,#151515,#272727);color:#fff}
.card{max-width:330px;margin:auto;padding:13px;border-radius:15px;background:#111827;border:1px solid rgba(255,255,255,.08)}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.title{font-size:19px;font-weight:900}.brand{font-size:8px;opacity:.45;letter-spacing:.7px}
.stat{text-align:center;font-size:10px;margin-bottom:7px}.stat b{font-size:15px}
.btn{min-height:42px;border:0;border-radius:9px;background:#334155;color:white;font-weight:900;font-size:11px}
.msg{text-align:center;margin-top:7px;min-height:14px;font-size:9px;opacity:.75;font-weight:700}
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
  hit:()=>tone(180,.08,"sawtooth",.025),
  point:()=>tone(760,.06,"triangle",.02),
  lose:()=>{tone(200,.14,"sawtooth",.03);tone(115,.22,"sawtooth",.025,.1)},
  win:()=>{tone(660,.08,"triangle",.025);tone(880,.09,"triangle",.025,.09);tone(1100,.14,"triangle",.025,.18)}
 };
})();
</script>

<div class="wrap"><div class="card">
<div class="head"><div class="title">🚢 BATTLESHIP</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">HITS <b id="hits">0</b>/5 • SHOTS <b id="shots">20</b></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px"></div>
<button class="btn" id="new" style="width:100%;margin-top:8px">NEW GAME</button>
<div class="msg" id="msg">Cari 5 kapal tersembunyi</div>
</div></div>
<script>
(function(){
const g=document.getElementById("grid"),hitsEl=document.getElementById("hits"),shotsEl=document.getElementById("shots"),msg=document.getElementById("msg");
let ships=[],used=new Set(),hits=0,shots=20,over=false;
function init(){ships=[];used.clear();hits=0;shots=20;over=false;while(ships.length<5){let n=Math.floor(Math.random()*25);if(!ships.includes(n))ships.push(n)}hitsEl.textContent=0;shotsEl.textContent=20;msg.textContent="Cari 5 kapal tersembunyi";render()}
function render(){g.innerHTML="";for(let i=0;i<25;i++){let b=document.createElement("button");b.className="btn";b.style.minHeight="48px";b.textContent=used.has(i)?(ships.includes(i)?"💥":"🌊"):"?";b.disabled=used.has(i)||over;b.addEventListener("pointerdown",e=>{e.preventDefault();fire(i)});g.appendChild(b)}}
function fire(i){if(over||used.has(i))return;used.add(i);shots--;shotsEl.textContent=shots;GameSFX.click();if(ships.includes(i)){hits++;hitsEl.textContent=hits;GameSFX.point();msg.textContent="💥 KENA!"}else{GameSFX.hit();msg.textContent="🌊 MISS"}if(hits===5){over=true;GameSFX.win();msg.textContent="🎉 SEMUA KAPAL TENGGEL!"}else if(shots<=0){over=true;GameSFX.lose();msg.textContent="GAME OVER"}render()}
document.getElementById("new").onpointerdown=e=>{e.preventDefault();GameSFX.click();init()};init()
})()
</script>
`,s=e(),a=Buffer.from(JSON.stringify({response_id:s,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await i.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:s}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Battleship Mini"}],unifiedResponse:{data:a},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:s})}catch(e){console.error("[BATTLESHIP ERROR]",e),await t.reply("✗ Gagal membuka Battleship Mini.")}},cmd:"battleship",alias:["kapal","naval"],type:"games",limit:!1,location:"plugins/games/battleship.js"};