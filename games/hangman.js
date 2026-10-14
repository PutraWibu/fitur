import{randomUUID as e}from"crypto";export default{run:async(t,n)=>{try{const a=String.raw`
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
<div class="head"><div class="title">🔤 HANGMAN</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">NYAWA <b id="life">6</b></div>
<div id="word" style="text-align:center;font-size:24px;font-weight:900;letter-spacing:5px;margin:15px 0"></div>
<div id="keys" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px"></div>
<button class="btn" id="new" style="width:100%;margin-top:8px">KATA BARU</button>
<div class="msg" id="msg">Tebak kata bahasa Indonesia</div>
</div></div>
<script>
(function(){
const words=["KOMPUTER","JARINGAN","PROGRAM","BATERAI","KAMERA","SEKOLAH","MUSIK","PANTAI","LANGIT","KUCING","MOTOR","KOPI"];const we=document.getElementById("word"),ke=document.getElementById("keys"),le=document.getElementById("life"),msg=document.getElementById("msg");let word,got,life,over;
function init(){word=words[Math.floor(Math.random()*words.length)];got=new Set();life=6;over=false;le.textContent=life;msg.textContent="Tebak kata bahasa Indonesia";render()}
function render(){we.textContent=word.split("").map(c=>got.has(c)?c:"_").join(" ");ke.innerHTML="";for(let n=65;n<=90;n++){let ch=String.fromCharCode(n),b=document.createElement("button");b.className="btn";b.style.minHeight="34px";b.textContent=ch;b.disabled=over||got.has(ch);b.addEventListener("pointerdown",e=>{e.preventDefault();pick(ch)});ke.appendChild(b)}}
function pick(ch){if(over)return;got.add(ch);if(word.includes(ch)){GameSFX.point()}else{life--;le.textContent=life;GameSFX.hit()}if(word.split("").every(c=>got.has(c))){over=true;GameSFX.win();msg.textContent="🎉 BENAR: "+word}else if(life<=0){over=true;GameSFX.lose();msg.textContent="JAWABAN: "+word}render()}
document.getElementById("new").onpointerdown=e=>{e.preventDefault();GameSFX.click();init()};init()
})()
</script>
`,i=e(),o=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:a,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await n.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Hangman"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(e){console.error("[HANGMAN ERROR]",e),await t.reply("✗ Gagal membuka Hangman.")}},cmd:"hangman",alias:["tebakkata","gantungkata"],type:"games",limit:!1,location:"plugins/games/hangman.js"};