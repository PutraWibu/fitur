import{randomUUID as e}from"crypto";export default{run:async(t,n)=>{try{const o=String.raw`
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
<div class="head"><div class="title">⚫ GOMOKU</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">KAMU ⚫ • BOT ⚪</div>
<div id="board" style="display:grid;grid-template-columns:repeat(9,1fr);gap:2px;background:#8b5e34;padding:4px;border-radius:10px"></div>
<button class="btn" id="new" style="width:100%;margin-top:8px">RESTART</button>
<div class="msg" id="msg">Buat 5 batu berurutan</div>
</div></div>
<script>
(function(){
const boardEl=document.getElementById("board"),msg=document.getElementById("msg");let b=Array(81).fill(0),over=false;
function idx(x,y){return y*9+x}
function win(v){for(let y=0;y<9;y++)for(let x=0;x<9;x++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let ok=true;for(let k=0;k<5;k++){let xx=x+dx*k,yy=y+dy*k;if(xx<0||xx>=9||yy<0||yy>=9||b[idx(xx,yy)]!==v){ok=false;break}}if(ok)return true}return false}
function render(){boardEl.innerHTML="";for(let i=0;i<81;i++){let c=document.createElement("button");c.style.aspectRatio="1";c.style.border="0";c.style.borderRadius="4px";c.style.background="#d7a86e";c.style.fontSize="15px";c.textContent=b[i]===1?"⚫":b[i]===2?"⚪":"";c.disabled=over||b[i]!==0;c.addEventListener("pointerdown",e=>{e.preventDefault();move(i)});boardEl.appendChild(c)}}
function move(i){if(over||b[i])return;b[i]=1;GameSFX.move();if(win(1)){over=true;GameSFX.win();msg.textContent="🎉 KAMU MENANG";render();return}let empty=b.map((v,j)=>v===0?j:-1).filter(j=>j>=0);if(!empty.length){over=true;msg.textContent="SERI";render();return}setTimeout(()=>{let pick=empty[Math.floor(Math.random()*empty.length)];b[pick]=2;GameSFX.click();if(win(2)){over=true;GameSFX.lose();msg.textContent="BOT MENANG"}render()},220);render()}
document.getElementById("new").onpointerdown=e=>{e.preventDefault();b=Array(81).fill(0);over=false;msg.textContent="Buat 5 batu berurutan";render()};render()
})()
</script>
`,i=e(),a=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await n.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Gomoku"}],unifiedResponse:{data:a},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(e){console.error("[GOMOKU ERROR]",e),await t.reply("✗ Gagal membuka Gomoku.")}},cmd:"gomoku",alias:["fiveinarow","5inarow"],type:"games",limit:!1,location:"plugins/games/gomoku.js"};