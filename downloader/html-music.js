"use strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const API = "https://lrclib.net/api";
const UA = "ackles-bot/1.0 (+play lyrics)";
const DATA_DIR = path.join(process.cwd(), "src", "data", "lyrics");
const TIMEOUT_MS = 8000;
const TOLERANSI_DETIK = 4;
const BATAS_LIRIK = 8 * 1024;
const KATA_SAMPAH = /\b(official|officiel|music|musik|video|lyrics?|lirik|audio|mv|hd|4k|8k|visuali[sz]er|full album|clip|klip|terbaru|new)\b/gi;

function berkasCache(kunci) {
    const hash = crypto.createHash("sha1").update(kunci).digest("hex");
    return path.join(DATA_DIR, `${hash}.json`);
}

function bacaCache(kunci) {
    try {
        return JSON.parse(fs.readFileSync(berkasCache(kunci), "utf8"));
    } catch {
        return null;
    }
}

function tulisCache(kunci, isi) {
    try {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
        fs.writeFileSync(berkasCache(kunci), JSON.stringify(isi));
    } catch {}
}
const normal = (t) => String(t ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
export function pecahJudul(title, channel = "") {
    const bersih = String(title ?? "").replace(/[([{][^)\]}]*[)\]}]/g, " ").replace(KATA_SAMPAH, " ").replace(/\s{2,}/g, " ").trim();
    const bagian = bersih.split(/\s+[-–—|]\s+|\s+[-–—|]$|^[-–—|]\s+/).map((s) => s.trim()).filter(Boolean);
    if (bagian.length < 2) {
        return {
            artis: channel,
            judul: bersih || String(title ?? ""),
            tukar: true
        };
    }
    const ch = normal(channel);
    const kiri = normal(bagian[0]);
    const kanan = normal(bagian[1]);
    const mirip = (a) => a && ch && (a.includes(ch) || ch.includes(a));
    if (mirip(kiri)) return {
        artis: bagian[0],
        judul: bagian[1],
        tukar: false
    };
    if (mirip(kanan)) return {
        artis: bagian[1],
        judul: bagian[0],
        tukar: false
    };
    return {
        artis: bagian[0],
        judul: bagian[1],
        tukar: true
    };
}
export function parseLrc(lrc) {
    const keluar = [];
    for (const baris of String(lrc ?? "").split(/\r?\n/)) {
        const stempel = [...baris.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g), ];
        if (!stempel.length) continue;
        const teks = baris.replace(/\[[^\]]*\]/g, "").trim();
        for (const [, mm, ss, pecahan] of stempel) {
            const ms = pecahan ? Number(pecahan.padEnd(3, "0")) : 0;
            keluar.push({
                ms: Number(mm) * 60000 + Number(ss) * 1000 + ms,
                teks
            });
        }
    }
    return keluar.sort((a, b) => a.ms - b.ms);
}
async function ambilJson(url) {
    const ac = new AbortController();
    const jam = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": UA
            },
            signal: ac.signal,
        });
        if (res.status === 404) return null;
        if (!res.ok) return null;
        const isi = await res.json();
        return isi;
    } catch {
        return null;
    } finally {
        clearTimeout(jam);
    }
}
async function cariDekat(judul, artis, targetDetik) {
    const url = new URL(`${API}/search`);
    url.searchParams.set("track_name", judul);
    if (artis) url.searchParams.set("artist_name", artis);
    const hasil = await ambilJson(url);
    if (!Array.isArray(hasil)) return null;
    const bersinkron = hasil.filter((r) => r?.syncedLyrics);
    if (!bersinkron.length) return null;
    bersinkron.sort((a, b) => Math.abs((a.duration ?? 0) - targetDetik) - Math.abs((b.duration ?? 0) - targetDetik), );
    const terbaik = bersinkron[0];
    if (Math.abs((terbaik.duration ?? 0) - targetDetik) > TOLERANSI_DETIK) {
        return null;
    }
    return terbaik;
}
export async function cariLirik(video) {
    const targetDetik = Number(video?.duration?.seconds) || 0;
    if (!targetDetik) return null;
    const judulMentah = String(video?.title ?? "");
    const channel = String(video?.author?.name ?? "");
    const kunci = `${judulMentah}|${channel}|${targetDetik}`;
    const tersimpan = bacaCache(kunci);
    if (tersimpan) return tersimpan.hasil;
    const {
        artis,
        judul,
        tukar
    } = pecahJudul(judulMentah, channel);
    let hit = null;
    let sumber = "";
    const urlGet = new URL(`${API}/get`);
    urlGet.searchParams.set("artist_name", artis);
    urlGet.searchParams.set("track_name", judul);
    urlGet.searchParams.set("duration", String(targetDetik));
    const exact = await ambilJson(urlGet);
    if (exact?.syncedLyrics && !exact?.instrumental) {
        hit = exact;
        sumber = "get";
    }
    if (!hit) {
        const r = await cariDekat(judul, artis, targetDetik);
        if (r) {
            hit = r;
            sumber = "search";
        }
    }
    if (!hit && tukar) {
        const r = await cariDekat(artis, judul, targetDetik);
        if (r) {
            hit = r;
            sumber = "search-balik";
        }
    }
    if (!hit) {
        const r = await cariDekat(judul, "", targetDetik);
        const kataJudulVideo = new Set(normal(judulMentah).split(" "));
        const kataArtisHit = normal(r?.artistName).split(" ").filter(Boolean);
        const artisMasukAkal = kataArtisHit.length > 0 && (kataArtisHit.some((w) => w.length > 2 && kataJudulVideo.has(w)) || normal(channel).includes(kataArtisHit[0]));
        if (r && artisMasukAkal) {
            hit = r;
            sumber = "search-judul";
        }
    }
    if (!hit?.syncedLyrics || hit?.instrumental) {
        tulisCache(kunci, {
            hasil: null
        });
        return null;
    }
    const baris = parseLrc(hit.syncedLyrics);
    if (!baris.length) {
        tulisCache(kunci, {
            hasil: null
        });
        return null;
    }
    const hasil = {
        baris,
        artis: hit.artistName ?? artis,
        judul: hit.trackName ?? judul,
        durasi: hit.duration ?? 0,
        selisih: Math.round(Math.abs((hit.duration ?? 0) - targetDetik)),
        sumber,
    };
    while (JSON.stringify(hasil.baris).length > BATAS_LIRIK) {
        hasil.baris = hasil.baris.slice(0, Math.floor(hasil.baris.length * 0.8));
        if (hasil.baris.length < 4) {
            tulisCache(kunci, {
                hasil: null
            });
            return null;
        }
    }
    tulisCache(kunci, {
        hasil
    });
    return hasil;
}
export {
    TOLERANSI_DETIK,
    BATAS_LIRIK
};