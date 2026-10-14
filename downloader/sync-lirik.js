import {
    execFile
} from "node:child_process";
import {
    promisify
} from "node:util";
import {
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync
} from "node:fs";
import {
    tmpdir
} from "node:os";
import {
    join
} from "node:path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
const jalankan = promisify(execFile);
const BATAS_BASE64 = 900 * 1024;
const BITRATE_MIN = {
    mp3: 24,
    opus: 12
};
const BITRATE_AWAL = {
    mp3: 64,
    opus: 48
};
const CODEC = {
    mp3: {
        args: (br) => ["-c:a", "libmp3lame", "-b:a", `${br}k`, "-ac", "1", "-ar", br < 32 ? "24000" : "32000", ],
        ext: "mp3",
        mime: "audio/mpeg",
    },
    opus: {
        args: (br) => ["-c:a", "libopus", "-b:a", `${br}k`, "-ac", "1", "-ar", "24000"],
        ext: "ogg",
        mime: "audio/ogg",
    },
};
const lolos = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
async function kecilkan(masuk, keluar, codec, bitrate, maxDetik) {
    await jalankan(ffmpegInstaller.path, ["-y", "-i", masuk, "-vn", "-t", String(maxDetik), ...CODEC[codec].args(bitrate), keluar, ]);
    return readFileSync(keluar);
}
async function audioDataUri(buffer, opsi = {}) {
    const {
        codec = "opus", maxDetik = 600, batas = BATAS_BASE64,
    } = opsi;
    if (!Buffer.isBuffer(buffer) || !buffer.length) return null;
    if (!CODEC[codec]) return null;
    const bitrate = opsi.bitrate ?? BITRATE_AWAL[codec];
    const minimum = BITRATE_MIN[codec];
    const dir = mkdtempSync(join(tmpdir(), "ackles-audio-"));
    const masuk = join(dir, "masuk");
    const keluar = join(dir, `keluar.${CODEC[codec].ext}`);
    try {
        writeFileSync(masuk, buffer);
        const batasBerkas = Math.floor((batas * 3) / 4);
        let br = bitrate;
        let kecil = await kecilkan(masuk, keluar, codec, br, maxDetik);
        for (let putaran = 0; putaran < 3 && kecil.length > batasBerkas; putaran++) {
            const usul = Math.floor(((br * batasBerkas) / kecil.length) * 0.94);
            if (usul < minimum) {
                if (br <= minimum) return null;
                br = minimum;
            } else {
                br = usul;
            }
            kecil = await kecilkan(masuk, keluar, codec, br, maxDetik);
        }
        if (kecil.length > batasBerkas) return null;
        const b64 = kecil.toString("base64");
        return {
            dataUri: `data:${CODEC[codec].mime};base64,${b64}`,
            byte: b64.length,
            bitrate: br,
            codec,
        };
    } catch {
        return null;
    } finally {
        rmSync(dir, {
            recursive: true,
            force: true
        });
    }
}
async function coverDataUri(url, opsi = {}) {
    const {
        ukuran = 240, kualitas = 6, batas = 14 * 1024
    } = opsi;
    if (!url || !/^https?:\/\//.test(url)) return null;
    const dir = mkdtempSync(join(tmpdir(), "ackles-cover-"));
    const masuk = join(dir, "masuk");
    const keluar = join(dir, "keluar.jpg");
    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(12000)
        });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 512) return null;
        writeFileSync(masuk, buf);
        let q = kualitas;
        let kecil = null;
        for (; q <= 9; q++) {
            await jalankan(ffmpegInstaller.path, ["-y", "-i", masuk, "-vf", `crop='min(iw,ih)':'min(iw,ih)',scale=${ukuran}:${ukuran}`, "-q:v", String(q), keluar, ]);
            kecil = readFileSync(keluar);
            if ((kecil.length * 4) / 3 <= batas) break;
        }
        if (!kecil || (kecil.length * 4) / 3 > batas) return null;
        let warna = "#1e1e22";
        try {
            const {
                stdout
            } = await jalankan(ffmpegInstaller.path, ["-y", "-i", keluar, "-vf", "scale=1:1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], {
                encoding: "buffer",
                maxBuffer: 1024 * 1024
            }, );
            if (stdout?.length >= 3) {
                warna = "#" + [...stdout.subarray(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join("");
            }
        } catch {}
        const b64 = kecil.toString("base64");
        return {
            dataUri: `data:image/jpeg;base64,${b64}`,
            byte: b64.length,
            kualitas: q,
            warna,
        };
    } catch {
        return null;
    } finally {
        rmSync(dir, {
            recursive: true,
            force: true
        });
    }
}

