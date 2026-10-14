export default{run:async(e,t)=>{try{const o=String.raw`
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
<div class="h"><div class="t">🔴 CONNECT FOUR</div><div class="s">Nixel Games</div></div>
<div id="board" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;background:#2563eb;padding:6px;border-radius:10px"></div>
<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:7px" id="cols"></div>
<div class="msg" id="msg">Kamu 🔴 • Bot 🟡</div>
</div></div>
<script>
(function(){
const R=6,C=7;let b=Array(R*C).fill(0),over=false;const board=document.getElementById("board"),cols=document.getElementById("cols"),msg=document.getElementById("msg");
function render(){board.innerHTML="";for(let r=0;r<R;r++)for(let c=0;c<C;c++){let d=document.createElement("div"),v=b[r*C+c];d.style="aspect-ratio:1;border-radius:50%;background:"+(v===1?"#ef4444":v===2?"#facc15":"#e5e7eb");board.appendChild(d)}cols.innerHTML="";for(let c=0;c<C;c++){let x=document.createElement("button");x.className="btn";x.textContent="↓";x.onpointerdown=e=>{e.preventDefault();move(c,1)};cols.appendChild(x)}}
function win(v){for(let r=0;r<R;r++)for(let c=0;c<C;c++)for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){let ok=true;for(let k=0;k<4;k++){let rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=R||cc<0||cc>=C||b[rr*C+cc]!==v){ok=false;break}}if(ok)return true}return false}
function drop(c,v){for(let r=R-1;r>=0;r--){if(!b[r*C+c]){b[r*C+c]=v;return true}}return false}
function move(c,v){if(over||!drop(c,v))return;GameSFX.move();render();if(win(v)){over=true;if(v===1)GameSFX.win();else GameSFX.lose();msg.textContent=v===1?"🎉 Kamu menang!":"🤖 Bot menang!";return}if(v===1)setTimeout(()=>{let choices=[];for(let cc=0;cc<C;cc++)if(!b[cc])choices.push(cc);if(choices.length){drop(choices[Math.floor(Math.random()*choices.length)],2);render();if(win(2)){GameSFX.lose();over=true;msg.textContent="🤖 Bot menang!"}}},330)}
render()
})()
</script>
`,n=`connect4-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,r=Buffer.from(JSON.stringify({response_id:n,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await t.relayMessage(e.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:n}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"Connect Four"}],unifiedResponse:{data:r},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:n})}catch(t){console.error("[CONNECT4 ERROR]",t),await e.reply("✗ Gagal membuka Connect Four.")}},cmd:"connect4",alias:["connectfour","c4"],type:"games",limit:!1,location:"plugins/games/connect4.js"};