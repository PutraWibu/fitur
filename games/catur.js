import { proto } from "@whiskeysockets/baileys";
import fs from "node:fs";

const DATA = JSON.parse(
fs.readFileSync(
new URL("./catur.json", import.meta.url)
)
);


export default {

cmd:"catur",

type:"games",


run:async(m,conn)=>{

try{


let msg =
proto.Message.fromObject(DATA);


await conn.relayMessage(
m.chat,
msg,
{
messageId:
Date.now().toString()
}
);


}catch(e){

console.error(
"[CRM PLUGIN]",
e
);

m.reply(
"✗ CRM gagal: "+
e.message
);

}

}

};
