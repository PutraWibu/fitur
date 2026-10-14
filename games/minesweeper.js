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
<div class="h"><div class="t">💣 MINESWEEPER</div><div class="s">Nixel Games</div></div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div>💣 <span id="mines">8</span></div><button class="btn" id="new">NEW</button></div>
<div id="grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px"></div>
<div class="msg" id="msg">Tap kotak untuk membuka</div>
</div></div>
<script>
(function(){
const N=6,M=8,g=document.getElementById("grid"),msg=document.getElementById("msg");
let cells=[],opened=0,over=false;
function setup(){
  cells=Array.from({length:N*N},()=>({m:false,o:false,n:0}));opened=0;over=false;msg.textContent="Tap kotak untuk membuka";
  let placed=0;while(placed<M){let i=Math.floor(Math.random()*cells.length);if(!cells[i].m){cells[i].m=true;placed++}}
  for(let i=0;i<cells.length;i++){let r=Math.floor(i/N),c=i%N,n=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){let rr=r+dr,cc=c+dc;if(rr>=0&&rr<N&&cc>=0&&cc<N&&cells[rr*N+cc].m)n++}cells[i].n=n}
  render()
}
function render(){g.innerHTML="";cells.forEach((x,i)=>{let b=document.createElement("button");b.style="aspect-ratio:1;border:0;border-radius:6px;background:"+(x.o?"#d8dee9":"#354052")+";font-weight:900;font-size:16px;color:#111";b.textContent=x.o?(x.m?"💣":(x.n||"")):"";b.onpointerdown=e=>{e.preventDefault();open(i)};g.appendChild(b)})}
function open(i){if(over||cells[i].o)return;cells[i].o=true;if(cells[i].m){GameSFX.bomb();over=true;cells.forEach(x=>{if(x.m)x.o=true});msg.textContent="💥 GAME OVER";render();return}GameSFX.click();opened++;if(cells[i].n===0){let r=Math.floor(i/N),c=i%N;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){let rr=r+dr,cc=c+dc,j=rr*N+cc;if(rr>=0&&rr<N&&cc>=0&&cc<N&&!cells[j].o&&!cells[j].m)open(j)}}if(opened===N*N-M){GameSFX.win();over=true;msg.textContent="🎉 MENANG!"}render()}
document.getElementById("new").onpointerdown=e=>{e.preventDefault();setup()};setup()
})()
</script>
`,o=`minesweeper-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,i=Buffer.from(JSON.stringify({response_id:o,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:n,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:o}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Minesweeper"}],unifiedResponse:{data:i},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:o})}catch(t){console.error("[MINESWEEPER ERROR]",t),await e.reply("✗ Gagal membuka Minesweeper.")}},cmd:"minesweeper",alias:["mine","bom"],type:"games",limit:!1,location:"plugins/games/minesweeper.js"};