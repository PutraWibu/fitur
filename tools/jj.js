import axios from"axios";
const BASE="https://cc.fgsi.dpdns.org";
const H={"User-Agent":"Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Referer":BASE+"/"};
async function getTemplates(){
 const r=await axios.get(BASE,{headers:H});
 const m=r.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
 if(!m)throw Error("Data template tidak ditemukan");
 const j=JSON.parse(m[1]);
 const t=j?.props?.pageProps?.templates||[];
 return t.map(x=>({id:String(x.id),title:x.title||x.name||x.short_title||"Tanpa nama"}));
}
export default{run:async(m,{text})=>{
 try{
  if(!text){
   const t=await getTemplates();
   if(!t.length)return m.reply("Template tidak ditemukan.");
   return m.reply(t.map(x=>x.title).join("\n"));
  }
  const t=await getTemplates();
  const q=text.trim().toLowerCase();
  const x=t.find(v=>v.id===text.trim()||v.title.toLowerCase().includes(q));
  if(!x)return m.reply("Template tidak ditemukan.");
  return m.reply(`${x.title}\nID: ${x.id}`);
 }catch(e){return m.reply("❌ "+(e.response?.data?.error||e.message))}
},cmd:"jj",alias:["jjeditor","jjcc","ccjj"],use:"[id/nama template]",type:"tools",premium:!0,limit:1,location:"plugins/tools/jj.js"};