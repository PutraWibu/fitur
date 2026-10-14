import{randomUUID as e}from"crypto";export default{run:async(t,n)=>{try{const o=String.raw`
<style>
*{
    box-sizing:border-box;
    -webkit-tap-highlight-color:transparent;
    user-select:none;
}

html,body{
    margin:0;
    padding:0;
    width:100%;
    overflow:hidden;
    background:transparent;
    font-family:Arial,sans-serif;
    touch-action:manipulation;
}

.slotWrap{
    width:100%;
    padding:12px;
    border-radius:17px;
    background:linear-gradient(145deg,#171717,#292929);
    color:#fff;
    border:1px solid rgba(255,255,255,.1);
}

.slotHeader{
    text-align:center;
    margin-bottom:7px;
}

.slotTitle{
    font-size:23px;
    font-weight:900;
    letter-spacing:1px;
}

.slotSub{
    margin-top:2px;
    font-size:8px;
    opacity:.5;
    letter-spacing:.8px;
}

.slotInfo{
    display:flex;
    justify-content:center;
    margin:8px 0 10px;
}

.slotStat{
    text-align:center;
    min-width:80px;
}

.slotStatLabel{
    font-size:8px;
    opacity:.5;
}

.slotStatValue{
    margin-top:2px;
    font-size:16px;
    font-weight:900;
}

.coin{
    color:#ffd84d;
}

.score{
    color:#70e1ff;
}

.slotMachine{
    position:relative;
    width:min(315px,94vw);
    margin:auto;
    padding:10px;
    border-radius:15px;
    background:linear-gradient(145deg,#242424,#101010);
    border:2px solid rgba(255,255,255,.1);
    box-shadow:
        inset 0 0 18px rgba(0,0,0,.8),
        0 5px 18px rgba(0,0,0,.3);
}

.reels{
    display:flex;
    justify-content:center;
    align-items:center;
    gap:7px;
}

.reel{
    position:relative;
    width:31%;
    height:82px;
    overflow:hidden;
    border-radius:10px;
    background:#eeeeee;
    border:3px solid #555;
    box-shadow:
        inset 0 5px 10px rgba(0,0,0,.25),
        inset 0 -5px 10px rgba(0,0,0,.25);
}

.reel:before,
.reel:after{
    content:"";
    position:absolute;
    left:0;
    right:0;
    height:10px;
    z-index:5;
    pointer-events:none;
}

.reel:before{
    top:0;
    background:linear-gradient(
        to bottom,
        rgba(0,0,0,.3),
        transparent
    );
}

.reel:after{
    bottom:0;
    background:linear-gradient(
        to top,
        rgba(0,0,0,.3),
        transparent
    );
}

.reelWindow{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
}

.symbol{
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:Arial Black,Arial,sans-serif;
    font-size:42px;
    font-weight:900;
    color:#222;
    text-shadow:
        0 2px 0 rgba(255,255,255,.6);
}

.symbol.seven{
    color:#e51d36;
}

.symbol.lucky{
    color:#168b3c;
}

.symbol.gold{
    color:#d99000;
}

.symbol.crown{
    color:#b87500;
}

.spinFlash{
    animation:spinFlash .12s linear infinite;
}

@keyframes spinFlash{
    0%{
        filter:brightness(1);
    }

    50%{
        filter:brightness(1.45);
    }

    100%{
        filter:brightness(1);
    }
}

.winMachine{
    animation:winMachine .65s ease-in-out infinite alternate;
}

@keyframes winMachine{
    from{
        transform:scale(1);
        filter:brightness(1);
    }

    to{
        transform:scale(1.025);
        filter:brightness(1.3);
    }
}

.winText{
    height:30px;
    margin-top:7px;
    text-align:center;
    font-size:18px;
    font-weight:900;
    color:#ffd84d;
    text-shadow:
        0 0 5px rgba(255,216,77,.5);
}

.winText.hide{
    visibility:hidden;
}

.slotButtons{
    display:flex;
    justify-content:center;
    gap:8px;
    margin-top:7px;
}

.slotButton{
    min-width:110px;
    padding:10px 13px;
    border:0;
    border-radius:10px;
    color:#fff;
    font-size:10px;
    font-weight:900;
    background:#383838;
    box-shadow:
        0 3px 0 #181818,
        inset 0 1px 0 rgba(255,255,255,.08);
}

.slotButton.spin{
    background:#e12b45;
}

.slotButton.auto{
    background:#343434;
    transition:
        background .2s ease,
        box-shadow .2s ease,
        transform .1s ease;
}

.slotButton:active{
    transform:translateY(2px);
    box-shadow:0 1px 0 #181818;
}

.slotHint{
    margin-top:7px;
    text-align:center;
    font-size:8px;
    opacity:.4;
}

.jackpot{
    position:fixed;
    inset:0;
    z-index:100;
    display:flex;
    align-items:center;
    justify-content:center;
    pointer-events:none;
    opacity:0;
}

.jackpot.show{
    opacity:1;
}

.jackpotBox{
    padding:18px 25px;
    border-radius:18px;
    text-align:center;
    background:rgba(20,20,20,.94);
    border:2px solid #ffd84d;
    box-shadow:
        0 0 30px rgba(255,216,77,.45);
    animation:jackpotPop .55s ease;
}

@keyframes jackpotPop{
    0%{
        transform:scale(.4) rotate(-5deg);
        opacity:0;
    }

    70%{
        transform:scale(1.1) rotate(2deg);
    }

    100%{
        transform:scale(1) rotate(0);
        opacity:1;
    }
}

.jackpot777{
    font-size:40px;
    font-weight:900;
    color:#ffd84d;
    text-shadow:
        0 0 5px #fff,
        0 0 15px #ffd84d;
}

.jackpotLabel{
    margin-top:3px;
    font-size:12px;
    font-weight:bold;
}

.coinRain{
    position:fixed;
    inset:0;
    overflow:hidden;
    pointer-events:none;
    z-index:99;
}

.coinParticle{
    position:absolute;
    top:-30px;
    font-size:20px;
    animation:coinFall 1.4s linear forwards;
}

@keyframes coinFall{
    to{
        transform:
            translateY(110vh)
            rotate(720deg);
        opacity:0;
    }
}
</style>

<div class="slotWrap">

    <div class="slotHeader">
        <div class="slotTitle">
            🎰BIGWIN 777
        </div>

        <div class="slotSub">
            NIXEL GAMES
        </div>
    </div>

    <div class="slotInfo">

        <div class="slotStat">

            <div class="slotStatLabel">
                COINS
            </div>

            <div
                class="slotStatValue coin"
                id="slotCoins"
            >
                ∞
            </div>

        </div>

        <div class="slotStat">

            <div class="slotStatLabel">
                SCORE
            </div>

            <div
                class="slotStatValue score"
                id="slotScore"
            >
                0
            </div>

        </div>

    </div>

    <div
        class="slotMachine"
        id="slotMachine"
    >

        <div class="reels">

            <div class="reel">

                <div
                    class="reelWindow"
                    id="reel1"
                >
                    <div class="symbol seven">
                        7
                    </div>
                </div>

            </div>

            <div class="reel">

                <div
                    class="reelWindow"
                    id="reel2"
                >
                    <div class="symbol seven">
                        7
                    </div>
                </div>

            </div>

            <div class="reel">

                <div
                    class="reelWindow"
                    id="reel3"
                >
                    <div class="symbol seven">
                        7
                    </div>
                </div>

            </div>

        </div>

        <div
            class="winText hide"
            id="winText"
        >
            🎉 JACKPOT 777 🎉
        </div>

    </div>

    <div class="slotButtons">

        <button
            class="slotButton spin"
            id="spinButton"
        >
            SPIN
        </button>

        <button
            class="slotButton auto"
            id="autoButton"
        >
            AUTOSPIN
        </button>

    </div>

    <div class="slotHint">
        TAP SPIN • JACKPOT 777
    </div>

</div>

<div
    class="jackpot"
    id="jackpot"
>
    <div class="jackpotBox">

        <div class="jackpot777">
            7 7 7
        </div>

        <div class="jackpotLabel">
            JACKPOT!!! 🎉 +777 POIN
        </div>

    </div>
</div>

<div
    class="coinRain"
    id="coinRain"
></div>

<script>
(function(){

const reelEls=[
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
]

const spinButton=
    document.getElementById("spinButton")

const autoButton=
    document.getElementById("autoButton")

const slotMachine=
    document.getElementById("slotMachine")

const winText=
    document.getElementById("winText")

const jackpot=
    document.getElementById("jackpot")

const coinRain=
    document.getElementById("coinRain")

const scoreEl=
    document.getElementById("slotScore")

let score=0

let spinning=false
let autoSpin=false
let autoTimer=null

let audioCtx=null


/*
    ========================================
    SYMBOL
    ========================================

    weight besar
    = lebih sering keluar

    weight kecil
    = lebih langka
*/

const symbols=[

    {
        text:"🍒",
        type:"gold",
        value:50,
        weight:35
    },

    {
        text:"⭐",
        type:"gold",
        value:100,
        weight:32
    },

    {
        text:"🀄",
        type:"lucky",
        value:75,
        weight:20
    },

    {
        text:"🪙",
        type:"gold",
        value:75,
        weight:15
    },

    {
        text:"💎",
        type:"lucky",
        value:150,
        weight:8
    },

    {
        text:"👑",
        type:"crown",
        value:250,
        weight:5
    },

    {
        text:"7",
        type:"seven",
        value:77,
        weight:3
    }

]


function initAudio(){

    try{

        if(!audioCtx){

            audioCtx=new(
                window.AudioContext||
                window.webkitAudioContext
            )()

        }

        if(audioCtx.state==="suspended"){

            audioCtx.resume()

        }

    }catch(e){}

}


function soundTone(
    frequency,
    duration,
    type,
    volume,
    delay
){

    try{

        initAudio()

        if(!audioCtx){
            return
        }

        const now=
            audioCtx.currentTime+
            (delay||0)

        const osc=
            audioCtx.createOscillator()

        const gain=
            audioCtx.createGain()

        osc.type=
            type||"sine"

        osc.frequency.setValueAtTime(
            frequency,
            now
        )

        gain.gain.setValueAtTime(
            0.001,
            now
        )

        gain.gain.exponentialRampToValueAtTime(
            volume||0.025,
            now+.015
        )

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now+duration
        )

        osc.connect(gain)

        gain.connect(
            audioCtx.destination
        )

        osc.start(now)

        osc.stop(
            now+
            duration+
            .03
        )

    }catch(e){}

}


function spinSound(){

    soundTone(
        170,
        .06,
        "square",
        .018,
        0
    )

    soundTone(
        210,
        .06,
        "square",
        .018,
        .065
    )

    soundTone(
        250,
        .06,
        "square",
        .018,
        .13
    )

}


function stopSound(){

    soundTone(
        440,
        .07,
        "triangle",
        .025,
        0
    )

    soundTone(
        520,
        .09,
        "triangle",
        .025,
        .07
    )

}


function jackpotSound(){

    const notes=[
        523,
        659,
        784,
        988,
        1175,
        1397
    ]

    notes.forEach(
        function(note,index){

            soundTone(
                note,
                .18,
                "triangle",
                .045,
                index*.07
            )

        }
    )

    soundTone(
        1568,
        .45,
        "sine",
        .035,
        .43
    )

}


/*
    ========================================
    RANDOM SYMBOL
    ========================================
*/

function randomSymbol(){

    const totalWeight=
        symbols.reduce(
            function(total,item){

                return total+
                    item.weight

            },
            0
        )

    let random=
        Math.random()*
        totalWeight

    for(
        const item of symbols
    ){

        random-=item.weight

        if(random<=0){

            return item

        }

    }

    return symbols[0]

}


/*
    ========================================
    RANDOM RESULT
    ========================================

    777 punya peluang khusus:
    0.3%

    Selain itu setiap angka 7
    tetap mengikuti rarity normal.
*/

function randomResult(){

    const jackpotChance=
        Math.random()<0.003

    if(jackpotChance){

        const seven={
            text:"7",
            type:"seven",
            value:77,
            weight:5
        }

        return[
            seven,
            seven,
            seven
        ]

    }


    const result=[

        randomSymbol(),
        randomSymbol(),
        randomSymbol()

    ]


    /*
        Mencegah 777 muncul
        dari random normal.
    */

    if(
        result[0].text==="7"&&
        result[1].text==="7"&&
        result[2].text==="7"
    ){

        result[2]=symbols[0]

    }


    return result

}


/*
    ========================================
    SET REEL
    ========================================
*/

function setReel(
    reel,
    value
){

    reel.innerHTML=""

    const symbol=
        document.createElement("div")

    symbol.className=
        "symbol "+
        value.type

    symbol.textContent=
        value.text

    reel.appendChild(
        symbol
    )

}


/*
    ========================================
    ANIMATE REEL
    ========================================
*/

function animateReel(
    reel,
    finalValue,
    duration
){

    return new Promise(
        function(resolve){

            reel.classList.add(
                "spinFlash"
            )

            let count=0

            const total=
                Math.max(
                    12,
                    Math.floor(
                        duration/35
                    )
                )

            const interval=
                setInterval(
                    function(){

                        setReel(
                            reel,
                            randomSymbol()
                        )

                        count++

                        if(count>=total){

                            clearInterval(
                                interval
                            )

                            setReel(
                                reel,
                                finalValue
                            )

                            reel.classList.remove(
                                "spinFlash"
                            )

                            stopSound()

                            resolve()

                        }

                    },
                    35
                )

        }
    )

}


/*
    ========================================
    SCORE
    ========================================
*/

function updateScore(){

    scoreEl.textContent=
        String(score)

}


function addScore(points){

    score+=points

    updateScore()

}


/*
    ========================================
    JACKPOT
    ========================================
*/

function showJackpot(){

    winText.classList.remove(
        "hide"
    )

    slotMachine.classList.add(
        "winMachine"
    )

    jackpot.classList.add(
        "show"
    )

    jackpotSound()

    createCoins()


    setTimeout(
        function(){

            jackpot.classList.remove(
                "show"
            )

        },
        1500
    )


    setTimeout(
        function(){

            winText.classList.add(
                "hide"
            )

            slotMachine.classList.remove(
                "winMachine"
            )

        },
        2300
    )

}


/*
    ========================================
    COIN EFFECT
    ========================================
*/

function createCoins(){

    coinRain.innerHTML=""

    for(
        let i=0;
        i<28;
        i++
    ){

        const coin=
            document.createElement("div")

        coin.className=
            "coinParticle"

        coin.textContent=
            Math.random()<.5
            ? "🪙"
            : "✨"

        coin.style.left=
            (Math.random()*100)+
            "%"

        coin.style.animationDelay=
            (Math.random()*.5)+
            "s"

        coinRain.appendChild(
            coin
        )

    }


    setTimeout(
        function(){

            coinRain.innerHTML=""

        },
        2300
    )

}


/*
    ========================================
    SPIN
    ========================================
*/

function spin(){

    if(spinning){
        return
    }

    spinning=true

    initAudio()

    winText.classList.add(
        "hide"
    )

    slotMachine.classList.remove(
        "winMachine"
    )

    spinSound()


    const result=
        randomResult()


    const promises=[

        animateReel(
            reelEls[0],
            result[0],
            1050
        ),

        animateReel(
            reelEls[1],
            result[1],
            1150
        ),

        animateReel(
            reelEls[2],
            result[2],
            1250
        )

    ]


    Promise.all(promises)
        .then(
            function(){

                spinning=false


                const is777=
                    result[0].text==="7"&&
                    result[1].text==="7"&&
                    result[2].text==="7"


                if(is777){

                    /*
                        JACKPOT 777
                        = 777 POIN
                    */

                    addScore(777)

                    showJackpot()

                }else{

                    /*
                        Nilai dihitung
                        berdasarkan ketiga simbol.

                        Contoh:

                        🍒 🍋 💎

                        75 + 50 + 150

                        = 275 POIN
                    */

                    const roundScore=
                        result.reduce(
                            function(
                                total,
                                item
                            ){

                                return total+
                                    item.value

                            },
                            0
                        )

                    addScore(
                        roundScore
                    )

                }


                /*
                    AUTOSPIN
                */

                if(autoSpin){

                    clearTimeout(
                        autoTimer
                    )

                    autoTimer=
                        setTimeout(
                            function(){

                                if(autoSpin){

                                    spin()

                                }

                            },
                            650
                        )

                }

            }
        )

}


/*
    ========================================
    AUTOSPIN
    ========================================
*/

function toggleAuto(){

    autoSpin=!autoSpin


    if(autoSpin){

        autoButton.textContent=
            "AUTOSPIN ON"

        autoButton.classList.add(
            "active"
        )

        initAudio()


        if(!spinning){

            spin()

        }

    }else{

        autoButton.textContent=
            "AUTOSPIN"

        autoButton.classList.remove(
            "active"
        )

        clearTimeout(
            autoTimer
        )

    }

}


/*
    ========================================
    SPIN BUTTON
    ========================================
*/

spinButton.addEventListener(
    "pointerdown",
    function(e){

        e.preventDefault()


        /*
            Manual spin mematikan
            Auto Spin.
        */

        if(autoSpin){

            autoSpin=false

            clearTimeout(
                autoTimer
            )

            autoButton.textContent=
                "AUTOSPIN"

            autoButton.classList.remove(
                "active"
            )

        }


        spin()

    }
)


/*
    ========================================
    AUTO BUTTON
    ========================================
*/

autoButton.addEventListener(
    "pointerdown",
    function(e){

        e.preventDefault()

        toggleAuto()

    }
)


/*
    ========================================
    KEYBOARD
    ========================================
*/

document.addEventListener(
    "keydown",
    function(e){

        if(
            e.key==="Enter"||
            e.key===" "
        ){

            e.preventDefault()


            if(!autoSpin){

                spin()

            }

        }

    }
)


/*
    ========================================
    INITIAL
    ========================================
*/

updateScore()


setReel(
    reelEls[0],
    symbols[5]
)

setReel(
    reelEls[1],
    symbols[5]
)

setReel(
    reelEls[2],
    symbols[5]
)

})()
</script>
`,i=e(),s=Buffer.from(JSON.stringify({response_id:i,sections:[{view_model:{primitive:{__typename:"GenAIaeacdsnwHtmlPrimitive",payload:o,trusted_sources:[]},__typename:"GenAISingleLayoutViewModel"}}]})).toString("base64");await n.relayMessage(t.chat,{messageContextInfo:{deviceListMetadata:{},deviceListMetadataVersion:2,botMetadata:{messageDisclaimerText:"",botResponseId:i}},botForwardedMessage:{message:{richResponseMessage:{messageType:1,submessages:[{messageType:2,messageText:"777 Slot Game"}],unifiedResponse:{data:s},contextInfo:{forwardingScore:1,isForwarded:!0,forwardedAiBotMessageInfo:{botJid:"867051314767696@bot"},forwardOrigin:4}}}}},{messageId:i})}catch(e){console.error("[SLOT ERROR]",e),await t.reply("✗ Gagal membuka Slot 777.")}},cmd:"slot",alias:["slot777","bigwin","bigwin777"],type:"games",limit:!1,location:"plugins/games/slot.js"};