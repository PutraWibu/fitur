import { randomUUID } from "crypto";

export default {
  run: async (n, e) => {
    try {
      const html = String.raw`
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

<div class="wrap"><div class="card"><div class="head"><div class="title">🔀 WORD SCRAMBLE</div><div class="brand">NIXEL GAMES</div></div>
<div class="stat">SCORE <b id="sc">0</b></div><div id="scr" style="font-size:28px;font-weight:900;text-align:center;letter-spacing:5px;margin:18px 0"></div>
<input id="ans" maxlength="20" placeholder="ketik jawaban..." style="width:100%;min-height:42px;border-radius:9px;border:0;padding:0 12px;font-size:16px">
<div class="btns" style="grid-template-columns:1fr 1fr"><button class="btn" id="ok">CHECK</button><button class="btn" id="skip">SKIP</button></div><div class="msg" id="msg">Susun huruf menjadi kata</div></div></div>
<script>
(function(){
const words=["KAMERA","MOTOR","PANTAI","KUCING","SEKOLAH","MUSIK","LANGIT","BATERAI","JARINGAN","KOMPUTER"],scr=document.getElementById("scr"),ans=document.getElementById("ans"),sc=document.getElementById("sc"),msg=document.getElementById("msg");let word="",score=0;
function newWord(){word=words[Math.floor(Math.random()*words.length)];let a=word.split("");do{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}while(a.join("")===word);scr.textContent=a.join("");ans.value="";msg.textContent="Susun huruf menjadi kata"}
function check(){let v=ans.value.trim().toUpperCase();if(!v)return;if(v===word){score++;sc.textContent=score;GameSFX.win();msg.textContent="BENAR!";setTimeout(newWord,500)}else{GameSFX.hit();msg.textContent="SALAH, COBA LAGI"}}
document.getElementById("ok").onpointerdown=e=>{e.preventDefault();check()};document.getElementById("skip").onpointerdown=e=>{e.preventDefault();GameSFX.click();newWord()};ans.addEventListener("keydown",e=>{if(e.key==="Enter")check()});newWord()
})()
</script>
`;
      const responseId = randomUUID();
      const data = Buffer.from(JSON.stringify({
        response_id: responseId,
        sections: [{view_model:{
          primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:html,trusted_sources:[]},
          __typename:"GenAISingleLayoutViewModel"
        }}]
      })).toString("base64");

      await e.relayMessage(n.chat, {
        messageContextInfo:{
          deviceListMetadata:{},
          deviceListMetadataVersion:2,
          botMetadata:{messageDisclaimerText:"",botResponseId:responseId}
        },
        botForwardedMessage:{message:{richResponseMessage:{
          messageType:1,
          submessages:[{messageType:2,messageText:"Word Scramble"}],
          unifiedResponse:{data},
          contextInfo:{
            forwardingScore:1,
            isForwarded:true,
            forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},
            forwardOrigin:4
          }
        }}}
      }, {messageId:responseId});
    } catch (err) {
      console.error("[WORDSCRAMBLE ERROR]", err);
      await n.reply("✗ Gagal membuka Word Scramble.");
    }
  },
  cmd:"wordscramble",
  alias:["scramble", "acakata"],
  type:"games",
  limit:false,
  location:"plugins/games/wordscramble.js"
};
