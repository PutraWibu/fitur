import{randomUUID as e}from"crypto";export default{run:async(t,a)=>{try{const n=String.raw`
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
<div class="head"><div class="title">🔢 15 PUZZLE</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">MOVES <b id="moves">0</b></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px"></div>
<button class="btn" id="shuffle" style="width:100%;margin-top:8px">SHUFFLE</button>
<div class="msg" id="msg">Urutkan angka 1 sampai 15</div>
</div></div>
<script>
(function(){
const ge=document.getElementById("grid"),me=document.getElementById("moves"),msg=document.getElementById("msg");let a=[],moves=0,done=false;
function solved(){return a.every((v,i)=>v===(i<15?i+1:0))}
function shuffle(){a=Array.from({length:16},(_,i)=>i<15?i+1:0);for(let k=0;k<200;k++){let z=a.indexOf(0),x=z%4,y=Math.floor(z/4),opts=[];if(x>0)opts.push(z-1);if(x<3)opts.push(z+1);if(y>0)opts.push(z-4);if(y<3)opts.push(z+4);let q=opts[Math.floor(Math.random()*opts.length)];[a[z],a[q]]=[a[q],a[z]]}moves=0;done=false;me.textContent=0;msg.textContent="Urutkan angka 1 sampai 15";render()}
function move(i){if(done||a[i]===0)return;let z=a.indexOf(0),x=i%4,y=Math.floor(i/4),zx=z%4,zy=Math.floor(z/4);if(Math.abs(x-zx)+Math.abs(y-zy)!==1){GameSFX.hit();return}[a[i],a[z]]=[a[z],a[i]];moves++;me.textContent=moves;GameSFX.move();if(solved()){done=true;GameSFX.win();msg.textContent="🎉 PUZZLE SELESAI!"}render()}
function render(){ge.innerHTML="";a.forEach((v,i)=>{let b=document.createElement("button");b.className="btn";b.style.aspectRatio="1";b.style.fontSize="16px";b.style.background=v?"#334155":"transparent";b.textContent=v||"";b.disabled=!v||done;b.addEventListener("pointerdown",e=>{e.preventDefault();move(i)});ge.appendChild(b)})}
document.getElementById("shuffle").onpointerdown=e=>{e.preventDefault();GameSFX.click();shuffle()};shuffle()
})()
</script>
`,i=e(),o=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await a.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"15 Puzzle"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(e){console.error("[PUZZLE15 ERROR]",e),await t.reply("✗ Gagal membuka 15 Puzzle.")}},cmd:"puzzle15",alias:["15puzzle","slidepuzzle"],type:"games",limit:!1,location:"plugins/games/puzzle15.js"};