function gelapkan(hex, faktor) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex ?? ""));
    if (!m) return "#141416";
    const n = parseInt(m[1], 16);
    const r = Math.round(((n >> 16) & 255) * faktor);
    const g = Math.round(((n >> 8) & 255) * faktor);
    const b = Math.round((n & 255) * faktor);
    return ("#" + [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, "0")).join(""));
}

function kartuMusik({
    judul = "Unknown",
    artis = "ACKLES",
    audioSrc = "",
    coverSrc = "",
    warna = "#222a38",
    lirik = [],
}) {
    const nama = lolos(judul);
    const sub = lolos(artis);
    const bgAtas = gelapkan(warna, 0.7);
    const bgBawah = "#121212";
    const adaLirik = Array.isArray(lirik) && lirik.length > 0;
    const dataLirik = adaLirik ? JSON.stringify(lirik.map((b) => [b.ms, b.teks])).replace(/<\//g, "<\\/") : "";
    const panelLirik = adaLirik ? ` <div class="musicLyricArea" id="musicLyricBox"> <div class="musicLyricScroll masked" id="musicLyricScroll"></div> </div> <script type="application/json" id="musicLyricData">${dataLirik}</script>` : "";
    const gayaLirik = adaLirik ? ` .musicLyricArea{ position:relative; z-index:2; height:44px; overflow:hidden; margin:4px 0 2px; -webkit-mask-image:linear-gradient(180deg, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%); mask-image:linear-gradient(180deg, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%); } .musicLyricScroll{ position:absolute; left:0; right:0; top:0; padding:12px 4px 12px; transition:transform .4s cubic-bezier(.2,.8,.2,1), opacity .5s ease; } .musicLyricScroll.masked{ opacity:0; } .musicLyricLine{ margin:4px 0; color:rgba(255,255,255,.32); font:bold 12px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; line-height:1.25; text-align:left; transition:color .3s ease, transform .3s ease, opacity .3s ease; transform:scale(.97); transform-origin:left center; } .musicLyricLine.active{ color:#ffffff; transform:scale(1.02); text-shadow:0 0 14px rgba(255,255,255,.45); }` : "";
    const skripLirik = adaLirik ? ` const lyricBox = document.getElementById('musicLyricBox'); const lyricScroll = document.getElementById('musicLyricScroll'); const lyricRaw = document.getElementById('musicLyricData'); let lyricLines = []; let lyricEls = []; let lyricActive = -1; let lyricHidden = true; const LYRIC_GAP_MS = 12000; const LYRIC_HOLD_MS = 4000; const LYRIC_LEAD_MS = 1500; const LYRIC_TAIL_MS = 6000; const LYRIC_MIN_HIDE_MS = 5000; try { lyricLines = JSON.parse(lyricRaw.textContent); } catch (e) { lyricLines = []; } if (lyricLines.length) { lyricScroll.innerHTML = lyricLines .map(function (row) { const teks = String(row[1] || "") .replace(/&/g, "&amp;") .replace(/</g, "&lt;") .replace(/>/g, "&gt;"); return '<div class="musicLyricLine">' + (teks || "&nbsp;") + "</div>"; }) .join(""); lyricEls = Array.prototype.slice.call(lyricScroll.children); } function lyricIndexAt(ms) { if (!lyricLines.length || ms < lyricLines[0][0]) return -1; let lo = 0, hi = lyricLines.length - 1, found = 0; while (lo <= hi) { const mid = (lo + hi) >> 1; if (lyricLines[mid][0] <= ms) { found = mid; lo = mid + 1; } else { hi = mid - 1; } } return found; } function setLyricHidden(hide) { if (hide === lyricHidden) return; lyricHidden = hide; lyricScroll.classList.toggle("masked", hide); } function updateLyric() { if (!lyricEls.length) return; const ms = audio.currentTime * 1000; const index = lyricIndexAt(ms); let sembunyi = false; if (index < 0) { sembunyi = lyricLines[0][0] - ms > LYRIC_LEAD_MS; } else { const sekarang = lyricLines[index][0]; const kosong = !String(lyricLines[index][1] || "").trim(); const berikut = lyricLines[index + 1]; if (kosong) { sembunyi = !berikut || berikut[0] - sekarang > LYRIC_MIN_HIDE_MS; } else if (berikut) { if ( berikut[0] - sekarang > LYRIC_GAP_MS && ms - sekarang > LYRIC_HOLD_MS && berikut[0] - ms > LYRIC_LEAD_MS ) { sembunyi = true; } } else { if (ms - sekarang > LYRIC_TAIL_MS) sembunyi = true; } } setLyricHidden(sembunyi); if (index === lyricActive) return; if (lyricEls[lyricActive]) lyricEls[lyricActive].classList.remove("active"); lyricActive = index; if (index < 0) { lyricScroll.style.transform = "translateY(0px)"; return; } const el = lyricEls[index]; el.classList.add("active"); const tengah = lyricBox.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2); lyricScroll.style.transform = "translateY(" + tengah + "px)"; } audio.addEventListener("timeupdate", updateLyric); audio.addEventListener("seeked", updateLyric); audio.addEventListener("ended", function () { if (lyricEls[lyricActive]) lyricEls[lyricActive].classList.remove("active"); lyricActive = -1; lyricScroll.style.transform = "translateY(0px)"; setLyricHidden(true); });` : "";
    const coverMarkup = coverSrc ? `<img class="musicCoverImg" id="musicCover" src="${coverSrc}" alt="cover" />` : `<div class="musicCoverPlaceholder"><svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,.3)"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>`;
    return `<meta name="viewport" content="width=device-width,initial-scale=1"> <style> *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; -webkit-user-select:none; user-select:none; } html,body{ margin:0; padding:0; width:100%; overflow:hidden; background:transparent; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; } .musicCard{ position:relative; width:100%; padding:14px 14px 14px; border-radius:18px; background:linear-gradient(180deg, ${bgAtas} 0%, ${bgBawah} 65%, #0e0e10 100%); border:1px solid rgba(255,255,255,.1); box-shadow:0 12px 32px rgba(0,0,0,.7); overflow:hidden; } .musicHeader{ display:flex; align-items:center; justify-content:center; margin-bottom:12px; padding:0 4px; text-align:center; } .musicHeaderKicker{ color:rgba(255,255,255,.6); font:bold 8px -apple-system,sans-serif; letter-spacing:1px; text-transform:uppercase; } .musicCoverBox{ width:100%; max-width:215px; aspect-ratio:1/1; margin:0 auto 12px; border-radius:8px; overflow:hidden; background:#141416; box-shadow:0 10px 28px rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; transition:transform .3s ease; } .musicCoverBox.playing{ transform:scale(1.02); } .musicCoverImg{ width:100%; height:100%; object-fit:cover; display:block; } .musicCoverPlaceholder{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.01)); } .musicInfoRow{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; padding:0 2px; } .musicInfoText{ min-width:0; flex:1; } .musicTitle{ color:#fff; font:bold 15px -apple-system,sans-serif; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .musicArtist{ margin-top:2px; color:rgba(255,255,255,.6); font:11px -apple-system,sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .musicLikeBtn{ background:transparent; border:none; color:rgba(255,255,255,.7); cursor:pointer; padding:6px; flex:none; display:flex; align-items:center; justify-content:center; transition:transform .12s, color .15s; } .musicLikeBtn:active{ transform:scale(.85); } .musicLikeBtn.liked{ color:#1db954; } .musicProgressArea{ margin:8px 0 4px; cursor:pointer; padding:4px 0; } .musicProgress{ position:relative; width:100%; height:4px; border-radius:2px; background:rgba(255,255,255,.18); } .musicProgressBar{ position:absolute; left:0; top:0; height:100%; width:0%; border-radius:2px; background:#fff; } .musicProgressDot{ position:absolute; left:0%; top:50%; width:10px; height:10px; transform:translate(-50%,-50%); border-radius:50%; background:#fff; box-shadow:0 0 6px rgba(0,0,0,.4); opacity:0; transition:opacity .15s; } .musicProgressArea:active .musicProgressDot, .musicProgressArea:hover .musicProgressDot{ opacity:1; } .musicTime{ display:flex; justify-content:space-between; margin-top:4px; color:rgba(255,255,255,.45); font:10px monospace; padding:0 2px; } .musicControls{ display:flex; align-items:center; justify-content:space-between; margin-top:8px; padding:0 2px; } .musicBtn{ background:transparent; border:none; color:rgba(255,255,255,.75); cursor:pointer; padding:6px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:transform .12s, color .15s; } .musicBtn:active{ transform:scale(.88); color:#fff; } .musicBtn.active{ color:#1db954; } .musicPlayBtn{ width:50px; height:50px; border-radius:50%; background:#fff; color:#000; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,.5); transition:transform .12s, background .15s; } .musicPlayBtn:active{ transform:scale(.92); background:#ddd; } .musicPlayBtn svg{ fill:#000; } ${gayaLirik} </style> <div class="musicCard"> <div class="musicHeader"> <div class="musicHeaderKicker">PLAYING WITH ACKLES MUSIC</div> </div> <div class="musicCoverBox" id="musicCoverBox"> ${coverMarkup} </div> <div class="musicInfoRow"> <div class="musicInfoText"> <div class="musicTitle">${nama}</div> <div class="musicArtist">${sub}</div> </div> <button class="musicLikeBtn" id="musicLike" title="Suka"> <svg id="musicLikeIcon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> </button> </div> ${panelLirik} <div class="musicProgressArea" id="musicProgress"> <div class="musicProgress"> <div class="musicProgressBar" id="musicProgressBar"></div> <div class="musicProgressDot" id="musicProgressDot"></div> </div> <div class="musicTime"> <span id="musicCurrent">0:00</span> <span id="musicDuration">0:00</span> </div> </div> <div class="musicControls"> <button class="musicBtn" id="musicShuffle" title="Acak"> <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg> </button> <button class="musicBtn" id="musicRewind" title="-10s"> <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg> </button> <button class="musicPlayBtn" id="musicPlay" title="Putar/Jeda"> <svg id="musicPlayIcon" viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"/></svg> <svg id="musicPauseIcon" viewBox="0 0 24 24" width="24" height="24" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> </button> <button class="musicBtn" id="musicForward" title="+10s"> <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg> </button> <button class="musicBtn" id="musicLoop" title="Ulangi"> <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg> </button> </div> </div> <audio id="localMusic" preload="auto" src="${audioSrc}"></audio> <script> (function(){ const audio = document.getElementById('localMusic'); const play = document.getElementById('musicPlay'); const playIcon = document.getElementById('musicPlayIcon'); const pauseIcon = document.getElementById('musicPauseIcon'); const progress = document.getElementById('musicProgress'); const progressBar = document.getElementById('musicProgressBar'); const progressDot = document.getElementById('musicProgressDot'); const current = document.getElementById('musicCurrent'); const duration = document.getElementById('musicDuration'); const coverBox = document.getElementById('musicCoverBox'); const rewindBtn = document.getElementById('musicRewind'); const forwardBtn = document.getElementById('musicForward'); const loopBtn = document.getElementById('musicLoop'); const shuffleBtn = document.getElementById('musicShuffle'); const likeBtn = document.getElementById('musicLike'); audio.volume = .85; function formatTime(sec){ if(!Number.isFinite(sec)) return '0:00'; const m = Math.floor(sec / 60); const s = Math.floor(sec % 60); return m + ':' + String(s).padStart(2,'0'); } function updateProgress(){ if(!Number.isFinite(audio.duration) || audio.duration <= 0) return; const percent = (audio.currentTime / audio.duration) * 100; progressBar.style.width = percent + '%'; progressDot.style.left = percent + '%'; current.textContent = formatTime(audio.currentTime); } function setPlaying(){ playIcon.style.display = 'none'; pauseIcon.style.display = 'block'; if(coverBox) coverBox.classList.add('playing'); } function setPaused(){ playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; if(coverBox) coverBox.classList.remove('playing'); } play.addEventListener('click', async function(){ try{ if(audio.paused){ await audio.play(); setPlaying(); }else{ audio.pause(); setPaused(); } }catch(e){ setPaused(); } }); rewindBtn.addEventListener('click', function(){ audio.currentTime = Math.max(0, audio.currentTime - 10); updateProgress(); }); forwardBtn.addEventListener('click', function(){ if(Number.isFinite(audio.duration)){ audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); updateProgress(); } }); loopBtn.addEventListener('click', function(){ audio.loop = !audio.loop; loopBtn.classList.toggle('active', audio.loop); }); shuffleBtn.addEventListener('click', function(){ shuffleBtn.classList.toggle('active'); }); likeBtn.addEventListener('click', function(){ likeBtn.classList.toggle('liked'); }); progress.addEventListener('pointerdown', function(e){ if(!Number.isFinite(audio.duration) || audio.duration <= 0) return; const rect = progress.getBoundingClientRect(); const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width)); audio.currentTime = (x / rect.width) * audio.duration; updateProgress(); }); audio.addEventListener('loadedmetadata', function(){ duration.textContent = formatTime(audio.duration); }); audio.addEventListener('timeupdate', updateProgress); audio.addEventListener('play', setPlaying); audio.addEventListener('pause', function(){ if(!audio.ended) setPaused(); }); audio.addEventListener('ended', function(){ setPaused(); progressBar.style.width = '0%'; progressDot.style.left = '0%'; current.textContent = '0:00'; }); ${skripLirik} })(); </script>`;
}
export {
    kartuMusik,
    audioDataUri,
    coverDataUri,
    lolos,
    BATAS_BASE64
};