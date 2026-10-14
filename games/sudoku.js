export default{run:async(e,t)=>{try{const n=String.raw`
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
<div class="h"><div class="t">🔢 SUDOKU MINI</div><div class="s">Nixel Games</div></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px"></div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px">
<button class="btn" data-n="1">1</button><button class="btn" data-n="2">2</button><button class="btn" data-n="3">3</button><button class="btn" data-n="4">4</button>
</div>
<button class="btn" id="new" style="width:100%;margin-top:8px">NEW</button>
<div class="msg" id="msg">Pilih kotak lalu angka</div>
</div></div>
<script>
(function(){
const puzzles=[
[[1,0,0,4],[0,4,1,0],[0,1,4,0],[4,0,0,1]],
[[0,2,0,4],[3,0,1,0],[0,1,0,3],[4,0,2,0]]
];const sols=[
[[1,3,2,4],[2,4,1,3],[3,1,4,2],[4,2,3,1]],
[[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]]
];let p=0,b=[],sel=-1;const g=document.getElementById("grid"),msg=document.getElementById("msg");
function setup(){p=Math.floor(Math.random()*puzzles.length);b=puzzles[p].flat();sel=-1;msg.textContent="Pilih kotak lalu angka";render()}
function render(){g.innerHTML="";b.forEach((v,i)=>{let fixed=puzzles[p].flat()[i]!==0;let x=document.createElement("button");x.style="aspect-ratio:1;border:2px solid "+(sel===i?"#22d3ee":"#334155")+";border-radius:5px;background:"+(fixed?"#374151":"#111827")+";color:#fff;font-size:22px;font-weight:900";x.textContent=v||"";x.onpointerdown=e=>{e.preventDefault();if(!fixed){sel=i;render()}};g.appendChild(x)})}
document.querySelectorAll("[data-n]").forEach(x=>x.onpointerdown=e=>{e.preventDefault();if(sel<0)return;GameSFX.click();b[sel]=Number(x.dataset.n);render();if(b.every((v,i)=>v===sols[p].flat()[i])){GameSFX.win();msg.textContent="🎉 Selesai!"}})
document.getElementById("new").onpointerdown=e=>{e.preventDefault();setup()};setup()
})()
</script>
`,a=`sudoku-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,o=Buffer.from(JSON.stringify({response_id:a,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:a}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Sudoku Mini"}],unifiedResponse:{data:o},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:a})}catch(t){console.error("[SUDOKU ERROR]",t),await e.reply("✗ Gagal membuka Sudoku Mini.")}},cmd:"sudoku",alias:["sudokumini"],type:"games",limit:!1,location:"plugins/games/sudoku.js"};