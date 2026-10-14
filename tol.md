[5/10 00.53] null: /*
 * X/Twitter Downloader
 * type: Scraper
 * base url: x.com
 * author: wa.me/ikyykzy
 * note: ambil cdn url video + full statistik (caption, like, comment, save, dll)

 * request scrape bisa ke ikyykzy.t.me / wa.me/ikyykzy usahakan gaada cf/login(malas bypas (skill issue))
*/

const axios = require('axios');

const UA_BROWSER =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const http = axios.create({
  headers: { 'User-Agent': UA_BROWSER },
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: (s) => s < 500,
});

const HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'mobile.x.com',
  'fxtwitter.com',
  'vxtwitter.com',
  'fixupx.com',
]);

function parseTweetUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('URL kosong');

  if (/^\d+$/.test(raw)) return { id: raw, url: `https://x.com/i/status/${raw}` };

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u;
  try {
    u = new URL(withProto);
  } catch {
    throw new Error('URL tidak valid');
  }

  const host = u.hostname.toLowerCase();
  if (host === 'pic.twitter.com' || host === 't.co') {
    const inner = u.searchParams.get('s') || u.searchParams.get('url');
    if (inner) return parseTweetUrl(inner);
  }
  if (!HOSTS.has(host)) throw new Error(`Host tidak didukung: ${host}`);

  const m = /\/status(?:es)?\/(\d+)/.exec(u.pathname) || /\/(\d+)$/.exec(u.pathname);
  if (!m) throw new Error('Tweet ID tidak ditemukan di URL');

  const id = m[1];
  const user = /(?:^|\/)(?:i\/web\/)?([A-Za-z0-9_]{1,15})(?:\/|$)/.exec(u.pathname.replace(/^\/+/, ''));
  const screen = u.pathname.split('/').filter(Boolean)[0];
  const isUserPath = screen && !['i', 'status', 'statuses', 'home', 'explore'].includes(screen);

  return {
    id,
    url: isUserPath ? `https://x.com/${screen}/status/${id}` : `https://x.com/i/status/${id}`,
    user: isUserPath ? screen : null,
    hint: user ? user[1] : null,
  };
}

function syndicationToken(id) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

const stripTco = (text) => String(text || '').replace(/\s*https?:\/\/t\.co\/\w+\s*$/u, '').trim();

function extractEntities(text) {
  const t = String(text || '');
  return {
    hashtags: [...new Set([...t.matchAll(/#(\p{L}\w+)/gu)].map((m) => m[1]))],
    mentions: [...new Set([...t.matchAll(/@(\w+)/g)].map((m) => m[1]))],
    urls: [...new Set([...t.matchAll(/https?:\/\/[^\s]+/g)].map((m) => m[0]))],
  };
}

function buildVariants(list) {
  const seen = new Set();
  const out = [];
  for (const v of list || []) {
    if (!v || !v.url) continue;
    const isMp4 = v.container === 'mp4' || v.content_type === 'video/mp4' || /\/vid\//.test(v.url);
    const isHls = v.container === 'm3u8' || v.content_type === 'application/x-mpegURL' || /\.m3u8/.test(v.url);
    if (!isMp4 && !isHls) continue;
    if (seen.has(v.url)) continue;
    seen.add(v.url);

    const res = v.resolution || (/\/(\d{2,4})x(\d{2,4})\//.exec(v.url) || []).slice(1).join('x') || null;
    out.push({
      url: v.url,
      type: isMp4 ? 'mp4' : 'm3u8',
      resolution: res || null,
      bitrate: typeof v.bitrate === 'number' && v.bitrate > 0 ? v.bitrate : null,
      codec: v.codec || null,
    });
  }
  out.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  return out;
}

function bestCdn(variants) {
  const mp4 = variants.filter((v) => v.type === 'mp4');
  if (mp4.length) return mp4[0].url;
  return variants.length ? variants[0].url : null;
}

function photoCdn(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'pbs.twimg.com') u.searchParams.set('name', 'orig');
    return u.toString();
  } catch {
    return url;
  }
}

function normalizeFx(raw) {
  const t = raw.tweet;
  const caption = stripTco(t.text || t.raw_text?.text || '');
  const media = (t.media?.all || []).map((m, i) => {
    const variants = buildVariants(
      (m.formats || []).map((f) => ({
        url: f.url,
        container: f.container,
        bitrate: f.bitrate,
        codec: f.codec,
      })).concat(
        (m.variants || []).map((v) => ({ url: v.url, content_type: v.content_type, bitrate: v.bitrate }))
      )
    );
    return {
      index: i + 1,
      id: m.id || null,
      type: m.type || 'photo',
      width: m.width || null,
      height: m.height || null,
      duration_seconds: typeof m.duration === 'number' ? m.duration : null,
      thumbnail: m.type === 'photo' ? photoCdn(m.thumbnail_url || m.url) : (m.thumbnail_url || m.url || null),
      alt_text: m.alt_text || m.altText || null,
      cdn_url: bestCdn(variants) || (m.type === 'photo' ? photoCdn(m.url) : null),
      variants,
    };
  });

  return {
    source: 'fxtwitter',
    id: t.id,
    url: t.url,
    created_at: t.created_at || null,
    created_timestamp: t.created_timestamp || null,
    lang: t.lang || null,
    possibly_sensitive: !!t.possibly_sensitive,
    community_note: t.community_note || null,
    caption: { text: caption, raw: t.text || null, ...extractEntities(caption) },
    author: {
      id: t.author?.id || null,
      name: t.author?.name || null,
      username: t.author?.screen_name || null,
      url: t.author?.url || null,
      avatar: t.author?.avatar_url || null,
      verified: !!t.author?.verification?.verified,
      verification_type: t.author?.verification?.type || null,
      followers: t.author?.followers ?? null,
      following: t.author?.following ?? null,
      likes: t.author?.likes ?? null,
      media_count: t.author?.media_count ?? null,
      joined: t.author?.joined || null,
      protected: !!t.author?.protected,
    },
    stats: {
      like: t.likes ?? null,
      comment: t.replies ?? null,
      save: t.bookmarks ?? null,
      retweet: t.retweets ?? null,
      quote: t.quotes ?? null,
      view: t.views ?? null,
    },
    media,
    has_video: media.some((m) => m.type === 'video' || m.type === 'gif'),
    note_tweet: t.is_note_tweet ? t.raw_text?.text || t.text : null,
  };
}

function normalizeSynd(raw) {
  const caption = stripTco(raw.text || '');
  const details = raw.mediaDetails || [];
  const photos = raw.photos || [];

  const media = details.map((m, i) => {
    const variants = buildVariants(
      (m.video_info?.variants || []).map((v) => ({
        url: v.url,
        content_type: v.content_type,
        bitrate: v.bitrate,
      }))
    );
    return {
      index: i + 1,
      id: m.id_str || null,
      type: m.type || 'photo',
      width: m.original_info?.width || null,
      height: m.original_info?.height || null,
      duration_seconds: m.video_info?.duration_millis
        ? Math.round(m.video_info.duration_millis / 100) / 10
        : null,
      thumbnail: m.media_url_https || null,
      alt_text: m.ext_alt_text || null,
      cdn_url: bestCdn(variants) || (m.type === 'photo' ? photoCdn(m.media_url_https) : null),
      variants,
    };
  });

  const keyOf = (v) => String(v || '').split('?')[0];
  const seen = new Set();
  for (const m of media) {
    if (m.id) seen.add(String(m.id));
    seen.add(keyOf(m.thumbnail));
    seen.add(keyOf(m.cdn_url));
  }
  photos.forEach((p) => {
    const url = photoCdn(p.media_url_https || p.url);
    const id = p.id_str ? String(p.id_str) : null;
    const k = keyOf(p.media_url_https || p.url);
    if ((id && seen.has(id)) || seen.has(k)) return;
    if (id) seen.add(id);
    seen.add(k);
    media.push({
      index: media.length + 1,
      id: p.id_str || null,
      type: 'photo',
      width: p.original_info?.width || p.width || null,
      height: p.original_info?.height || p.height || null,
      duration_seconds: null,
      thumbnail: url,
      alt_text: p.ext_alt_text || null,
      cdn_url: url,
      variants: [],
    });
  });

  return {
    source: 'syndication',
    id: raw.id_str,
    url: raw.url || null,
    created_at: raw.created_at || null,
    created_timestamp: raw.created_at ? Math.floor(new Date(raw.created_at).getTime() / 1000) : null,
    lang: raw.lang || null,
    possibly_sensitive: !!raw.possibly_sensitive,
    community_note: null,
    caption: { text: caption, raw: raw.text || null, ...extractEntities(caption) },
    author: {
      id: raw.user?.id_str || null,
      name: raw.user?.name || null,
      username: raw.user?.screen_name || null,
      url: raw.user?.screen_name ? `https://x.com/${raw.user.screen_name}` : null,
      avatar: raw.user?.profile_image_url_https || null,
      verified: !!raw.user?.verified,
      verification_type: raw.user?.is_blue_verified ? 'blue' : null,
      followers: null,
      following: null,
      likes: null,
      media_count: null,
      joined: null,
      protected: false,
    },
    stats: {
      like: raw.favorite_count ?? null,
      comment: raw.conversation_count ?? null,
      save: null,
      retweet: raw.retweet_count ?? null,
      quote: raw.quote_count ?? null,
      view: null,
    },
    media,
    has_video: !!raw.video || media.some((m) => m.type === 'video' || m.type === 'gif'),
    note_tweet: null,
  };
}

function normalizeVx(raw) {
  const caption = stripTco(raw.text || '');
  const media = (raw.media_extended || []).map((m, i) => {
    const variants = buildVariants([{ url: m.url, content_type: m.type === 'video' ? 'video/mp4' : null }]);
    return {
      index: i + 1,
      id: m.id_str || null,
      type: m.type || 'photo',
      width: m.size?.width || null,
      height: m.size?.height || null,
      duration_seconds: m.duration_millis ? Math.round(m.duration_millis / 100) / 10 : null,
      thumbnail: m.type === 'photo' ? photoCdn(m.thumbnail_url || m.url) : m.thumbnail_url || null,
      alt_text: m.altText || null,
      cdn_url: bestCdn(variants) || (m.type === 'photo' ? photoCdn(m.url) : m.url) || null,
      variants,
    };
  });

  return {
    source: 'vxtwitter',
    id: raw.tweetID,
    url: raw.tweetURL || null,
    created_at: raw.date || null,
    created_timestamp: raw.date_epoch || null,
    lang: raw.lang || null,
    possibly_sensitive: !!raw.possibly_sensitive,
    community_note: raw.communityNote || null,
    caption: { text: caption, raw: raw.text || null, ...extractEntities(caption) },
    author: {
      id: null,
      name: raw.user_name || null,
      username: raw.user_screen_name || null,
      url: raw.user_screen_name ? `https://x.com/${raw.user_screen_name}` : null,
      avatar: raw.user_profile_image_url || null,
      verified: false,
      verification_type: null,
      followers: null,
      following: null,
      likes: null,
      media_count: null,
      joined: null,
      protected: false,
    },
    stats: {
      like: raw.likes ?? null,
      comment: raw.replies ?? null,
      save: null,
      retweet: raw.retweets ?? null,
      quote: null,
      view: null,
    },
    media,
    has_video: media.some((m) => m.type === 'video' || m.type === 'gif'),
    note_tweet: null,
  };
}

async function fetchFx(id) {
  const res = await http.get(`https://api.fxtwitter.com/status/${id}`);
  if (res.status !== 200 || res.data?.code !== 200 || !res.data?.tweet) {
    throw new Error(`fxtwitter http ${res.status}`);
  }
  return normalizeFx(res.data);
}

async function fetchSynd(id) {
  const token = syndicationToken(id);
  const res = await http.get('https://cdn.syndication.twimg.com/tweet-result', {
    params: { id, token, lang: 'id' },
  });
  if (res.status !== 200 || !res.data || res.data.__typename === 'TweetTombstone') {
    throw new Error(`syndication http ${res.status}`);
  }
  return normalizeSynd(res.data);
}

async function fetchVx(id, screen) {
  const res = await http.get(`https://api.vxtwitter.com/${screen || 'i'}/status/${id}`, {
    headers: { 'User-Agent': 'TwitterAndroid/10.45.1' },
  });
  if (res.status !== 200 || !res.data?.tweetID) throw new Error(`vxtwitter http ${res.status}`);
  return normalizeVx(res.data);
}

function merge(primary, extras) {
  const out = { ...primary };
  const sources = [primary.source];

  out.stats = { ...primary.stats };
  for (const e of extras) {
    if (!e) continue;
    sources.push(e.source);
    for (const k of Object.keys(out.stats)) {
      if (out.stats[k] === null || out.stats[k] === undefined) out.stats[k] = e.stats[k] ?? null;
    }
    if (!out.author.avatar) out.author.avatar = e.author.avatar;
    if (!out.author.verified && e.author.verified) {
      out.author.verified = true;
      out.author.verification_type = e.author.verification_type;
    }
    if (out.author.followers === null) out.author.followers = e.author.followers;
    if (out.media.length < e.media.length && e.media.length) {
      const byId = new Map(e.media.map((m) => [m.id, m]));
      for (const m of out.media) if (m.id && byId.has(m.id)) Object.assign(m, { ...byId.get(m.id), index: m.index });
      if (!out.media.length) out.media = e.media;
    }
  }

  out.sources = [...new Set(sources)];
  return out;
}

async function verifyCdn(url) {
  if (!url) return { ok: false, error: 'tidak ada cdn url' };
  try {
    const res = await axios.head(url, {
      headers: { 'User-Agent': UA_BROWSER, Referer: 'https://x.com/' },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      content_type: res.headers['content-type'] || null,
      content_length: Number(res.headers['content-length']) || null,
      error: res.status >= 400 ? `HTTP ${res.status}` : null,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function scrapeTwitter(input) {
  const parsed = parseTweetUrl(input);

  const ctx = { id: parsed.id, screen: parsed.user };
  const attempts = [
    ['fxtwitter', () => fetchFx(ctx.id)],
    ['syndication', () => fetchSynd(ctx.id)],
    ['vxtwitter', () => fetchVx(ctx.id, ctx.screen)],
  ];

  const results = [];
  const errors = [];
  for (const [name, fn] of attempts) {
    try {
      const r = await fn();
      results.push(r);
      if (!ctx.screen && r.author?.username) ctx.screen = r.author.username;
    } catch (e) {
      errors.push({ source: name, error: e.message });
    }
    if (results.length >= 2 && results[0]?.source === 'fxtwitter') break;
  }

  if (!results.length) throw new Error(`Gagal mengambil tweet: ${errors.map((e) => `${e.source}(${e.error})`).join(', ')}`);

  const primary = results[0];
  const merged = merge(primary, results.slice(1));

  const cdnUrl =
    merged.media.find((m) => m.type === 'video' || m.type === 'gif')?.cdn_url ||
    merged.media[0]?.cdn_url ||
    null;

  const hdUrl =
    merged.media
      .flatMap((m) => m.variants)
      .filter((v) => v.type === 'mp4' && v.resolution && Number(v.resolution.split('x')[0]) >= 720)
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]?.url || cdnUrl;

  const verification = await verifyCdn(cdnUrl);

  return {
    ok: true,
    input,
    tweet: {
      id: merged.id,
      url: merged.url || parsed.url,
      created_at: merged.created_at,
      created_timestamp: merged.created_timestamp,
      lang: merged.lang,
      possibly_sensitive: merged.possibly_sensitive,
      community_note: merged.community_note,
      caption: merged.caption,
      author: merged.author,
      stats: merged.stats,
      has_video: merged.has_video,
      note_tweet: merged.note_tweet,
    },
    media: merged.media,
    cdn: {
      best: cdnUrl,
      hd: hdUrl,
      thumbnail: merged.media.find((m) => m.thumbnail)?.thumbnail || null,
      count: merged.media.length,
    },
    verification,
    source: merged.sources,
    errors: errors.length ? errors : undefined,
    fetched_at: new Date().toISOString(),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const target = args.find((a) => /^https?:\/\//.test(a) || /^\d+$/.test(a));

  if (!target) {
    console.log(
      JSON.stringify(
        { ok: false, error: 'Usage: node twitter.js <x-status-url|tweet-id>' },
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    const result = await scrapeTwitter(target);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, url: target, error: e.message }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { scrapeTwitter, parseTweetUrl };

//RESULT
/*
video
{
  "ok": true,
  "input": "https://x.com/1alemikelam/status/2106459255695974810",
  "tweet": {
    "id": "2106459255695974810",
    "url": "https://x.com/1alemikelam/status/2106459255695974810",
    "created_at": "Sat Oct 03 18:59:57 +0000 2026",
    "created_timestamp": 1791053997,
    "lang": "tr",
    "possibly_sensitive": false,
    "community_note": null,
    "caption": {
      "text": "\"Her insan yağmur damlası gibidir, kimisi çamura, kimisi gül yaprağına, düşer...\"",
      "raw": "\"Her insan yağmur damlası gibidir, kimisi çamura, kimisi gül yaprağına, düşer...\"",
      "hashtags": [],
      "mentions": [],
      "urls": []
    },
    "author": {
      "id": "366786161",
      "name": "Söz Dünyası",
      "username": "1alemikelam",
      "url": "https://x.com/1alemikelam",
      "avatar": "https://pbs.twimg.com/profile_images/1592234329022889989/3OBR2PWz_200x200.jpg",
      "verified": true,
      "verification_type": "individual",
      "followers": 144556,
      "following": 10956,
      "likes": 107037,
      "media_count": 4107,
      "joined": "Fri Sep 02 20:33:10 +0000 2011",
      "protected": false
    },
    "stats": {
      "like": 1937,
      "comment": 9,
      "save": 617,
      "retweet": 322,
      "quote": 18,
      "view": 116989
    },
    "has_video": true,
    "note_tweet": null
  },
  "media": [
    {
      "index": 1,
      "id": "2106459193167282176",
      "type": "video",
      "width": 720,
      "height": 1280,
      "duration_seconds": 25.123,
      "thumbnail": "https://pbs.twimg.com/amplify_video_thumb/2106459193167282176/img/6IrXjf4Bu3-cyyAo.jpg",
      "alt_text": null,
      "cdn_url": "https://video.twimg.com/amplify_video/2106459193167282176/vid/avc1/720x1280/spRwWfqXYgRbNEHo.mp4?tag=29",
      "variants": [
        {
          "url": "https://video.twimg.com/amplify_video/2106459193167282176/vid/avc1/720x1280/spRwWfqXYgRbNEHo.mp4?tag=29",
          "type": "mp4",
          "resolution": "720x1280",
          "bitrate": 2176000,
          "codec": "h264"
        },
        {
          "url": "https://video.twimg.com/amplify_video/2106459193167282176/vid/avc1/480x852/cGV-Ev8l1TWXG7gR.mp4?tag=29",
          "type": "mp4",
          "resolution": "480x852",
          "bitrate": 950000,
          "codec": "h264"
        },
        {
          "url": "https://video.twimg.com/amplify_video/2106459193167282176/vid/avc1/320x568/fBd11x7cWdyJjpjx.mp4?tag=29",
          "type": "mp4",
          "resolution": "320x568",
          "bitrate": 632000,
          "codec": "h264"
        },
        {
          "url": "https://video.twimg.com/amplify_video/2106459193167282176/pl/tEJxJEexlqtnRUYU.m3u8?tag=29&v=cfc",
          "type": "m3u8",
          "resolution": null,
          "bitrate": null,
          "codec": null
        }
      ]
    }
  ],
  "cdn": {
    "best": "https://video.twimg.com/amplify_video/2106459193167282176/vid/avc1/720x1280/spRwWfqXYgRbNEHo.mp4?tag=29",
    "hd": "https://video.twimg.com/amplify_video/2106459193167282176/vid/avc1/720x1280/spRwWfqXYgRbNEHo.mp4?tag=29",
    "thumbnail": "https://pbs.twimg.com/amplify_video_thumb/2106459193167282176/img/6IrXjf4Bu3-cyyAo.jpg",
    "count": 1
  },
  "verification": {
    "ok": true,
    "status": 200,
    "content_type": "video/mp4",
    "content_length": 5176889,
    "error": null
  },
  "source": [
    "fxtwitter",
    "syndication"
  ],
  "fetched_at": "2026-10-04T17:40:51.330Z"
}
*/

/*
image
{
  "ok": true,
  "input": "https://x.com/Baggie_Nsk/status/2106466624374997081",
  "tweet": {
    "id": "2106466624374997081",
    "url": "https://x.com/Baggie_Nsk/status/2106466624374997081",
    "created_at": "Sat Oct 03 19:29:14 +0000 2026",
    "created_timestamp": 1791055754,
    "lang": null,
    "possibly_sensitive": false,
    "community_note": null,
    "caption": {
      "text": "",
      "raw": null,
      "hashtags": [],
      "mentions": [],
      "urls": []
    },
    "author": {
      "id": "2010159094884380674",
      "name": "Baggie NSK",
      "username": "Baggie_Nsk",
      "url": "https://x.com/Baggie_Nsk",
      "avatar": "https://pbs.twimg.com/profile_images/2066560997523918848/tcw868-4_200x200.jpg",
      "verified": true,
      "verification_type": "individual",
      "followers": 1727,
      "following": 1484,
      "likes": 4241,
      "media_count": 1126,
      "joined": "Sun Jan 11 01:19:03 +0000 2026",
      "protected": false
    },
    "stats": {
      "like": 8787,
      "comment": 7,
      "save": 141,
      "retweet": 766,
      "quote": 2,
      "view": 67176
    },
    "has_video": false,
    "note_tweet": null
  },
  "media": [
    {
      "index": 1,
      "id": "2106466584147505153",
      "type": "photo",
      "width": 720,
      "height": 720,
      "duration_seconds": null,
      "thumbnail": "https://pbs.twimg.com/media/HTusMp9XsAEPD9q.jpg?name=orig",
      "alt_text": null,
      "cdn_url": "https://pbs.twimg.com/media/HTusMp9XsAEPD9q.jpg?name=orig",
      "variants": []
    }
  ],
  "cdn": {
    "best": "https://pbs.twimg.com/media/HTusMp9XsAEPD9q.jpg?name=orig",
    "hd": "https://pbs.twimg.com/media/HTusMp9XsAEPD9q.jpg?name=orig",
    "thumbnail": "https://pbs.twimg.com/media/HTusMp9XsAEPD9q.jpg?name=orig",
    "count": 1
  },
  "verification": {
    "ok": true,
    "status": 200,
    "content_type": "image/jpeg",
    "content_length": 72015,
    "error": null
  },
  "source": [
    "fxtwitter",
    "syndication"
  ],
  "fetched_at": "2026-10-04T17:43:50.570Z"
}
*/

/*
slide
{
  "ok": true,
  "input": "https://x.com/nopiiee__/status/2106635673155543249",
  "tweet": {
    "id": "2106635673155543249",
    "url": "https://x.com/nopiiee__/status/2106635673155543249",
    "created_at": "Sun Oct 04 06:40:58 +0000 2026",
    "created_timestamp": 1791096058,
    "lang": "in",
    "possibly_sensitive": false,
    "community_note": null,
    "caption": {
      "text": "😭😭😭\n\nStatusnya                yg bikin status",
      "raw": "😭😭😭\n\nStatusnya                yg bikin status",
      "hashtags": [],
      "mentions": [],
      "urls": []
    },
    "author": {
      "id": "1539458338974355456",
      "name": "piee",
      "username": "nopiiee__",
      "url": "https://x.com/nopiiee__",
      "avatar": "https://pbs.twimg.com/profile_images/2106691904251555840/kPzKrA-K_200x200.jpg",
      "verified": true,
      "verification_type": "individual",
      "followers": 7286,
      "following": 2164,
      "likes": 31882,
      "media_count": 4369,
      "joined": "Wed Jun 22 04:01:09 +0000 2022",
      "protected": false
    },
    "stats": {
      "like": 1564,
      "comment": 35,
      "save": 168,
      "retweet": 203,
      "quote": 9,
      "view": 265900
    },
    "has_video": true,
    "note_tweet": null
  },
  "media": [
    {
      "index": 1,
      "id": "2106635363834077185",
      "type": "photo",
      "width": 719,
      "height": 1010,
      "duration_seconds": null,
      "thumbnail": "https://pbs.twimg.com/media/HTxFs7SbIAEAURe.jpg?name=orig",
      "alt_text": null,
      "cdn_url": "https://pbs.twimg.com/media/HTxFs7SbIAEAURe.jpg?name=orig",
      "variants": []
    },
    {
      "index": 2,
      "id": "2106635554767228928",
      "type": "video",
      "width": 576,
      "height": 1024,
      "duration_seconds": 27.4,
      "thumbnail": "https://pbs.twimg.com/amplify_video_thumb/2106635554767228928/img/MH2pibJdL5U8Dk8-.jpg",
      "alt_text": null,
      "cdn_url": "https://video.twimg.com/amplify_video/2106635554767228928/vid/avc1/576x1024/WgKT4opXGS_I_Q5D.mp4?tag=29",
      "variants": [
        {
          "url": "https://video.twimg.com/amplify_video/2106635554767228928/vid/avc1/576x1024/WgKT4opXGS_I_Q5D.mp4?tag=29",
          "type": "mp4",
          "resolution": "576x1024",
          "bitrate": 2176000,
          "codec": "h264"
        },
        {
          "url": "https://video.twimg.com/amplify_video/2106635554767228928/vid/avc1/480x852/NtnObNX2l_Owa2Kv.mp4?tag=29",
          "type": "mp4",
          "resolution": "480x852",
          "bitrate": 950000,
          "codec": "h264"
        },
        {
          "url": "https://video.twimg.com/amplify_video/2106635554767228928/vid/avc1/320x568/c3NyrFy_u2L9_O9-.mp4?tag=29",
          "type": "mp4",
          "resolution": "320x568",
          "bitrate": 632000,
          "codec": "h264"
        },
        {
          "url": "https://video.twimg.com/amplify_video/2106635554767228928/pl/FDY_kn3rKEs42lVU.m3u8?tag=29",
          "type": "m3u8",
          "resolution": null,
          "bitrate": null,
          "codec": null
        }
      ]
    }
  ],
  "cdn": {
    "best": "https://video.twimg.com/amplify_video/2106635554767228928/vid/avc1/576x1024/WgKT4opXGS_I_Q5D.mp4?tag=29",
    "hd": "https://video.twimg.com/amplify_video/2106635554767228928/vid/avc1/576x1024/WgKT4opXGS_I_Q5D.mp4?tag=29",
    "thumbnail": "https://pbs.twimg.com/media/HTxFs7SbIAEAURe.jpg?name=orig",
    "count": 2
  },
  "verification": {
    "ok": true,
    "status": 200,
    "content_type": "video/mp4",
    "content_length": 2995906,
    "error": null
  },
  "source": [
    "fxtwitter",
    "syndication"
  ],
  "fetched_at": "2026-10-04T17:45:48.257Z"
}
*/
[5/10 17.51] null: /*
 * YouTube Downloader
 * type: Scraper
 * base: YouTube InnerTube (ANDROID + WEB) / Invidious / Piped fallback
 * author: wa.me/ikyykzy
 * note: buat download video youtube & shorts & music & post. support shorts, video biasa,
 *       music.youtube.com, youtu.be, watch, embed, live, post (image/slide).
 *       get cdn url + full stats (caption, like, comment, view, save, dll).
 *       tanpa yt-dlp, murni nodejs (axios). lihat bagian bawah/akhir kode untuk penjelasan. 
 */

const axios = require('axios');
const { URL } = require('url');

const UA_BROWSER = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';
const UA_ANDROID = 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip';
const UA_EMBED = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const WEB_VERSION = '2.20260923.00.00';

const ANDROID_CTX = {
  clientName: 'ANDROID',
  clientVersion: '20.10.38',
  hl: 'en',
  gl: 'US',
  androidSdkVersion: 30,
  osName: 'Android',
  osVersion: '11',
  platform: 'MOBILE',
  clientFormFactor: 'SMALL_FORM_FACTOR',
  userAgent: UA_ANDROID,
};

const IOS_CTX = {
  clientName: 'IOS',
  clientVersion: '20.10.38',
  hl: 'en',
  gl: 'US',
  deviceMake: 'Apple',
  deviceModel: 'iPhone16,2',
  osName: 'iPhone',
  osVersion: '17.5.1.21F90',
  platform: 'MOBILE',
  clientFormFactor: 'SMALL_FORM_FACTOR',
  userAgent: 'com.google.ios.youtube/20.10.38 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)',
};

const WEB_CTX = { clientName: 'WEB', clientVersion: WEB_VERSION, hl: 'en', gl: 'US' };

const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://invidious.snopyta.org',
  'https://invidious.kavin.rocks',
  'https://invidious.projectsegfau.lt',
  'https://invidious.privacyredirect.com',
];

const PIPED_INSTANCES = [
  'https://piped.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://piped.rishabh3354.dev',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, retries = 3, baseDelay = 1000) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status || err.status;
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || i === retries - 1) throw err;
      await sleep(baseDelay * (i + 1));
    }
  }
  throw lastErr;
}

function extractVideoId(url) {
  const u = new URL(url.startsWith('http') ? url : `https://${url}`);
  const host = u.hostname.toLowerCase();

  const isYT = host.includes('youtube.com')
    || host.includes('youtu.be')
    || host.includes('youtube-nocookie.com');

  if (!isYT) return null;

  // music.youtube.com, m.youtube.com, www.youtube.com -> sama
  if (u.pathname.includes('/shorts/')) {
    return u.pathname.split('/shorts/')[1].split('/')[0].split('?')[0];
  }
  if (u.pathname.includes('/watch')) {
    return u.searchParams.get('v');
  }
  if (u.pathname.includes('/live/')) {
    return u.pathname.split('/live/')[1].split('/')[0].split('?')[0];
  }
  if (u.pathname.includes('/v/')) {
    return u.pathname.split('/v/')[1].split('/')[0].split('?')[0];
  }
  if (host === 'youtu.be') {
    return u.pathname.slice(1).split('?')[0].split('/')[0] || null;
  }
  if (u.pathname.includes('/embed/')) {
    return u.pathname.split('/embed/')[1].split('?')[0].split('/')[0];
  }
  // fallback: ?v= di domain apapun (music, nocookie, dll)
  const v = u.searchParams.get('v');
  if (v) return v;
  return null;
}

function isMusicSourceUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.toLowerCase().includes('music.youtube.com');
  } catch {
    return false;
  }
}

// ---------- Post (community) ----------

function extractPostId(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    if (!host.includes('youtube.com') && !host.includes('youtu.be')) return null;
    // /post/<id>  (youtube.com/post/xxx, www.youtube.com/post/xxx)
    if (u.pathname.includes('/post/')) {
      const id = u.pathname.split('/post/')[1].split('/')[0].split('?')[0].trim();
      if (id && /^[A-Za-z0-9_-]{5,}$/.test(id)) return id;
    }
    return null;
  } catch {
    return null;
  }
}

function isPostUrl(url) {
  return Boolean(extractPostId(url));
}

function parseVoteTextId(text) {
  // "4 rb", "7,7 rb", "1,2 jt", "12K", "1.5M" (id + en)
  if (text === null || text === undefined) return null;
  let s = String(text).trim().toLowerCase().replace(/\u00a0/g, ' ');
  if (!s) return null;
  // normalisasi indonesia: rb=ribu(K), jt=juta(M), mdr=miliar(B)
  s = s.replace(/\brb\b/g, 'K').replace(/\bribu\b/g, 'K')
    .replace(/\bjt\b/g, 'M').replace(/\bjuta\b/g, 'M')
    .replace(/\bmdr\b/g, 'B').replace(/\bmiliar\b/g, 'B');
  // koma desimal id -> titik: "7,7K" -> "7.7K"
  const m = s.replace(/\s+/g, '').match(/^([\d.,]+)([KMB])?$/i);
  if (!m) {
    const n = Number(String(text).replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  let numStr = m[1];
  // kalau ada koma dan titik dua-duanya, anggap titik ribuan koma desimal: "4.059" -> 4059
  if (numStr.includes('.') && numStr.includes(',')) {
    numStr = numStr.replace(/\./g, '').replace(',', '.');
  } else if (numStr.includes(',') && !numStr.includes('.')) {
    // "7,7" -> "7.7", tapi "4,059" -> "4059" kalau koma sebagai ribuan (3 digit di belakang)
    const parts = numStr.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      numStr = parts.join('');
    } else {
      numStr = numStr.replace(',', '.');
    }
  } else {
    // hapus titik ribuan: "4.059" tanpa suffix -> 4059
    if (!m[2] && /^\d{1,3}(\.\d{3})+$/.test(numStr)) numStr = numStr.replace(/\./g, '');
  }
  let n = parseFloat(numStr);
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || '').toUpperCase();
  if (suf === 'K') n *= 1e3;
  else if (suf === 'M') n *= 1e6;
  else if (suf === 'B') n *= 1e9;
  return Math.round(n);
}

function parsePostExactLike(accessibilityLabel) {
  // "Sukai postingan ini bersama 4.059 orang lainnya" / "Like this post along with 7,786 others"
  if (!accessibilityLabel) return null;
  const s = String(accessibilityLabel);
  const m = s.match(/bersama\s+([\d.,]+)/i) || s.match(/along with\s+([\d,.,]+)/i);
  if (!m) return null;
  let numStr = m[1];
  if (numStr.includes('.') && numStr.includes(',')) {
    numStr = numStr.replace(/[.,]/g, (c, i, arr) => (c === ',' ? '.' : ''));
    // "4.059" id -> hapus titik ribuan
    numStr = m[1].replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/\./g, '');
  } else if (/^\d{1,3}(,\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/,/g, '');
  } else {
    numStr = numStr.replace(',', '.');
  }
  const n = Number(numStr.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function pickLargestThumb(thumbs) {
  if (!Array.isArray(thumbs) || !thumbs.length) return null;
  const list = thumbs.filter(t => t && t.url).map(t => ({
    url: String(t.url).startsWith('//') ? 'https:' + t.url : String(t.url),
    width: t.width || null,
    height: t.height || null,
    area: (Number(t.width) || 0) * (Number(t.height) || 0),
  }));
  if (!list.length) return null;
  list.sort((a, b) => b.area - a.area);
  return list[0];
}

async function fetchPostHtml(postId) {
  const url = `https://www.youtube.com/post/${postId}`;
  const res = await withRetry(() => axios.get(url, {
    headers: {
      'User-Agent': UA_BROWSER,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    timeout: 20000,
  }));
  return String(res.data || '');
}

function extractBalancedJson(str, startIdx) {
  // startIdx = posisi '{'. kembalikan substring JSON seimbang, hormati string "..." & escape
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = startIdx; i < str.length; i++) {
    const c = str[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return str.slice(startIdx, i + 1);
    }
  }
  return null;
}

function parsePostInitialData(html) {
  // format 1 (lama): ytInitialData = '\x7b...';
  const mSingle = html.match(/ytInitialData\s*=\s*'((?:\\.|[^'])*)';/s);
  if (mSingle) {
    const raw = mSingle[1];
    let jsonStr;
    try {
      jsonStr = (new Function('return ' + "'" + raw + "'"))();
    } catch {
      throw new Error('Gagal decode ytInitialData.');
    }
    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error('Gagal parse ytInitialData JSON.');
    }
  }
  // format 2 (baru): ytInitialData = {"responseContext":...};
  const idx = html.indexOf('ytInitialData');
  if (idx >= 0) {
    const eq = html.indexOf('=', idx);
    const brace = eq >= 0 ? html.indexOf('{', eq) : -1;
    if (brace >= 0) {
      const jsonStr = extractBalancedJson(html, brace);
      if (jsonStr) {
        try {
          return JSON.parse(jsonStr);
        } catch {
          throw new Error('Gagal parse ytInitialData JSON langsung.');
        }
      }
    }
  }
  throw new Error('ytInitialData tidak ditemukan. Post mungkin privat/terhapus atau YouTube mengubah layout.');
}

function parsePostRenderer(data) {
  const secs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (!secs?.length) return null;
  const thread = secs[0]?.itemSectionRenderer?.contents?.[0]?.backstagePostThreadRenderer;
  const post = thread?.post?.backstagePostRenderer;
  if (!post?.postId) return null;
  return { post, microformat: data?.microformat?.microformatDataRenderer || null };
}

async function verifyImageUrl(url) {
  const out = { ok: false, status: null, content_type: null, bytes: 0, container: null, error: null };
  if (!url) { out.error = 'URL tidak tersedia'; return out; }
  try {
    const head = await axios.head(url, {
      timeout: 15000,
      validateStatus: s => s < 500,
      headers: { 'User-Agent': UA_BROWSER, Referer: 'https://www.youtube.com/' },
    });
    out.status = head.status;
    out.content_type = head.headers['content-type'] || null;
  } catch (err) {
    out.error = err.message;
  }
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      validateStatus: s => s < 500,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': UA_BROWSER, Referer: 'https://www.youtube.com/', Range: 'bytes=0-2047' },
    });
    const buf = Buffer.from(res.data || []);
    out.bytes = buf.length;
    if (!out.status) out.status = res.status;
    if (!out.content_type) out.content_type = res.headers['content-type'] || null;
    // deteksi gambar: jpeg/png/webp/gif
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) out.container = 'jpeg';
    else if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) out.container = 'png';
    else if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') out.container = 'webp';
    else if (buf.slice(0, 6).toString('latin1').startsWith('GIF')) out.container = 'gif';
    else out.container = sniffContainer(buf) !== 'unknown' ? sniffContainer(buf) : 'unknown';
    const isImg = /^image\//i.test(out.content_type || '') || ['jpeg', 'png', 'webp', 'gif'].includes(out.container);
    out.ok = (res.status === 200 || res.status === 206) && buf.length > 0 && isImg;
    if (!out.ok && !out.error) out.error = !isImg ? 'isi bukan gambar' : `http ${res.status}`;
  } catch (err) {
    out.error = out.error || err.message;
  }
  return out;
}

async function youtubePostDL(inputUrl) {
  const startedAt = new Date().toISOString();
  const postId = extractPostId(inputUrl);
  if (!postId) throw new Error('Invalid YouTube Post URL. Could not extract post ID.');

  const html = await fetchPostHtml(postId);
  const data = parsePostInitialData(html);
  const parsed = parsePostRenderer(data);
  if (!parsed) throw new Error('Post tidak ditemukan. Mungkin privat, terhapus, atau login-wall.');
  const { post, microformat } = parsed;

  const captionText = cleanCaption(post?.contentText?.runs?.map(r => r.text).join('') || microformat?.description || '');
  const tags = extractTags(captionText);

  const authorName = post?.authorText?.runs?.[0]?.text || microformat?.title?.replace(/^Postingan dari\s+/i, '').replace(/\s*-\s*YouTube$/, '') || null;
  const channelId = post?.authorEndpoint?.browseEndpoint?.browseId || microformat?.externalId || null;
  const avatar = pickLargestThumb(post?.authorThumbnail?.thumbnails || []);
  const publishedText = post?.publishedTimeText?.runs?.map(r => r.text).join('') || null;

  const likeLabel = post?.actionButtons?.commentActionButtonsRenderer?.likeButton?.toggleButtonRenderer?.accessibility?.label
    || post?.actionButtons?.commentActionButtonsRenderer?.likeButton?.toggleButtonRenderer?.accessibilityData?.accessibilityData?.label
    || null;
  const voteShort = post?.voteCount?.runs?.map(r => r.text).join('') || null;
  const likeExact = parsePostExactLike(likeLabel) ?? parsePostExactLike(post?.voteCount?.accessibility?.accessibilityData?.label);
  const likeFromShort = parseVoteTextId(voteShort);
  const likeCount = likeExact ?? likeFromShort ?? null;

  // attachment -> image / slide
  const ba = post?.backstageAttachment || {};
  let images = [];
  let thumbsAll = [];
  if (ba.backstageImageRenderer?.image?.thumbnails?.length) {
    const best = pickLargestThumb(ba.backstageImageRenderer.image.thumbnails);
    thumbsAll = ba.backstageImageRenderer.image.thumbnails.map(t => ({
      url: String(t.url).startsWith('//') ? 'https:' + t.url : t.url,
      width: t.width || null, height: t.height || null,
    }));
    if (best) images.push(best.url);
  } else if (ba.postMultiImageRenderer?.images?.length) {
    for (const im of ba.postMultiImageRenderer.images) {
      const th = im?.backstageImageRenderer?.image?.thumbnails;
      const best = pickLargestThumb(th || []);
      if (best) {
        images.push(best.url);
        thumbsAll.push(best);
      }
    }
  }
  // fallback microformat thumbnail kalau attachment kosong
  if (!images.length && microformat?.thumbnail?.thumbnails?.length) {
    const best = pickLargestThumb(microformat.thumbnail.thumbnails);
    if (best) images.push(best.url);
  }

  const type = images.length > 1 ? 'slide' : images.length === 1 ? 'image' : 'text';
  const bestThumb = pickLargestThumb(thumbsAll.length ? thumbsAll : (images.map(u => ({ url: u })))) || (images[0] ? { url: images[0], width: null, height: null } : null);

  // verifikasi tiap cdn image
  const checks = [];
  for (const u of images) checks.push(await verifyImageUrl(u));
  const okCount = checks.filter(c => c.ok).length;

  return {
    success: true,
    scraped_at: startedAt,
    source_url: inputUrl,
    source_domain: (() => { try { return new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`).hostname; } catch { return null; } })(),
    post_id: postId,
    type,
    title: microformat?.title || (captionText ? captionText.slice(0, 80) : null),
    caption: { text: captionText, hashtags: tags.hashtags, mentions: tags.mentions },
    author: {
      name: authorName,
      channel_id: channelId,
      channel_url: channelId ? `https://www.youtube.com/channel/${channelId}` : (post?.authorEndpoint?.browseEndpoint?.canonicalBaseUrl ? `https://www.youtube.com${post.authorEndpoint.browseEndpoint.canonicalBaseUrl}` : null),
      avatar: avatar?.url || null,
    },
    published_text: publishedText,
    url: {
      image: images[0] || null,
      images,
      ...(images.length > 1 ? { slides: images } : {}),
      thumbnail: bestThumb?.url || null,
    },
    stats: {
      like: likeCount,
      like_formatted: likeCount !== null ? formatNumber(likeCount) : (voteShort || null),
      like_short: voteShort,
      comment: null,
      comment_note: 'YouTube post comment count butuh continuation login-wall, belum di-fetch.',
      view: null,
      view_note: 'YouTube tidak mempublikasikan view untuk post komunitas.',
      dislike: null,
      dislike_note: 'YouTube menyembunyikan jumlah dislike (sejak Des 2021).',
      save: null,
      save_note: 'YouTube tidak mempublikasikan jumlah save/bookmark.',
    },
    verification: {
      images_checked: images.length,
      playable: okCount,
      all_ok: images.length > 0 && okCount === images.length,
      details: checks.map((c, i) => ({ url: images[i], ok: c.ok, status: c.status, content_type: c.content_type, container: c.container, error: c.error })),
    },
    links: { post: `https://www.youtube.com/post/${postId}` },
  };
}

function cleanCaption(text) {
  if (!text) return '';
  return String(text).trim();
}

function extractTags(text) {
  const hashtags = [];
  const mentions = [];
  for (const m of String(text || '').matchAll(/#([\p{L}\p{N}_]{1,80})/gu)) {
    if (!hashtags.includes(m[1])) hashtags.push(m[1]);
  }
  for (const m of String(text || '').matchAll(/@([A-Za-z0-9._]{1,30})/g)) {
    if (!mentions.includes(m[1])) mentions.push(m[1]);
  }
  return { hashtags, mentions };
}

function formatNumber(num) {
  if (num === null || num === undefined) return null;
  const n = Number(num);
  if (!Number.isFinite(n) || n <= 0) return n === 0 ? '0' : null;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function parseCount(text) {
  if (text === null || text === undefined) return null;
  const s = String(text).replace(/[^0-9.,KMBkm]/g, '').trim();
  if (!s) return null;
  const m = s.match(/^([\d.,]+)\s*([KMBkmb])?$/);
  if (!m) {
    const n = Number(String(text).replace(/[^\d]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  let n = parseFloat(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || '').toUpperCase();
  if (suf === 'K') n *= 1e3;
  else if (suf === 'M') n *= 1e6;
  else if (suf === 'B') n *= 1e9;
  return Math.round(n);
}

function parseDuration(seconds) {
  if (seconds === null || seconds === undefined) return null;
  const s = Number(seconds);
  if (!Number.isFinite(s)) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ---------- InnerTube ----------

async function fetchPlayer(videoId, clientCtx, ua) {
  const res = await withRetry(() => axios.post(
    `https://www.youtube.com/youtubei/v1/player?key=${API_KEY}`,
    {
      context: { client: clientCtx },
      videoId,
      racyCheckOk: true,
      contentCheckOk: true,
      playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } },
    },
    {
      headers: {
        'User-Agent': ua,
        'Content-Type': 'application/json',
        Origin: 'https://www.youtube.com',
        Referer: `https://www.youtube.com/watch?v=${videoId}`,
      },
      timeout: 20000,
    }
  ));
  return res.data;
}

async function fetchYouTubePlayer(videoId) {
  // ANDROID duluan: satu-satunya client yg konsisten ngasih streamingData
  // untuk IP yg di-flag bot (WEB status UNPLAYABLE).
  try {
    const d = await fetchPlayer(videoId, ANDROID_CTX, UA_ANDROID);
    if (d?.streamingData?.formats?.length || d?.streamingData?.adaptiveFormats?.length) {
      return { source: 'innerTube', client: 'ANDROID', data: d };
    }
    if (d?.videoDetails) return { source: 'innerTube', client: 'ANDROID-meta', data: d, noStream: true };
  } catch { }

  try {
    const d = await fetchPlayer(videoId, IOS_CTX, UA_BROWSER);
    if (d?.streamingData?.adaptiveFormats?.length) {
      return { source: 'innerTube', client: 'IOS', data: d };
    }
    if (d?.videoDetails) return { source: 'innerTube', client: 'IOS-meta', data: d, noStream: true };
  } catch { }

  try {
    const d = await fetchPlayer(videoId, WEB_CTX, UA_BROWSER);
    if (d?.streamingData?.formats?.length || d?.streamingData?.adaptiveFormats?.length) {
      return { source: 'innerTube', client: 'WEB', data: d };
    }
    if (d?.videoDetails) return { source: 'innerTube', client: 'WEB-meta', data: d, noStream: true };
  } catch { }

  return null;
}

async function fetchYouTubeNext(videoId) {
  try {
    const res = await withRetry(() => axios.post(
      `https://www.youtube.com/youtubei/v1/next?key=${API_KEY}`,
      { context: { client: WEB_CTX }, videoId },
      {
        headers: {
          'User-Agent': UA_BROWSER,
          'Content-Type': 'application/json',
          Origin: 'https://www.youtube.com',
          Referer: `https://www.youtube.com/watch?v=${videoId}`,
        },
        timeout: 20000,
      }
    ));
    return res.data;
  } catch {
    return null;
  }
}

async function fetchYouTubeEmbed(videoId) {
  try {
    const res = await withRetry(() => axios.get(`https://www.youtube.com/embed/${videoId}`, {
      headers: { 'User-Agent': UA_EMBED },
      timeout: 15000,
    }));
    const html = String(res.data || '');
    const m1 = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]*?});/);
    if (m1) {
      try { return JSON.parse(m1[1]); } catch { }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------- Fallback instances ----------

async function fetchFromInvidious(videoId) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await withRetry(() => axios.get(`${instance}/api/v1/videos/${videoId}`, {
        headers: { 'User-Agent': UA_BROWSER, Accept: 'application/json' },
        timeout: 15000,
        transformResponse: [(data) => {
          try { return typeof data === 'string' ? JSON.parse(data) : data; }
          catch { return data; }
        }],
      }));
      const data = res.data;
      if (data && typeof data === 'object' && !Array.isArray(data) && data.videoId) {
        return { ...data, _instance: instance };
      }
    } catch { }
  }
  return null;
}

async function fetchFromPiped(videoId) {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await withRetry(() => axios.get(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': UA_BROWSER, Accept: 'application/json' },
        timeout: 15000,
        transformResponse: [(data) => {
          try { return typeof data === 'string' ? JSON.parse(data) : data; }
          catch { return data; }
        }],
      }));
      const data = res.data;
      if (data && typeof data === 'object' && !Array.isArray(data) && data.streams) {
        return { ...data, _instance: instance };
      }
    } catch { }
  }
  return null;
}

// ---------- Parsers ----------

function decodeCipher(cipher) {
  // signatureCipher bentuk: "url=<enc>&s=<sig>&sp=sig"
  try {
    const p = new URLSearchParams(cipher);
    const url = p.get('url');
    const s = p.get('s');
    const sp = p.get('sp') || 'sig';
    if (!url) return { url: null, needsDecipher: true };
    return { url: s ? `${decodeURIComponent(url)}&${sp}=${s}` : decodeURIComponent(url), needsDecipher: Boolean(s) };
  } catch {
    return { url: null, needsDecipher: true };
  }
}

function parseFormats(streamingData) {
  const formats = [];
  const push = (f, isProg) => {
    let url = f.url || null;
    let needsDecipher = false;
    if (!url && f.signatureCipher) {
      const dec = decodeCipher(f.signatureCipher);
      url = dec.url;
      needsDecipher = dec.needsDecipher;
    }
    if (!url || !f.mimeType) return;
    formats.push({
      itag: f.itag,
      url,
      needs_decipher: needsDecipher,
      mimeType: f.mimeType.split(';')[0].trim(),
      codecs: /codecs="([^"]+)"/.exec(f.mimeType)?.[1] || null,
      quality: f.qualityLabel || f.quality || null,
      bitrate: f.bitrate || null,
      width: f.width || null,
      height: f.height || null,
      fps: f.fps || null,
      contentLength: f.contentLength ? Number(f.contentLength) : null,
      approxDurationMs: f.approxDurationMs ? Number(f.approxDurationMs) : null,
      lastModified: f.lastModified || null,
      isVideo: /^video\//.test(f.mimeType),
      isAudio: /^audio\//.test(f.mimeType),
      progressive: Boolean(isProg),
    });
  };
  (streamingData?.formats || []).forEach(f => push(f, true));
  (streamingData?.adaptiveFormats || []).forEach(f => push(f, false));
  return formats;
}

// 1 URL per resolusi: grup by label kualitas, pilih yg paling kompatibel (mp4/avc) lalu bitrate tertinggi
function dedupeVideoFormats(videos) {
  const byQuality = new Map();
  const score = x => (/mp4/i.test(x.mimeType || '') ? 100 : 0)
    + (/avc1/i.test(x.codecs || '') ? 10 : 0)
    + (Number(x.bitrate) || 0) / 1e7;
  for (const f of videos) {
    const key = f.quality || (f.width && f.height ? `${f.width}x${f.height}` : null);
    if (!key) continue;
    const cur = byQuality.get(key);
    if (!cur || score(f) > score(cur)) byQuality.set(key, f);
  }
  return [...byQuality.values()].sort(
    (a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0))
  );
}

// 1 URL per itag (buang duplikat itag yg sama, simpan bitrate tertinggi)
function dedupeAudioFormats(audios) {
  const byItag = new Map();
  for (const f of audios) {
    const cur = byItag.get(f.itag);
    if (!cur || (Number(f.bitrate) || 0) > (Number(cur.bitrate) || 0)) byItag.set(f.itag, f);
  }
  return [...byItag.values()].sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));
}

// tebak isi file dari magic bytes: mp4 (ftyp) / webm (EBML) / mp3
function sniffContainer(buf) {
  if (!buf || buf.length < 4) return 'unknown';
  if (buf.length >= 12 && buf.slice(4, 8).toString('latin1') === 'ftyp') return 'mp4';
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm';
  if (buf.slice(0, 3).toString('latin1') === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return 'mp3';
  return 'unknown';
}

// fetch tiap URL CDN (range 2KB) + pastikan isinya beneran media & bisa disimpan
async function checkFormatUrl(url) {
  const out = { ok: false, status: null, content_type: null, bytes: 0, container: null, error: null };
  if (!url) { out.error = 'URL tidak tersedia'; return out; }
  try {
    const res = await axios.get(url, {
      timeout: 15000,
      validateStatus: s => s < 500,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': UA_ANDROID, Referer: 'https://www.youtube.com/', Range: 'bytes=0-2047' },
    });
    const buf = Buffer.from(res.data || []);
    out.status = res.status;
    out.content_type = res.headers['content-type'] || null;
    out.bytes = buf.length;
    out.container = sniffContainer(buf);
    out.ok = (res.status === 200 || res.status === 206) && buf.length > 0 && out.container !== 'unknown';
    if (!out.ok && !out.error) out.error = out.container === 'unknown' ? 'isi bukan file media' : `http ${res.status}`;
  } catch (err) {
    out.error = err.message;
  }
  return out;
}

async function checkAllUrls(items, concurrency = 5) {
  const map = new Map();
  let i = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      map.set(item.itag, await checkFormatUrl(item.url));
    }
  });
  await Promise.all(workers);
  return map;
}

function findLikeNode(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 12) return null;
  if (node.segmentedLikeDislikeButtonViewModel) return node.segmentedLikeDislikeButtonViewModel;
  if (Array.isArray(node)) {
    for (const v of node) {
      const f = findLikeNode(v, depth + 1);
      if (f) return f;
    }
    return null;
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') {
      const f = findLikeNode(v, depth + 1);
      if (f) return f;
    }
  }
  return null;
}

function parseLikeFromNext(nextData) {
  try {
    const seg = findLikeNode(nextData);
    const likeVm = seg?.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.toggleButtonViewModel;
    const btn = likeVm?.defaultButtonViewModel?.buttonViewModel || likeVm?.toggledButtonViewModel?.buttonViewModel;
    const title = btn?.title || null; // "7.6K"
    const acc = btn?.accessibilityText || ''; // "like this video along with 7,644 other people"
    const exact = /along with ([\d,]+)/.exec(acc)?.[1]?.replace(/[^\d]/g, '');
    return {
      short: typeof title === 'string' ? title : null,
      exact: exact ? Number(exact) : parseCount(title),
    };
  } catch {
    return { short: null, exact: null };
  }
}

function parseNextPrimary(nextData) {
  const out = {};
  try {
    const contents = nextData?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
    const prim = contents.find(c => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
    if (prim) {
      out.title = prim.title?.runs?.map(r => r.text).join('') || null;
      out.viewText = prim.viewCount?.videoViewCountRenderer?.viewCount?.simpleText || null;
      out.viewShort = prim.viewCount?.videoViewCountRenderer?.shortViewCount?.simpleText || null;
      out.viewCount = parseCount(out.viewText);
      out.dateText = prim.dateText?.simpleText || null;
    }
    const sec = contents.find(c => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
    if (sec?.owner?.videoOwnerRenderer) {
      const o = sec.owner.videoOwnerRenderer;
      out.owner = {
        name: o.title?.runs?.[0]?.text || null,
        channelId: o.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
          || o.navigationEndpoint?.browseEndpoint?.browseId || null,
        channelUrl: o.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl
          ? `https://www.youtube.com${o.title.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl}` : null,
        avatar: o.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || null,
        subsText: o.subscriberCountText?.simpleText || null,
        subs: parseCount(o.subscriberCountText?.simpleText),
      };
    }
  } catch { }
  return out;
}

function parseCommentCount(nextData) {
  try {
    const panels = nextData?.engagementPanels || [];
    const cm = panels.find(p => String(p.engagementPanelSectionListRenderer?.panelIdentifier || '').includes('comment'));
    const runs = cm?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer?.contextualInfo?.runs || [];
    const txt = runs.map(r => r.text).join('');
    return parseCount(txt);
  } catch {
    return null;
  }
}

// ---------- Main ----------

async function youtubeDL(inputUrl) {
  // post community -> jalur khusus (image/slide)
  if (isPostUrl(inputUrl)) return youtubePostDL(inputUrl);

  const startedAt = new Date().toISOString();
  const videoId = extractVideoId(inputUrl);
  if (!videoId) throw new Error('Invalid YouTube URL. Could not extract video ID. (support: watch, shorts, live, embed, music, youtu.be, post)');

  const fromMusic = isMusicSourceUrl(inputUrl);
  const cleanUrl = `https://www.youtube.com/shorts/${videoId}`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const musicUrl = `https://music.youtube.com/watch?v=${videoId}`;

  // 1) player (streaming) + next (metadata) paralel
  const [playerRes, nextRes] = await Promise.allSettled([
    fetchYouTubePlayer(videoId),
    fetchYouTubeNext(videoId),
  ]);
  const player = playerRes.status === 'fulfilled' ? playerRes.value : null;
  const nextData = nextRes.status === 'fulfilled' ? nextRes.value : null;

  // 2) fallback invidious/piped kalau player gagal total
  let fallback = null;
  if (!player) {
    const inv = await fetchFromInvidious(videoId);
    if (inv) fallback = { source: 'invidious', data: inv };
    else {
      const pip = await fetchFromPiped(videoId);
      if (pip) fallback = { source: 'piped', data: pip };
    }
    if (!fallback) {
      const emb = await fetchYouTubeEmbed(videoId);
      if (emb?.streamingData || emb?.videoDetails) fallback = { source: 'embed', data: emb };
    }
  }
  if (!player && !fallback) {
    throw new Error('Failed to fetch video info from all sources. Video may be private, deleted, or region-locked.');
  }

  let formats = [];
  let videoDetails = {};
  let captions = [];
  let thumbnails = [];
  let playStatus = null;
  let playReason = null;

  if (player) {
    const d = player.data;
    playStatus = d.playabilityStatus?.status || null;
    playReason = d.playabilityStatus?.reason || null;
    videoDetails = d.videoDetails || {};
    formats = parseFormats(d.streamingData);
    thumbnails = videoDetails.thumbnail?.thumbnails || [];
    captions = d.captions?.playerCaptionsTracklistRenderer?.captionTracks?.map(c => ({
      lang: c.languageCode, name: c.name?.simpleText || c.name?.runs?.[0]?.text || null,
      baseUrl: c.baseUrl, kind: c.kind || null,
    })) || [];
    if (videoDetails.shortDescription) videoDetails.description = videoDetails.shortDescription;
    if (videoDetails.channelId && !videoDetails.authorUrl) {
      videoDetails.authorUrl = `https://www.youtube.com/channel/${videoDetails.channelId}`;
    }
    // microformat (minta WEB player kalau ANDROID tak punya microformat)
    if (!d.microformat) {
      try {
        const web = await fetchPlayer(videoId, WEB_CTX, UA_BROWSER);
        const mf = web?.microformat?.playerMicroformatRenderer;
        if (mf) {
          videoDetails.uploaded = mf.publishDate || mf.uploadDate || videoDetails.uploaded || null;
          videoDetails.category = mf.category || null;
          videoDetails.keywords = typeof mf.keywords === 'string'
            ? mf.keywords.split(',').map(s => s.trim()).filter(Boolean)
            : (Array.isArray(mf.keywords) ? mf.keywords : videoDetails.keywords);
          if (!videoDetails.author && mf.ownerChannelName) videoDetails.author = mf.ownerChannelName;
          d._likeCount = mf.likeCount ? Number(mf.likeCount) : null;
          d._viewCount = mf.viewCount ? Number(mf.viewCount) : null;
        }
      } catch { }
    } else {
      const mf = d.microformat.playerMicroformatRenderer;
      videoDetails.uploaded = mf.publishDate || mf.uploadDate || null;
      videoDetails.category = mf.category || null;
      d._likeCount = mf.likeCount ? Number(mf.likeCount) : null;
      d._viewCount = mf.viewCount ? Number(mf.viewCount) : null;
    }
    player._extraLike = d._likeCount ?? null;
    player._extraView = d._viewCount ?? null;
  } else if (fallback?.source === 'invidious') {
    const d = fallback.data;
    videoDetails = {
      videoId: d.videoId, title: d.title, author: d.author, authorId: d.authorId,
      authorUrl: d.authorUrl, lengthSeconds: d.lengthSeconds, viewCount: d.viewCount,
      description: d.description, keywords: d.keywords, allowRatings: d.allowRatings,
      isLive: d.liveNow, isShort: true,
    };
    thumbnails = (d.videoThumbnails || []).map(t => ({ url: t.url, width: t.width, height: t.height }));
    formats = [];
    (d.adaptiveFormats || []).forEach(f => {
      if (!f.url) return;
      formats.push({
        itag: f.itag, url: f.url, needs_decipher: false, mimeType: String(f.type || '').split(';')[0],
        codecs: null, quality: f.quality || null, bitrate: f.bitrate || null,
        width: f.width || null, height: f.height || null, fps: f.fps || null,
        contentLength: f.contentLength ? Number(f.contentLength) : null,
        isVideo: String(f.type || '').includes('video'), isAudio: String(f.type || '').includes('audio'),
      });
    });
  } else if (fallback?.source === 'piped') {
    const d = fallback.data;
    videoDetails = {
      videoId: d.id || videoId, title: d.title, author: d.uploader, authorId: d.uploaderId,
      authorUrl: d.uploaderUrl, lengthSeconds: d.duration, viewCount: d.views,
      description: d.description, uploaded: d.uploaded, isShort: true,
    };
    thumbnails = d.thumbnails || [];
  } else if (fallback?.source === 'embed') {
    videoDetails = fallback.data.videoDetails || {};
    formats = parseFormats(fallback.data.streamingData);
    thumbnails = videoDetails.thumbnail?.thumbnails || [];
  }

  // 3) perkaya metadata dari next (like akurat, comment count, subs, tgl)
  const prim = nextData ? parseNextPrimary(nextData) : {};
  const likeInfo = nextData ? parseLikeFromNext(nextData) : { short: null, exact: null };
  const commentCount = nextData ? parseCommentCount(nextData) : null;

  const likeCount = likeInfo.exact ?? player?._extraLike ?? (Number(videoDetails.likeCount || 0) || null);
  const viewCount = Number(videoDetails.viewCount || 0)
    || prim.viewCount
    || player?._extraView
    || null;

  const authorName = videoDetails.author || prim.owner?.name || null;
  const channelId = videoDetails.channelId || videoDetails.authorId || prim.owner?.channelId || null;

  const description = videoDetails.description || '';
  // caption shorts: deskripsi kosong -> pakai judul sbg caption
  const captionText = cleanCaption(description) || cleanCaption(videoDetails.title || prim.title || '');
  const captionSource = cleanCaption(description) ? 'description' : 'title';
  const tags = extractTags(`${videoDetails.title || ''}\n${description}`);

  // 4) pisahkan progressive vs adaptive, buang duplikat (1 URL per resolusi / per itag)
  const progressiveList = formats.filter(f => f.isVideo && f.progressive);
  const progressive = progressiveList.find(f => /mp4/i.test(f.mimeType || ''))
    || [...progressiveList].sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)))[0]
    || null;

  const videos = dedupeVideoFormats(formats.filter(f => f.isVideo && !f.progressive));
  const audios = dedupeAudioFormats(formats.filter(f => f.isAudio));

  const bestThumb = thumbnails.filter(t => t.url)
    .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0))[0];

  // 5) fetch tiap URL CDN + pastikan bisa disimpan & isinya beneran media
  const toCheck = [
    ...(progressive ? [{ itag: progressive.itag, url: progressive.url }] : []),
    ...videos.map(f => ({ itag: f.itag, url: f.url })),
    ...audios.map(f => ({ itag: f.itag, url: f.url })),
  ];
  const checkMap = await checkAllUrls(toCheck, 5);
  const dl = itag => checkMap.get(itag) || { ok: false, status: null, content_type: null, bytes: 0, container: null, error: 'tidak dicek' };

  const fmtVideo = f => ({
    itag: f.itag,
    quality: f.quality,
    resolution: f.width && f.height ? `${f.width}x${f.height}` : null,
    mime: f.mimeType,
    codec: f.codecs,
    fps: f.fps ?? null,
    bitrate: f.bitrate ?? null,
    size: f.contentLength ?? null,
    url: f.url,
    download: dl(f.itag),
  });
  const fmtAudio = f => ({
    itag: f.itag,
    mime: f.mimeType,
    codec: f.codecs,
    bitrate: f.bitrate ?? null,
    size: f.contentLength ?? null,
    url: f.url,
    download: dl(f.itag),
  });

  const allChecks = [...checkMap.values()];
  const okCount = allChecks.filter(c => c.ok).length;

  const title = videoDetails.title || prim.title || null;
  const durationSec = videoDetails.lengthSeconds ? Number(videoDetails.lengthSeconds) : null;
  const category = videoDetails.category || null;
  // music: dari music.youtube.com ATAU kategori Music. shorts: dari /shorts/ ATAU durasi <= 3 menit.
  const isMusic = fromMusic || category === 'Music';
  const type = /\/shorts\//i.test(inputUrl) ? 'short'
    : isMusic ? 'music'
    : (durationSec !== null && durationSec > 182 ? 'video' : 'short');

  // music down: pilih audio paling cocok (m4a 140 buat kompatibilitas, opus 251 buat kualitas)
  const findAudio = itag => audios.find(a => Number(a.itag) === Number(itag)) || null;
  const musicBest = findAudio(140) || findAudio(251) || audios[0] || null;
  const musicHigh = findAudio(251) || findAudio(140) || audios[0] || null;

  return {
    success: true,
    scraped_at: startedAt,
    source_url: inputUrl,
    source_domain: (() => { try { return new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`).hostname; } catch { return null; } })(),
    is_music_source: fromMusic,
    video_id: videoId,
    type,
    title,
    duration_seconds: durationSec,
    duration: durationSec !== null ? parseDuration(durationSec) : null,
    published_at: videoDetails.uploaded || null,
    category,
    links: { watch: watchUrl, shorts: cleanUrl, embed: embedUrl, music: musicUrl },
    music: musicBest ? {
      title,
      artist: authorName,
      duration_seconds: durationSec,
      // rekomendasi download musik
      best_m4a: musicBest ? fmtAudio(musicBest) : null,
      best_quality: musicHigh ? fmtAudio(musicHigh) : null,
      note: 'best_m4a (itag 140) paling kompatibel (MP4/AAC). best_quality (itag 251 opus) kualitas tertinggi.',
    } : null,
    video: {
      progressive: progressive ? fmtVideo(progressive) : null,
      adaptive: videos.map(fmtVideo),
    },
    audio: audios.map(fmtAudio),
    thumbnail: bestThumb ? { url: bestThumb.url, width: bestThumb.width, height: bestThumb.height } : null,
    caption: {
      text: captionText, source: captionSource,
      hashtags: tags.hashtags, mentions: tags.mentions,
    },
    author: {
      name: authorName,
      channel_id: channelId,
      channel_url: channelId ? `https://www.youtube.com/channel/${channelId}` : (videoDetails.authorUrl || prim.owner?.channelUrl || null),
      handle_url: prim.owner?.channelUrl || null,
      avatar: prim.owner?.avatar || null,
      subscribers_text: prim.owner?.subsText || null,
      subscribers: prim.owner?.subs ?? null,
    },
    stats: {
      view: viewCount || null,
      view_formatted: viewCount ? formatNumber(viewCount) : null,
      like: likeCount || null,
      like_formatted: likeCount ? formatNumber(likeCount) : null,
      comment: commentCount,
      comment_formatted: commentCount !== null ? formatNumber(commentCount) : null,
      dislike: null,
      dislike_note: 'YouTube menyembunyikan jumlah dislike (sejak Des 2021).',
      save: null,
      save_note: 'YouTube tidak mempublikasikan jumlah save/bookmark.',
    },
    subtitle: captions[0] ? { language: captions[0].lang, name: captions[0].name, url: captions[0].baseUrl } : null,
    verification: {
      checked: toCheck.length,
      playable: okCount,
      all_ok: toCheck.length > 0 && okCount === toCheck.length,
      cdn_expires_in_seconds: player?.data?.streamingData?.expiresInSeconds
        ? Number(player.data.streamingData.expiresInSeconds) : null,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const url = args.find(a => !a.startsWith('--'));

  if (!url) {
    console.log(JSON.stringify({
      success: false,
      error: 'Usage: node youtube.js "<youtube-url>" (support: youtube.com, youtu.be, music.youtube.com, shorts, watch, embed, live, post)',
    }, null, 2));
    process.exit(1);
  }

  try {
    const result = await youtubeDL(url);
    console.log(JSON.stringify(result, null, 2));
    if (result.verification) {
      const ok = result.verification.all_ok ?? result.verification.all_cdn_ok ?? true;
      if (!ok) process.exitCode = 2;
    }
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      source_url: url,
      error: err.message,
      status: err.response?.status || null,
    }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { youtubeDL, youtubePostDL, extractPostId, extractVideoId };

/*
untuk mendapatkan mp3/mp4 dari url cdn nya wajib menggunakan headers agar tidak 403

axios:
axios.get(CDN_URL, {
       responseType: 'arraybuffer',
       headers: {
         'User-Agent': 'com.google.android.youtube/20.10.38 (Linux;
     U; Android 11) gzip',
         'Referer': 'https://www.youtube.com/',
         'Range': 'bytes=0-2047'
       }
     })
     
curl:
curl -L -o video.mp4 -H "User-Agent: com.google.android.youtube/
     20.10.38 (Linux; U; Android 11) gzip" -H "Referer: https://www.
     youtube.com/" -H "Range: bytes=0-262143" "<FRESH_CDN_URL>"
*/
[5/10 20.39] null: /*
 * Threads Downloader
 * type: Scraper
 * base url: threads.com
 * author: wa.me/ikyykzy
 * note: ambil cdn url + full statistik (caption, like, comment/reply, repost, quote, reshare, dll).
 *       support image, video, carousel (& text post + linked carousel/embed).
 *       tanpa login, pakai SSR HTML (mobile UA) + RelayPrefetchedStreamCache.
 *
 * request scrape bisa ke ikyykzy.t.me / wa.me/ikyykzy usahakan gaada cf/login(malas bypas (skill issue))
 */

const axios = require('axios');

const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const http = axios.create({ timeout: 30000, maxRedirects: 5, validateStatus: s => s < 500 });

const htmlHeaders = referer => ({
  'User-Agent': UA_MOBILE,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  ...(referer ? { Referer: referer } : {}),
});

const cdnHeaders = () => ({ 'User-Agent': UA_BROWSER, Referer: 'https://www.threads.com/' });

const firstDefined = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== '') return v;
  return null;
};

function parseUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('URL kosong');

  let u;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error(`URL tidak valid: ${raw}`);
  }

  if (!/(^|\.)threads\.com$/i.test(u.hostname) && !/(^|\.)threads\.net$/i.test(u.hostname)) {
    throw new Error(`Host bukan threads.com: ${u.hostname}`);
  }

  const segs = u.pathname.split('/').filter(Boolean);
  let token = null;
  const shareIdx = segs.findIndex(s => s.toLowerCase() === 'share');
  if (shareIdx >= 0 && segs[shareIdx + 1]) token = segs[shareIdx + 1];
  else if (segs[0] && segs[0].toLowerCase() === 't' && segs[1]) token = segs[1];
  else if (segs.length) token = segs[segs.length - 1];

  return { input: raw, token, permalink: raw.split('?')[0] };
}

function decodeEntities(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function attrMap(text) {
  const map = {};
  for (const m of String(text).matchAll(/([\w:.-]+)="([^"]*)"/g)) map[m[1]] = m[2];
  return map;
}

function parseDash(manifest) {
  const result = { audio: [], video: [], raw: manifest || null };
  if (!manifest) return result;
  for (const set of String(manifest).matchAll(/<AdaptationSet\b([^>]*)>([\s\S]*?)<\/AdaptationSet>/g)) {
    const setAttrs = attrMap(set[1]);
    const contentType = (setAttrs.contentType || '').toLowerCase();
    if (contentType !== 'audio' && contentType !== 'video') continue;
    for (const rep of set[2].matchAll(/<Representation\b([^>]*)>([\s\S]*?)<\/Representation>/g)) {
      const repAttrs = attrMap(rep[1]);
      const baseUrl = (rep[2].match(/<BaseURL>([\s\S]*?)<\/BaseURL>/) || [])[1];
      if (!baseUrl) continue;
      const entry = {
        bandwidth_bps: Number(repAttrs.bandwidth || 0) || null,
        codecs: repAttrs.codecs || null,
        mime_type: repAttrs.mimeType || null,
        width: repAttrs.width ? Number(repAttrs.width) : null,
        height: repAttrs.height ? Number(repAttrs.height) : null,
        quality_label: repAttrs.FBQualityLabel || null,
        url: decodeEntities(baseUrl.trim()),
      };
      if (contentType === 'audio') result.audio.push(entry);
      else result.video.push(entry);
    }
  }
  result.audio.sort((a, b) => (b.bandwidth_bps || 0) - (a.bandwidth_bps || 0));
  result.video.sort((a, b) => (b.bandwidth_bps || 0) - (a.bandwidth_bps || 0));
  return result;
}

function bestImage(node) {
  if (!node || typeof node !== 'object') return null;
  const candidates = Array.isArray(node.image_versions2?.candidates) ? node.image_versions2.candidates : [];
  let best = null;
  for (const c of candidates) {
    if (!c || typeof c.url !== 'string' || !c.url) continue;
    const area = (Number(c.width) || 0) * (Number(c.height) || 0);
    if (!best || area > best.area) best = { url: c.url, area, width: c.width ?? null, height: c.height ?? null };
  }
  if (best) return { url: best.url, width: best.width, height: best.height };
  return null;
}

function itemFromNode(node) {
  const dash = parseDash(node?.video_dash_manifest || '');
  const versions = (Array.isArray(node?.video_versions) ? node.video_versions : [])
    .filter(v => v && typeof v.url === 'string' && v.url);
  const video = versions.length ? versions[0].url : (dash.video[0]?.url || null);
  const image = video ? null : bestImage(node);
  return {
    pk: firstDefined(node?.pk, null),
    code: firstDefined(node?.code, null),
    media_type: firstDefined(node?.media_type, null),
    is_video: Boolean(video),
    has_audio: firstDefined(node?.has_audio, null),
    video,
    video_versions: versions.map(v => ({ type: v.type ?? null, url: v.url })),
    audio: dash.audio[0]?.url || null,
    dash_video: dash.video[0]?.url || null,
    dash_audio: dash.audio[0]?.url || null,
    image,
    width: firstDefined(node?.original_width, image?.width, null),
    height: firstDefined(node?.original_height, image?.height, null),
  };
}

function collectItems(media) {
  if (Array.isArray(media?.carousel_media) && media.carousel_media.length) {
    return media.carousel_media.map(itemFromNode);
  }
  const linked = media?.text_post_app_info?.linked_inline_media;
  if (linked && Array.isArray(linked.carousel_media) && linked.carousel_media.length) {
    return linked.carousel_media.map(itemFromNode);
  }
  if (linked && (linked.video_versions || linked.image_versions2)) {
    return [itemFromNode(linked)];
  }
  return [itemFromNode(media)];
}

function extractTags(text) {
  const hashtags = [];
  const mentions = [];
  for (const m of String(text || '').matchAll(/#([\p{L}\p{N}_]{1,80})/gu)) {
    if (!hashtags.includes(m[1])) hashtags.push(m[1]);
  }
  for (const m of String(text || '').matchAll(/@([A-Za-z0-9._]{1,30})/g)) {
    if (!mentions.includes(m[1])) mentions.push(m[1]);
  }
  return { hashtags, mentions };
}

function toIso(unix) {
  if (unix === null || unix === undefined) return null;
  const n = Number(unix);
  if (!Number.isFinite(n)) return null;
  const d = new Date(n > 1e12 ? n : n * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseJsonScripts(html) {
  const out = [];
  for (const m of String(html).matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(m[1])); } catch { /* skip */ }
  }
  return out;
}

function extractPostId(html) {
  const m1 = String(html).match(/"post_id":"(\d+)"/);
  if (m1) return m1[1];
  const m2 = String(html).match(/"targetPostID":"(\d+)"/);
  if (m2) return m2[1];
  const m3 = String(html).match(/"postID":"(\d+)"/);
  if (m3) return m3[1];
  return null;
}

function walkCollect(node, fn, depth = 0, path = '$') {
  if (depth > 32 || !node || typeof node !== 'object') return;
  try { fn(node, path); } catch { /* ignore */ }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) walkCollect(node[i], fn, depth + 1, `${path}[${i}]`);
  } else {
    for (const k of Object.keys(node)) walkCollect(node[k], fn, depth + 1, `${path}.${k}`);
  }
}

function findMainMedia(roots, postId) {
  let best = null;
  for (const root of roots) {
    walkCollect(root, (node) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      if (String(node.pk || '') !== String(postId)) return;
      if (typeof node.like_count !== 'number') return;
      if (!node.caption || typeof node.caption.text !== 'string') {
        if (!node.text_post_app_info) return;
      }
      if (!node.user || typeof node.user !== 'object') return;
      const score = Object.keys(node).length + (node.code ? 50 : 0);
      if (!best || score > best.score) best = { node, score };
    });
  }
  return best?.node || null;
}

function findTopReplies(roots, postId) {
  const replies = [];
  const seen = new Set();
  for (const root of roots) {
    walkCollect(root, (node, path) => {
      if (!path.includes('direct_replies')) return;
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      if (typeof node.like_count !== 'number') return;
      if (!node.caption || typeof node.caption.text !== 'string') return;
      if (String(node.pk || '') === String(postId)) return;
      if (!node.user) return;
      const key = String(node.pk || node.id || node.code);
      if (!key || seen.has(key)) return;
      seen.add(key);
      replies.push(node);
    });
  }
  return replies
    .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    .slice(0, 10)
    .map(n => ({
      pk: firstDefined(n.pk, null),
      code: firstDefined(n.code, null),
      username: firstDefined(n.user?.username, null),
      full_name: firstDefined(n.user?.full_name, null),
      text: n.caption?.text || '',
      like_count: firstDefined(n.like_count, null),
      posted_at: toIso(firstDefined(n.taken_at, null)),
    }));
}

function detectContainer(buf) {
  if (!buf || buf.length < 12) return { is_container: false, format: null };
  const box = buf.slice(4, 8).toString('latin1');
  if (box === 'ftyp') return { is_container: true, format: 'ISO-BMFF (mp4/mov/m4a)' };
  if (buf.slice(0, 3).toString('latin1') === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
    return { is_container: true, format: 'MPEG audio (mp3)' };
  }
  if (buf[0] === 0x89 && buf.slice(1, 4).toString('latin1') === 'PNG') return { is_container: true, format: 'PNG image' };
  if (buf[0] === 0xff && buf[1] === 0xd8) return { is_container: true, format: 'JPEG image' };
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') {
    return { is_container: true, format: 'WebP image' };
  }
  return { is_container: false, format: null };
}

async function verifyMediaUrl(url) {
  const result = { url: url || null, ok: false, head_ok: false, download_ok: false };
  if (!url) { result.error = 'URL tidak tersedia'; return result; }
  try {
    const head = await http.head(url, { headers: cdnHeaders() });
    result.status = head.status;
    result.content_type = head.headers['content-type'] || null;
    result.content_length = Number(head.headers['content-length'] || 0) || null;
    result.head_ok = head.status === 200 || head.status === 206;
  } catch (err) {
    result.error = err.message;
  }
  try {
    const res = await http.get(url, {
      headers: { ...cdnHeaders(), Range: 'bytes=0-2047' },
      responseType: 'arraybuffer',
    });
    const buf = Buffer.from(res.data || []);
    result.range_status = res.status;
    result.bytes_sampled = buf.length;
    result.container = detectContainer(buf);
    result.download_ok = (res.status === 200 || res.status === 206) && buf.length > 0;
  } catch (err) {
    result.error = result.error || err.message;
  }
  result.ok = Boolean((result.head_ok || result.download_ok) && result.container?.is_container);
  return result;
}

function slimCheck(r) {
  if (!r) return null;
  return { ok: Boolean(r.ok), status: r.status ?? null, content_type: r.content_type ?? null, content_length: r.content_length ?? null, error: r.error ?? null };
}

function deriveType(media, items) {
  const linked = media?.text_post_app_info?.linked_inline_media;
  if (Array.isArray(media?.carousel_media) && media.carousel_media.length) return 'carousel';
  if (linked && Array.isArray(linked.carousel_media) && linked.carousel_media.length) return 'carousel';
  if (items.some(i => i.is_video)) return items.length > 1 ? 'carousel' : 'video';
  if (items.some(i => i.image)) return items.length > 1 ? 'carousel' : 'image';
  return 'text';
}

async function threadsDL(inputUrl) {
  const target = parseUrl(inputUrl);
  const startedAt = new Date().toISOString();

  const res = await http.get(target.permalink, { headers: htmlHeaders('https://www.threads.com/') });
  if (res.status >= 400) throw new Error(`Gagal fetch Threads (HTTP ${res.status})`);
  const html = String(res.data || '');
  if (html.length < 50000) throw new Error('HTML terlalu kecil, kemungkinan diblokir/CF');

  const postId = extractPostId(html);
  if (!postId) throw new Error('post_id tidak ditemukan di HTML (format berubah / post privat)');

  const roots = parseJsonScripts(html);
  const media = findMainMedia(roots, postId);
  if (!media) throw new Error('Data media utama tidak ditemukan di Relay payload');

  const replies = findTopReplies(roots, postId);
  const items = collectItems(media);
  const linked = media.text_post_app_info?.linked_inline_media || null;

  const videos = items.filter(i => i.video);
  const images = items.filter(i => i.image && i.image.url);
  const primaryImage = images[0]?.image?.url || bestImage(media)?.url || null;

  // CDN unik — tiap URL hanya muncul 1x di seluruh response (hanya di `url`, tidak di `media.items`)
  const uniq = arr => [...new Set(arr.filter(Boolean))];
  const uniqueVideos = uniq(videos.map(v => v.video));
  const uniqueAudios = uniq(items.map(i => i.audio));
  const uniqueImages = uniq(images.map(i => i.image.url));

  const url = {};
  if (uniqueVideos.length === 1) url.video = uniqueVideos[0];
  else if (uniqueVideos.length > 1) url.videos = uniqueVideos;
  else url.video = null;
  if (uniqueAudios.length === 1) url.audio = uniqueAudios[0];
  else if (uniqueAudios.length > 1) url.audios = uniqueAudios;
  else url.audio = null;
  url.images = uniqueImages;
  // thumbnail hanya untuk poster video (kalau sudah ada di images, jangan duplikat)
  if (!uniqueImages.length && primaryImage) url.thumbnail = primaryImage;

  const captionText = firstDefined(media.caption?.text, '');
  const tags = extractTags(captionText);
  const owner = media.user || {};
  const info = media.text_post_app_info || {};

  const type = deriveType(media, items);

  const result = {
    success: true,
    scraped_at: startedAt,
    source_url: target.input,
    permalink: target.permalink,
    post_id: String(media.pk || postId),
    code: firstDefined(media.code, null),
    type,
    canonical_url: firstDefined(media.canonical_url, media.code ? `https://www.threads.com/t/${media.code}` : null),
    url,
    caption: {
      text: captionText,
      hashtags: tags.hashtags,
      mentions: tags.mentions,
    },
    author: {
      username: firstDefined(owner.username, null),
      full_name: firstDefined(owner.full_name, null),
      id: firstDefined(owner.pk, owner.id, null),
      is_verified: firstDefined(owner.is_verified, false),
      profile_pic_url: firstDefined(owner.profile_pic_url, null),
      url: owner.username ? `https://www.threads.com/@${owner.username}` : null,
    },
    posted_at: toIso(firstDefined(media.taken_at, null)),
    posted_at_unix: firstDefined(media.taken_at, null),
    stats: {
      like: firstDefined(media.like_count, null),
      comment: firstDefined(info.direct_reply_count, null),
      reply: firstDefined(info.direct_reply_count, null),
      repost: firstDefined(info.repost_count, null),
      quote: firstDefined(info.quote_count, null),
      reshare: firstDefined(info.reshare_count, null),
    },
    media: {
      media_type: firstDefined(media.media_type, null),
      media_type_label: type,
      width: firstDefined(media.original_width, items[0]?.width, null),
      height: firstDefined(media.original_height, items[0]?.height, null),
      has_audio: firstDefined(media.has_audio, items.some(i => i.has_audio), null),
      item_count: items.length,
      is_carousel: items.length > 1,
      items: items.map((it, idx) => ({
        index: idx + 1,
        pk: it.pk,
        code: it.code,
        media_type: it.media_type,
        is_video: it.is_video,
        width: it.width,
        height: it.height,
      })),
    },
    linked_post: linked ? {
      pk: firstDefined(linked.pk, null),
      code: firstDefined(linked.code, null),
      username: firstDefined(linked.user?.username, null),
      caption_text: linked.caption?.text || null,
      media_type: firstDefined(linked.media_type, null),
      url: firstDefined(linked.code, null) ? `https://www.instagram.com/p/${linked.code}/` : firstDefined(info.link_preview_attachment?.url, null),
    } : null,
    comments: {
      available: true,
      count: firstDefined(info.direct_reply_count, null),
      top: replies,
    },
  };

  const firstVideo = result.url.video || result.url.videos?.[0] || null;
  const firstImage = result.url.images?.[0] || result.url.thumbnail || null;
  const videoCheck = firstVideo ? await verifyMediaUrl(firstVideo) : null;
  const imageCheck = firstImage ? await verifyMediaUrl(firstImage) : null;

  result.verification = {
    video: slimCheck(videoCheck),
    image: slimCheck(imageCheck),
    all_cdn_ok: Boolean((videoCheck ? videoCheck.ok : true) && (imageCheck ? imageCheck.ok : true)),
  };

  return result;
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!args.length) {
    console.log(JSON.stringify({ success: false, error: 'Usage: node threads.js "<threads-url>" ["<url2>" ...]' }, null, 2));
    process.exit(1);
  }
  try {
    const results = [];
    for (const u of args) results.push(await threadsDL(u));
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
    if (results.some(r => r.verification && !r.verification.all_cdn_ok)) process.exitCode = 2;
  } catch (err) {
    console.log(JSON.stringify({ success: false, error: err.message, status: err.response?.status || null }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { threadsDL };


//RESULT
/*
image:
{
  "success": true,
  "scraped_at": "2026-10-05T13:33:13.727Z",
  "source_url": "https://www.threads.com/share/BAFMYe__aO/",
  "permalink": "https://www.threads.com/share/BAFMYe__aO/",
  "post_id": "4000564793585776792",
  "code": "DeE3HvenTiY",
  "type": "image",
  "canonical_url": "https://www.threads.com/t/DeE3HvenTiY",
  "url": {
    "video": null,
    "audio": null,
    "images": [
      "https://instagram.fupg6-1.fna.fbcdn.net/v/t51.82787-15/838714980_18124312165927068_5128382936047511091_n.jpg?stp=cp6_dst-jpg_e35_tt6&_nc_cat=109&_nc_map=urlgen_bucketless&ig_cache_key=NDAwMDU2NDc5MzU4NTc3Njc5Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTE3MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=v1q0Zhft_IEQ7kNvwG4QEXc&_nc_oc=Adr_Wsu2Dxs6mxCAZ1-UhTDeuVNgL7InMew0FM97nVkRjuVV4BZGteFuHOaBmFQ2quo&_nc_zt=23&_nc_ht=instagram.fupg6-1.fna&_nc_gid=aCU8tYtismBpl2VyyHjk3Q&_nc_ss=7020f&oh=00_AQPS1nd9qGv9FBZ0WEFz7aJeXFN3EIaNPkTA3KKEQ22ZyQ&oe=6AC98AB4"
    ]
  },
  "caption": {
    "text": "Kegiatan sehari-hari cuma switch ke 3 aplikasi ini anjerrr",
    "hashtags": [],
    "mentions": []
  },
  "author": {
    "username": "defrianars",
    "full_name": "Defrian Aris Tanuwidjaja",
    "id": "27747807067",
    "is_verified": false,
    "profile_pic_url": "https://scontent.cdninstagram.com/v/t51.82787-19/825323477_18123018346927068_9169014436561799115_n.jpg?_nc_cat=104&ccb=7-5&_nc_sid=30ff31&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xNTAuQzMifQ%3D%3D&_nc_ohc=E9MhjTkSBKEQ7kNvwFAU398&_nc_oc=AdoziZo9I---k07D_NsOmJzMNtY9YgTAKHpxp4CfeswS5UqJOeS3Qa-0yVdP2kYnGMo&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=aCU8tYtismBpl2VyyHjk3Q&_nc_ss=7020f&oh=00_AQNLHVvxnJ903570Ln0-K9tMtrpFJU_LR3_FLDcQrxMJoA&oe=6AC97713",
    "url": "https://www.threads.com/@defrianars"
  },
  "posted_at": "2026-10-04T14:35:08.000Z",
  "posted_at_unix": 1791124508,
  "stats": {
    "like": 4228,
    "comment": 79,
    "reply": 79,
    "repost": 503,
    "quote": 13,
    "reshare": 73
  },
  "media": {
    "media_type": 1,
    "media_type_label": "image",
    "width": 1170,
    "height": 367,
    "has_audio": false,
    "item_count": 1,
    "is_carousel": false,
    "items": [
      {
        "index": 1,
        "pk": "4000564793585776792",
        "code": "DeE3HvenTiY",
        "media_type": 1,
        "is_video": false,
        "width": 1170,
        "height": 367
      }
    ]
  },
  "linked_post": null,
  "comments": {
    "available": true,
    "count": 79,
    "top": [
      {
        "pk": "4000577415538364508",
        "code": "DeE5_alnVBc",
        "username": "defrianars",
        "full_name": "Defrian Aris Tanuwidjaja",
        "text": "Udah nih",
        "like_count": 2,
        "posted_at": "2026-10-04T15:00:13.000Z"
      },
      {
        "pk": "4000566113246733785",
        "code": "DeE3a8giWXZ",
        "username": "virarhm_",
        "full_name": null,
        "text": "weekendku dengan para anomali ini",
        "like_count": 0,
        "posted_at": "2026-10-04T14:37:45.000Z"
      },
      {
        "pk": "4000567130568199675",
        "code": "DeE3pv9nw37",
        "username": "kinanest",
        "full_name": null,
        "text": "Rilll",
        "like_count": 0,
        "posted_at": "2026-10-04T14:39:47.000Z"
      },
      {
        "pk": "4000567817317625417",
        "code": "DeE3zvjE65J",
        "username": "juneeef",
        "full_name": "Juni F",
        "text": "sampe bosen muter2",
        "like_count": 0,
        "posted_at": "2026-10-04T14:41:09.000Z"
      },
      {
        "pk": "4000568749216450103",
        "code": "DeE4BTck0Y3",
        "username": "lovelyuj__",
        "full_name": "UJin ✨",
        "text": "bener lagi ...",
        "like_count": 0,
        "posted_at": "2026-10-04T14:43:00.000Z"
      },
      {
        "pk": "4000569880831644137",
        "code": "DeE4RxWGNHp",
        "username": "dyuni04",
        "full_name": "Dwii Yuniiartii",
        "text": "ampe puyeng ya bang? karna bingung mau ngapain lagi wkwk",
        "like_count": 0,
        "posted_at": "2026-10-04T14:45:15.000Z"
      },
      {
        "pk": "4000571469692364670",
        "code": "DeE4o5Fk2d-",
        "username": "_vel.qia",
        "full_name": "4ndr0meda",
        "text": "sampe stress, tapi kalo gak ada mereka bakal lebih stress",
        "like_count": 0,
        "posted_at": "2026-10-04T14:48:24.000Z"
      },
      {
        "pk": "4000574944447148422",
        "code": "DeE5bdNGbGG",
        "username": "rren.ii__",
        "full_name": "gulaarren_",
        "text": "tambah Whatsapp",
        "like_count": 0,
        "posted_at": "2026-10-04T14:55:18.000Z"
      },
      {
        "pk": "4000581225836393046",
        "code": "DeE623NEzJW",
        "username": "cameliamalk",
        "full_name": null,
        "text": "shopee gk pakek kah",
        "like_count": 0,
        "posted_at": "2026-10-04T15:07:47.000Z"
      },
      {
        "pk": "4000576021995828290",
        "code": "DeE5rIwAbRC",
        "username": "krabbbss.sszs",
        "full_name": "krabss.sszs",
        "text": "hahaha iya lg",
        "like_count": 0,
        "posted_at": "2026-10-04T14:57:27.000Z"
      }
    ]
  },
  "verification": {
    "video": null,
    "image": {
      "ok": true,
      "status": 200,
      "content_type": "image/jpeg",
      "content_length": 26222,
      "error": null
    },
    "all_cdn_ok": true
  }
}


video:
{
  "success": true,
  "scraped_at": "2026-10-05T13:34:58.881Z",
  "source_url": "https://www.threads.com/share/BAo4O5AVfz/",
  "permalink": "https://www.threads.com/share/BAo4O5AVfz/",
  "post_id": "4000615824565074310",
  "code": "DeFCuVyAfmG",
  "type": "video",
  "canonical_url": "https://www.threads.com/t/DeFCuVyAfmG",
  "url": {
    "video": "https://instagram.fupg6-1.fna.fbcdn.net/o1/v/t16/f2/m84/AQOqELWvnVj8SyqhIObwJIkW0ewlUayySJVw4LY6u1wHfNOGiVVIE-h2gO3vsQO-KUye9AgfiLuk9rF_RLyLeotRw7DVmdBLgBTD4Dc.mp4?_nc_cat=101&_nc_oc=AdqTqu2NgyvZJZRqV10wl6qm6kjwP-_7gFBL-dWxIBJOpLnZUK9x705a2roq3-ixDcA&_nc_sid=5e9851&_nc_ht=instagram.fupg6-1.fna.fbcdn.net&_nc_ohc=CrFsefpz9DEQ7kNvwE-4sLt&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5JTlNUQUdSQU0uRkVFRC5DMy4xMjgwLmRhc2hfYmFzZWxpbmVfMV92MSIsInhwdl9hc3NldF9pZCI6MTgxMTE4MjMxNjAwMDE4NDIsImFzc2V0X2FnZV9kYXlzIjowLCJ2aV91c2VjYXNlX2lkIjoxMDE2NCwiZHVyYXRpb25fcyI6MjksInVybGdlbl9zb3VyY2UiOiJ3d3cifQ%3D%3D&ccb=17-1&vs=370cb3df704d4ee7&_nc_vs=HBksFQIYTGlnX2JhY2tmaWxsX3RpbWVsaW5lX3ZvZC9CNTIzRDhFRkExMkE0RUY2ODUxNkQ1Qzg4QTEwMEYyQl92aWRlb19kYXNoaW5pdC5tcDQVAALIARIAFQIYUWlnX3hwdl9wbGFjZW1lbnRfcGVybWFuZW50X3YyL0E0MDM5QjlGNzk2MjQyMjZCNEUxMURGQjQ3MEZFMEY5X2F1ZGlvX2Rhc2hpbml0Lm1wNBUCAsgBEgAoABgAGwKIB3VzZV9vaWwBMRJwcm9ncmVzc2l2ZV9yZWNpcGUBMRUAACbklP6a7qasQBUCKAJDMywXQD0o9cKPXCkYEmRhc2hfYmFzZWxpbmVfMV92MREAdeoHZeieAQA&_nc_gid=y1lFKEKPWrUw1_bZX9Pq-Q&_nc_ss=7020f&_nc_map=urlgen_bucketless&_nc_zt=28&oh=00_AQN6WX3AcYDl2XlH8f08m-QE-ssR0T0a_wbZn671XlbVtw&oe=6AC590CB",
    "audio": "https://instagram.fupg6-1.fna.fbcdn.net/o1/v/t2/f2/m78/AQMOa38FCehyvRc6Y7tbynAAym7pP_tdSP4aLq0EOblgSDMWHFKtMOWNp5sDyBPeD4czqVRRCtvR0mmVwFD24N6fdBwE0m40we8Zd7w.mp4?_nc_cat=108&_nc_oc=Adp8fnKZRa5URfOraP3PjFXpQl-L30Q52J0np7vpZkvZcx8IZzz0YxQ2QileDiW3pFg&_nc_sid=9ca052&_nc_ht=instagram.fupg6-1.fna.fbcdn.net&_nc_ohc=ExEUtCF8Yl4Q7kNvwFboYY_&efg=eyJ2ZW5jb2RlX3RhZyI6ImlnLXhwdmRzLmZlZWQuaWd3d3ctQzMuZGFzaF9sbl9oZWFhY192YnIzX2F1ZGlvIiwidmlkZW9faWQiOm51bGwsIm9pbF91cmxnZW5fYXBwX2lkIjoxNDEyMjM0MTE2MjYwODMyLCJjbGllbnRfbmFtZSI6ImlnIiwieHB2X2Fzc2V0X2lkIjoxODExMTgyMzE2MDAwMTg0MiwiYXNzZXRfYWdlX2RheXMiOjAsInZpX3VzZWNhc2VfaWQiOjEwMTY0LCJkdXJhdGlvbl9zIjoyOSwiYml0cmF0ZSI6NjI3NjEsInVybGdlbl9zb3VyY2UiOiJ3d3cifQ%3D%3D&ccb=17-1&_nc_gid=y1lFKEKPWrUw1_bZX9Pq-Q&_nc_ss=7020f&_nc_map=urlgen_bucketless&_nc_zt=28&oh=00_AQMbTcWyezYzy7H1FIa-KYOE_2oRoHnXqZ_6RMrb0FjwNw&oe=6AC5862D",
    "images": [],
    "thumbnail": "https://instagram.fupg5-1.fna.fbcdn.net/v/t51.71878-15/835246053_1863327644840062_8458963998038669095_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=101&_nc_map=urlgen_bucketless&ig_cache_key=NDAwMDYxNTgyNDU2NTA3NDMxMA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuNjQwLnNkci52aWRlb19kZWZhdWx0X2NvdmVyX2ZyYW1lLkMzIn0%3D&_nc_ohc=X_U58ScGcrMQ7kNvwEArPiM&_nc_oc=AdrdyZBj9trk-dkzK0_4ZdpsfsEv53lPj22d_dJUPEonLgXJ_eH2fB0wlTQ8AvlQGmM&_nc_zt=23&_nc_ht=instagram.fupg5-1.fna&_nc_gid=y1lFKEKPWrUw1_bZX9Pq-Q&_nc_ss=7020f&oh=00_AQMYpShrKxIaBR2BNNsvEjXYoXFCl1O-7z57BFuL20jwlg&oe=6AC97E12"
  },
  "caption": {
    "text": "這幾天一直出現在我的各大平台上\n雖然我覺得我沒有這方面的愛好\n但⋯\n蠻可愛的 吧？？",
    "hashtags": [],
    "mentions": []
  },
  "author": {
    "username": "s_e_a_l_1_2",
    "full_name": "ㄖㄨㄚˋ",
    "id": "30216241841",
    "is_verified": false,
    "profile_pic_url": "https://scontent.cdninstagram.com/v/t51.82787-19/825323259_18109933085001842_2250472748595294449_n.jpg?_nc_cat=103&ccb=7-5&_nc_sid=30ff31&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xNTAuQzMifQ%3D%3D&_nc_ohc=2G0OV8VNrMwQ7kNvwFhHqxU&_nc_oc=Ado2HQl8LZtQ8y-KEfZASiYqMktf23GsKeYufH0XP1A-k3s-YvNrFFYza1l4CAowTxo&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=y1lFKEKPWrUw1_bZX9Pq-Q&_nc_ss=7020f&oh=00_AQMmKpGJMg7HrybM3i80BTyezXMJXpGf0IBtdFFUAx6alA&oe=6AC983A4",
    "url": "https://www.threads.com/@s_e_a_l_1_2"
  },
  "posted_at": "2026-10-04T16:17:40.000Z",
  "posted_at_unix": 1791130660,
  "stats": {
    "like": 1323,
    "comment": 7,
    "reply": 7,
    "repost": 31,
    "quote": 0,
    "reshare": 292
  },
  "media": {
    "media_type": 2,
    "media_type_label": "video",
    "width": 640,
    "height": 294,
    "has_audio": true,
    "item_count": 1,
    "is_carousel": false,
    "items": [
      {
        "index": 1,
        "pk": "4000615824565074310",
        "code": "DeFCuVyAfmG",
        "media_type": 2,
        "is_video": true,
        "width": 640,
        "height": 294
      }
    ]
  },
  "linked_post": null,
  "comments": {
    "available": true,
    "count": 7,
    "top": [
      {
        "pk": "4000926397225396678",
        "code": "DeGJVxHGmnG",
        "username": "_daviyo_0220",
        "full_name": "Daviyo",
        "text": "亞爾斯都說讚",
        "like_count": 15,
        "posted_at": "2026-10-05T02:33:35.000Z"
      },
      {
        "pk": "4001066775655026399",
        "code": "DeGpQitiQ7f",
        "username": "xu_zhikang",
        "full_name": "許致康",
        "text": "愛麗絲呢",
        "like_count": 7,
        "posted_at": "2026-10-05T07:12:29.000Z"
      },
      {
        "pk": "4000913883409643800",
        "code": "DeGGfqtj3kY",
        "username": "antony0920",
        "full_name": "布魯矮斯懷特多拉貢",
        "text": "又…又被硬控了",
        "like_count": 6,
        "posted_at": "2026-10-05T02:08:43.000Z"
      },
      {
        "pk": "4000782820528343454",
        "code": "DeFosc5E8me",
        "username": "leonlee_1012",
        "full_name": "よる",
        "text": "因為這三個跟另一半年齡都差很多的關係（？",
        "like_count": 1,
        "posted_at": "2026-10-04T21:48:19.000Z"
      },
      {
        "pk": "4001245606165265309",
        "code": "DeHR63mkrud",
        "username": "lty__24",
        "full_name": "🦦𝒯𝒾𝓂𝑜𝓉𝒽𝓎",
        "text": "在練劍",
        "like_count": 1,
        "posted_at": "2026-10-05T13:07:47.000Z"
      },
      {
        "pk": "4000723431935104272",
        "code": "DeFbMO9EtUQ",
        "username": "kids_like_u",
        "full_name": null,
        "text": "幼年版也能登場的話\n竟然排擠紅媽😭",
        "like_count": 0,
        "posted_at": "2026-10-04T19:50:19.000Z"
      }
    ]
  },
  "verification": {
    "video": {
      "ok": true,
      "status": 200,
      "content_type": "video/mp4",
      "content_length": 6585132,
      "error": null
    },
    "image": {
      "ok": true,
      "status": 200,
      "content_type": "image/jpeg",
      "content_length": 18896,
      "error": null
    },
    "all_cdn_ok": true
  }
}


slide:
{
  "success": true,
  "scraped_at": "2026-10-05T13:36:39.546Z",
  "source_url": "https://www.threads.com/share/BAdzD60DJQ/",
  "permalink": "https://www.threads.com/share/BAdzD60DJQ/",
  "post_id": "4000924217848883614",
  "code": "DeGI2DaI-me",
  "type": "carousel",
  "canonical_url": "https://www.threads.com/t/DeGI2DaI-me",
  "url": {
    "video": null,
    "audio": null,
    "images": [
      "https://instagram.fupg6-1.fna.fbcdn.net/v/t51.82787-15/825325224_17975154276131645_2281089282668350488_n.webp?_nc_cat=1&ig_cache_key=Mzk5NTIwNjYzODA0OTMzMzg3Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=qI3zr01dA48Q7kNvwGyJx8s&_nc_oc=AdqaDgI5Il3GZoK_N1VZFnpLgznG_HBjqXeJROutEBvVx1YjOLrP82Wc_NOyK9JI5WY&_nc_zt=23&_nc_ht=instagram.fupg6-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQMrpku9Gs2rNlhP2IyLGFaoXt0rkLgL19gV10Lrp7tMlg&oe=6AC99200",
      "https://instagram.fupg5-1.fna.fbcdn.net/v/t51.82787-15/825325865_17975154297131645_5308787933396518464_n.webp?_nc_cat=109&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY0NDU0MjA3MzgwOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=i7Kr8PiCsmQQ7kNvwGgW3jf&_nc_oc=AdoIWFETXlBTh0wCC47nvON3M8t64frbPvof-QmC4HJEIwSOaTmkVoA7CYC7RV6WH7A&_nc_zt=23&_nc_ht=instagram.fupg5-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQPKz6AYMFr0YwxMjT-Y1c2NTMjFMouhvDvbV12_v_tPjw&oe=6AC975D4",
      "https://instagram.fupg6-1.fna.fbcdn.net/v/t51.82787-15/825325915_17975154324131645_2641025952005050_n.webp?_nc_cat=109&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY1MTU5NjkyNDIwNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=_5_A_3Wk3_YQ7kNvwFVczWt&_nc_oc=AdpwJQHgBea6LZYR08tUf5z8vtH-8Ik2Vf6Azccryq4TtFNYuSEpfp7O0oGUsTUkrfM&_nc_zt=23&_nc_ht=instagram.fupg6-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQMdeNUCQW6z3Jr33WOkkVUipK_hmi19UYr8WXm4ydVZHw&oe=6AC98D68",
      "https://instagram.fupg5-1.fna.fbcdn.net/v/t51.82787-15/825325297_17975154345131645_2615468919012167242_n.webp?_nc_cat=108&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY2MTU0NTgwNjAyMw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=D-1IYtH-EhUQ7kNvwHZA4hG&_nc_oc=AdrrtL8KIb7SrxKxvLvzb9UfjNlRtz_PIbiaYjF9I1aR4Nwx84cywK-QxmfSv8nUiL8&_nc_zt=23&_nc_ht=instagram.fupg5-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQOkxmSQhFiEPrR6zgUwRZjNOqGULl64TXEHbNVypHHBbw&oe=6AC97784",
      "https://instagram.fupg5-1.fna.fbcdn.net/v/t51.82787-15/825325267_17975154366131645_8052306843277490001_n.webp?_nc_cat=111&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY2ODM5OTM2MDI3OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=9R9lvFvqtgEQ7kNvwEPp6xj&_nc_oc=AdrX0B-I4c5mRGAPh9VdFjrs_e7F_b3o19wbIXac3kTr7MJIo9iyBcYdLfai-wcePR8&_nc_zt=23&_nc_ht=instagram.fupg5-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQOC92_j4uYx1wD4zynRpDCvT5uxW_3jTo8IVBPbsTMQVQ&oe=6AC992D5",
      "https://instagram.fupg5-1.fna.fbcdn.net/v/t51.82787-15/825325947_17975154375131645_2252690260170961785_n.webp?_nc_cat=110&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY3MzQ1NzYzMDI1Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=UN7db6XdKhUQ7kNvwGofUfv&_nc_oc=AdoXHnkJxrDeYjywwgpVspOv9PW-znWqg5IeoKSW_60MT-oUCVSakv8A5PmnUlsJZ-k&_nc_zt=23&_nc_ht=instagram.fupg5-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQPYybYAnPkNQMDku2RCgNn9K8BCF1UI1q8LBrf77VatLA&oe=6AC96270",
      "https://instagram.fupg5-1.fna.fbcdn.net/v/t51.82787-15/825325836_17975154408131645_5029669550132274792_n.webp?_nc_cat=104&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY4NTYyMTE3Njk2NQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=URFZDmp8SYgQ7kNvwF-4pZx&_nc_oc=AdqiqoJdyIrvvEzxAAGDO2fElzumRdJjUvTwvYBPTus8uRz79puds-VrtjwOfujpGUo&_nc_zt=23&_nc_ht=instagram.fupg5-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQOtDrq7Tr9qhEYFNY7vpLPBK79vMDs_8UTTOisfDlltjg&oe=6AC9682A",
      "https://instagram.fupg6-1.fna.fbcdn.net/v/t51.82787-15/825325892_17975154429131645_3804162378160166772_n.webp?_nc_cat=105&_nc_map=urlgen_bucketless&ig_cache_key=Mzk5NTIwNjY5NjY5Mzk2NTEyNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=5C4zbEkIjPgQ7kNvwEvY-1v&_nc_oc=AdoP_Zt7X200VlMzthGc-J7kmvEkbMnv_OvKqgFvUjg8A0rxADauW7M_CRuuRpSfsbA&_nc_zt=23&_nc_ht=instagram.fupg6-1.fna&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQMYOVG_KO9EQcgp3FWjacbMcbRJbddvn2eg4F7Wg8C3Ig&oe=6AC9696A"
    ]
  },
  "caption": {
    "text": "That Eren+Mikasa= Rin is official anyway but am shocked by the rest. Even though it's Fanon it makes sense",
    "hashtags": [],
    "mentions": []
  },
  "author": {
    "username": "arnold_and_erens_wife",
    "full_name": "Ruby",
    "id": "43632350323",
    "is_verified": false,
    "profile_pic_url": "https://scontent.cdninstagram.com/v/t51.82787-19/654599912_18060735605454324_3960287399446092303_n.jpg?_nc_cat=111&ccb=7-5&_nc_sid=30ff31&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xNTAuQzMifQ%3D%3D&_nc_ohc=S6cD_cewcEIQ7kNvwEnsmdW&_nc_oc=AdoVvw7pXxBCp5t6rNpKIThj59j5qoGN30AKhSP87Sj9rnD3fRQGHq5Eu3P4kYZZMmU&_nc_zt=24&_nc_ht=scontent.cdninstagram.com&_nc_gid=9_vDzyfhoPjp9WuIPWzHGQ&_nc_ss=7020f&oh=00_AQP9N2l-4Tvhimfvj3PkKRQ-KBQbExEBscc31Nd6egakuA&oe=6AC990B3",
    "url": "https://www.threads.com/@arnold_and_erens_wife"
  },
  "posted_at": "2026-10-05T02:29:15.000Z",
  "posted_at_unix": 1791167355,
  "stats": {
    "like": 767,
    "comment": 6,
    "reply": 6,
    "repost": 28,
    "quote": 1,
    "reshare": 30
  },
  "media": {
    "media_type": 19,
    "media_type_label": "carousel",
    "width": 612,
    "height": 612,
    "has_audio": false,
    "item_count": 8,
    "is_carousel": true,
    "items": [
      {
        "index": 1,
        "pk": "3995206638049333872",
        "code": "Ddx00URNpJw",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 2,
        "pk": "3995206644542073809",
        "code": "Ddx00aUNevR",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 3,
        "pk": "3995206651596924206",
        "code": "Ddx00g4tmUu",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 4,
        "pk": "3995206661545806023",
        "code": "Ddx00qJtkjH",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 5,
        "pk": "3995206668399360279",
        "code": "Ddx00wiNzkX",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 6,
        "pk": "3995206673457630256",
        "code": "Ddx001Ptkww",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 7,
        "pk": "3995206685621176965",
        "code": "Ddx01Akt0qF",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      },
      {
        "index": 8,
        "pk": "3995206696693965126",
        "code": "Ddx01K4tKFG",
        "media_type": 1,
        "is_video": false,
        "width": 1080,
        "height": 1439
      }
    ]
  },
  "linked_post": {
    "pk": "3995207110132319321",
    "code": "Ddx07L7jURZ",
    "username": "aizenmotion",
    "caption_text": "『NARUTO』— 受け継がれる意志、揺るがない絆、そして決して消えることのない伝説。\n\nナルトの歩みは、ただの物語ではない。\n挑戦、成長、仲間との絆――そのすべてが 今も世界中のファンの心を動かし続けている。\n\n毎日ハイクオリティなアニメエディットを届け る @aizenmotion 。\nNARUTOをはじめ、最高峰のアニメ作品をシネマティックな映像で発信中。\n 本物のアニメファンなら、次の一本も見逃せない。",
    "media_type": 8,
    "url": "https://www.instagram.com/p/Ddx07L7jURZ/"
  },
  "comments": {
    "available": true,
    "count": 6,
    "top": [
      {
        "pk": "4001192237899954543",
        "code": "DeHFyQiE7lv",
        "username": "cuman_buat_mpls",
        "full_name": "mey",
        "text": "I'm gonna rip you apart just from seeing the gon + killua part. They are kids. Gon and killua are 12",
        "like_count": 0,
        "posted_at": "2026-10-05T11:21:45.000Z"
      },
      {
        "pk": "4001254445383445160",
        "code": "DeHT7fxCGqo",
        "username": "skaro_jnr",
        "full_name": "𖤐∘*ﾟ 𝕿𝖍𝖊_𝖇𝖔𝖞_𝖟𝖍𝖔𝖑𝖉𝖞𝖈𝖐 *ﾟ∘𖤐",
        "text": "It's just jokes man, they can't even reproduce neither of them are females🤦",
        "like_count": 0,
        "posted_at": "2026-10-05T13:25:21.000Z"
      },
      {
        "pk": "4001222394215447857",
        "code": "DeHMpFyjL0x",
        "username": "the_lazybones95",
        "full_name": "SansFromBoneVerse",
        "text": "Fusing characters are insane, even my reborn",
        "like_count": 0,
        "posted_at": "2026-10-05T12:21:40.000Z"
      },
      {
        "pk": "4001249010891330066",
        "code": "DeHSsagD5IS",
        "username": "jagrut965",
        "full_name": "Jagrut",
        "text": "It's scary how much this looks less logical",
        "like_count": 0,
        "posted_at": "2026-10-05T13:14:33.000Z"
      }
    ]
  },
  "verification": {
    "video": null,
    "image": {
      "ok": true,
      "status": 200,
      "content_type": "image/webp",
      "content_length": 60920,
      "error": null
    },
    "all_cdn_ok": true
  }
}
*/
[6/10 15.17] null: /*
 * Terabox Downloader
 * type: Scraper
 * base url: sechno.com/tools/terabox-downloader
 * api: POST https://sechno.com/api/terabox { url }
 * note: ambil direct url/link akhir untuk downloader files terabox.
 */

const axios = require('axios');

const API_URL = 'https://sechno.com/api/terabox';
const TOOL_URL = 'https://sechno.com/tools/terabox-downloader';
const UA_BROWSER = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

const api = axios.create({
  timeout: 30000,
  maxRedirects: 10,
  validateStatus: s => s < 500,
  headers: {
    'User-Agent': UA_BROWSER,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    'Origin': 'https://sechno.com',
    'Referer': TOOL_URL,
  },
});

const cdn = axios.create({
  timeout: 30000,
  maxRedirects: 10,
  validateStatus: s => s < 500,
  headers: { 'User-Agent': UA_BROWSER, Referer: TOOL_URL },
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, retries = 3, baseDelay = 1000) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status || err.status;
      const retryable = status === undefined || status === 429 || status >= 500;
      if (!retryable || i === retries - 1) throw err;
      await sleep(baseDelay * (i + 1));
    }
  }
  throw lastErr;
}

function parseInput(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('URL kosong');
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error(`URL tidak valid: ${raw}`);
  }
  return { input: raw, host: u.hostname.toLowerCase(), surl: u.searchParams.get('surl') || null };
}

async function verifyDirectUrl(url) {
  const result = { url: url || null, ok: false, head_ok: false };
  if (!url) {
    result.error = 'URL tidak tersedia';
    return result;
  }
  try {
    const head = await cdn.head(url);
    result.status = head.status;
    result.content_type = head.headers['content-type'] || null;
    result.content_length = Number(head.headers['content-length'] || 0) || null;
    result.filename = /filename="?([^";]+)"?/i.exec(head.headers['content-disposition'] || '')?.[1] || null;
    result.head_ok = head.status === 200 || head.status === 206;
    result.ok = result.head_ok;
  } catch (err) {
    result.error = err.message;
  }
  return result;
}

function slimCheck(r) {
  if (!r) return null;
  return {
    ok: Boolean(r.ok),
    status: r.status ?? null,
    content_type: r.content_type ?? null,
    content_length: r.content_length ?? null,
    error: r.error ?? null,
  };
}

async function teraboxdl(inputUrl) {
  const target = parseInput(inputUrl);
  const startedAt = new Date().toISOString();

  const res = await withRetry(() => api.post(API_URL, { url: target.input }));
  const data = res.data;

  if (res.status >= 400) {
    throw new Error(data?.error || data?.message || `Gagal fetch sechno (HTTP ${res.status})`);
  }
  if (!data || data.success !== true) {
    throw new Error(data?.error || data?.message || 'Gagal mengambil file (success != true)');
  }

  const files = Array.isArray(data.files) ? data.files.map(f => ({
    filename: f.filename || null,
    size: f.size != null ? Number(f.size) : null,
    size_formatted: f.sizeFormatted || null,
  })) : [];

  if (!files.length) {
    const err = new Error('File tidak ditemukan di share link ini (mungkin privat / terhapus / expired).');
    err.detail = { title: data.title || null, short_id: data.shortId || null };
    throw err;
  }

  const directUrl = Array.isArray(data.files) ? (data.files.map(f => f.downloadUrl).filter(Boolean)[0] || null) : null;

  const result = {
    success: true,
    scraped_at: startedAt,
    source_url: target.input,
    title: data.title || files[0]?.filename || null,
    url: directUrl,
    files,
  };

  // verifikasi HEAD ke link akhir (tanpa download full file)
  const check = await verifyDirectUrl(directUrl);
  result.verification = slimCheck(check);

  return result;
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const url = args.find(a => !a.startsWith('-'));

  if (!url) {
    console.log(JSON.stringify({
      success: false,
      error: 'Usage: node terabox.js "<terabox-share-url>"',
      example: 'node terabox.js "https://www.terabox.com/wap/share/filelist?surl=DgO16Ts6xQte_PbWjgLv4g"',
    }, null, 2));
    process.exit(1);
  }

  try {
    const result = await teraboxdl(url);
    console.log(JSON.stringify(result, null, 2));
    if (result.verification && !result.verification.ok) process.exitCode = 2;
  } catch (err) {
    console.log(JSON.stringify({
      success: false,
      source_url: url,
      error: err.message,
      detail: err.detail || null,
      status: err.response?.status || err.status || null,
    }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { teraboxdl };

/*
{
  "success": true,
  "scraped_at": "2026-10-06T08:16:16.832Z",
  "source_url": "https://www.terabox.com/wap/share/filelist?surl=DgO16Ts6xQte_PbWjgLv4g",
  "title": "Video_Cosplay264.zip",                                       "url": "https://iteraplay.tera-api71.workers.dev/dlink-fetch?token=YD4Pb2oCqVdzXA-YUrJcL43wnH7i9SNMfkvCBmDX1xfFtesZt4t_1tkbP-flgdhk5xVvLMKxf1zCMsO9-ytoeMUANfYR7rJb_wLHfWhqFpT6chcUJCfDkLrcyw3L9i9-NiBmjjlfmfhnuHfGPsSM3sNI4bXOMNb2UP_7ijZzT5pGQ4X9DTW9ZkWfbqtnRGAbIzP2bB3gKXM3fqKAlSAErQymdipOr87r8EHeKRCTtCP0qMsmgwrhUB0a_bQ8o3oz2OE1E5-bWpkK11_VXjpqxVASbCiTWXoNL6aWZQyjK9QJEBJR49XPpJ_R9qod75Wb2CeTHNv6etL16mxLe5MkyTAVZ6bg0zkleYCpq-8WOs6lU_tO3rX0ZwLmEswH-8vJogKvevRVGQ0VCQI&file_name=Video_Cosplay264.zip",                                                                     "files": [                                                               {                                                                        "filename": "Video_Cosplay264.zip",                                    "size": 383820684,                                                     "size_formatted": "366.04 MB"                                        }                                                                    ],
  "verification": {
    "ok": true,
    "status": 200,
    "content_type": "application/zip",
    "content_length": 383820684,
    "error": null
  }
}
*/
[11/10 16.04] null: /*
 * TempMail ( @gmail.com ) 
 * type: Scraper
 * base url: emailnator.com
 * author: wa.me/ikyykzy
 * note: tempmail ada banyak sih pilihan emailnya bukan cuma gmail.com sesuaikan ajh, bisa bulk juga.
*/

const BASE_URL = 'https://www.emailnator.com';

const EMAIL_TYPES = { domain: 1, plusGmail: 2, dotGmail: 3, googleMail: 8 };

const TYPE_NAMES = Object.fromEntries(
  Object.entries(EMAIL_TYPES).map(([k, v]) => [v, k])
);

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36',
};

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function resolveIds(opts) {
  if (typeof opts === 'number') return [opts];
  if (Array.isArray(opts)) return opts;
  if (opts && typeof opts === 'object' && opts.ids) return opts.ids;
  if (!opts) return [EMAIL_TYPES.dotGmail];
  const type = String(opts.type || 'dotGmail');
  const id = EMAIL_TYPES[type]
    || Object.entries(EMAIL_TYPES).find(([k]) => k.toLowerCase() === type.toLowerCase())?.[1];
  if (!id) throw new Error(`Unknown email type: ${type}. Available: ${Object.keys(EMAIL_TYPES).join(', ')}`);
  return [id];
}

async function generate(opts) {
  const ids = resolveIds(opts);
  const count = opts && typeof opts === 'object' && opts.bulk ? opts.bulk : null;
  if (count) {
    const data = await request('/api/generate-bulk-email', { method: 'POST', body: { ids, count } });
    const emails = (data.results || []).map(r => r.email);
    return { email: emails[0] || null, emails, results: data.results, type: TYPE_NAMES[ids[0]], ids };
  }
  const data = await request('/api/generate-email', { method: 'POST', body: { ids } });
  return { email: data.email, type: data.type || TYPE_NAMES[ids[0]], email_type_id: data.email_type_id, raw: data };
}

async function inbox(email, limit = 20) {
  const data = await request('/api/message-list', { method: 'POST', body: { email, limit } });
  return {
    email,
    messages: data.messages || [],
    message_count: data.message_count,
    message_limit: data.message_limit,
    upgrade_available: data.upgrade_available || false,
  };
}

async function read(messageId) {
  return request('/api/message/' + encodeURIComponent(messageId));
}

async function extend(email) {
  return request('/api/extend-email', { method: 'POST', body: { email } });
}

async function remove(messageId) {
  return request('/api/delete-message/' + encodeURIComponent(messageId), { method: 'DELETE' });
}

async function gmailNator(...args) {
  if (args.length === 0) return generate(undefined);

  const [first, second] = args;

  if (typeof first === 'object' || Array.isArray(first) || typeof first === 'number') {
    return generate(first);
  }

  const cmd = String(first).toLowerCase();
  switch (cmd) {
    case 'generate':
    case 'gen':
    case 'new':
      return generate(second);
    case 'inbox':
    case 'list':
    case 'messages':
      if (typeof second !== 'string' || !second.includes('@')) {
        throw new Error('inbox: email address required, e.g. gmailNator("inbox", "user@gmail.com")');
      }
      return inbox(second);
    case 'read':
    case 'view':
    case 'message':
      if (!second) throw new Error('read: message id required');
      return read(second);
    case 'extend':
      return extend(second);
    case 'delete':
    case 'remove':
      if (!second) throw new Error('delete: message id required');
      return remove(second);
    default:
      throw new Error(`Unknown command: ${cmd}`);
  }
}

gmailNator.generate = generate;
gmailNator.inbox = inbox;
gmailNator.read = read;
gmailNator.extend = extend;
gmailNator.delete = remove;
gmailNator.remove = remove;
gmailNator.EMAIL_TYPES = EMAIL_TYPES;

module.exports = gmailNator;

if (require.main === module) {
  (async () => {
    const [, , cmd, arg] = process.argv;
    try {
      const result = await gmailNator(...(cmd ? [cmd, arg].filter(Boolean) : []));
      console.log(JSON.stringify(result, null, 2));
      if (cmd === 'read' && result.content && !/^\s*\(?Unknown|<html/i.test(result.content)) {
        const html = (result.content || '').replace(/<[^>]+>/g, ' ');
        console.log('\n--- plain text ---\n' + html.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
      }
    } catch (err) {
      console.error(JSON.stringify({ error: err.message, status: err.status || err.data || undefined }, null, 2));
      process.exit(1);
    }
  })();
}
[11/10 23.41] null: /**
CAPCUT DOWNLOADER
TYPE: SCRAPE
BASE: https://videodown.io.vn
AUTHOR: SWIPER FVCK
NOTE: SUPPORT THUMBNAIL, AUDIO(KALO ADA)
**/

const axios = require('axios');

const API_URL = 'https://videodown.io.vn/api/download';

async function scrapeCapcut(url) {
    try {
        const response = await axios.post(API_URL, {
            platform: 'capcut',
            input: url
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });

        const data = response.data;

        if (!data.status) {
            throw new Error(data.message || 'API Error');
        }

        return data.payload;

    } catch (err) {
        console.error('❌ Scrape error:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
        throw err;
    }
}

function formatResult(payload) {
    return {
        source: payload.source,
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        thumbnail: payload.thumbnail,
        videos: (payload.videos || []).map((v, i) => ({
            index: i + 1,
            label: v.label,
            quality: v.quality || v.label,
            url: v.url
        })),
        audios: (payload.audios || []).map((a, i) => ({
            index: i + 1,
            label: a.label,
            url: a.url
        })),
        images: (payload.images || []).map((img, i) => ({
            index: i + 1,
            url: img.url,
            alt: img.alt
        }))
    };
}

// ============================================
// CLI
// ============================================
async function main() {
    const url = process.argv[2] || 'https://www.capcut.com/tv2/ZSb3M2KgR/';

    console.log('🚀 Scraping videodown.io.vn');
    console.log(`🔗 URL: ${url}\n`);

    try {
        const payload = await scrapeCapcut(url);
        const result = formatResult(payload);

        console.log('═══════════════════════════════════════');
        console.log('📦 RESULT');
        console.log('═══════════════════════════════════════');
        console.log(`📝 Title       : ${result.title}`);
        console.log(`👤 Uploader    : ${result.subtitle}`);
        console.log(`📄 Description : ${result.description}`);
        console.log(`🔗 Source      : ${result.source}`);
        console.log(`🖼️  Thumbnail   : ${result.thumbnail}`);

        if (result.videos.length) {
            console.log(`\n📹 VIDEOS (${result.videos.length}):`);
            result.videos.forEach(v => {
                console.log(`\n   [${v.index}] ${v.label}`);
                console.log(`       Quality : ${v.quality}`);
                console.log(`       URL     : ${v.url}`);
            });
        }

        if (result.audios.length) {
            console.log(`\n🎵 AUDIOS (${result.audios.length}):`);
            result.audios.forEach(a => {
                console.log(`   [${a.index}] ${a.label || '-'}`);
                console.log(`       URL: ${a.url}`);
            });
        }

        if (result.images.length) {
            console.log(`\n🖼️  IMAGES (${result.images.length}):`);
            result.images.forEach(img => {
                console.log(`   [${img.index}] ${img.alt || '-'}`);
                console.log(`       URL: ${img.url}`);
            });
        }

        console.log('\n═══════════════════════════════════════');

    } catch (err) {
        console.error('❌ Fatal:', err.message);
        process.exit(1);
    }
}

// ============================================
// EXPORT + RUN
// ============================================
module.exports = { scrapeCapcut, formatResult };

if (require.main === module) {
    main();
}
[12/10 00.30] null: /**
INSTAGRAM DOWNLOADER
TYPE: SCRAPE
BASE: https://videodown.io.vn
AUTHOR: SWIPER FVCK
NOTE: -
**/

const axios = require('axios');

const API_URL = 'https://videodown.io.vn/api/download';

async function scrapeInstagram(url) {
    if (!/instagram\.com\/(p|reel|tv)\//i.test(url)) {
        throw new Error('URL bukan Instagram post/reel/tv');
    }

    try {
        const response = await axios.post(API_URL, {
            platform: 'instagram',
            input: url
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });

        const data = response.data;

        if (!data.status) {
            throw new Error(data.message || 'API Error');
        }

        return data.payload;

    } catch (err) {
        console.error('❌ Scrape error:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
        throw err;
    }
}

function formatResult(payload) {
    return {
        source: payload.source,
        title: payload.title,
        description: payload.description,
        thumbnail: payload.thumbnail,
        videos: (payload.videos || []).map((v, i) => ({
            index: i + 1,
            label: v.label || `Media ${i + 1}`,
            url: v.url
        })),
        images: (payload.images || []).map((img, i) => ({
            index: i + 1,
            url: img.url,
            alt: img.alt
        }))
    };
}

// ============================================
// CLI
// ============================================
async function main() {
    const url = process.argv[2];

    if (!url) {
        console.error('Usage: node instagram-downloader.js <url>');
        console.error('Example: node instagram-downloader.js "https://www.instagram.com/reel/DeV8MOvJWbi"');
        process.exit(1);
    }

    console.log('🚀 Instagram Downloader');
    console.log(`🔗 URL: ${url}\n`);

    try {
        const payload = await scrapeInstagram(url);
        const result = formatResult(payload);

        console.log('═══════════════════════════════════════');
        console.log('📦 RESULT');
        console.log('═══════════════════════════════════════');
        console.log(`📝 Title       : ${result.title || '-'}`);
        console.log(`📄 Description : ${result.description || '-'}`);
        console.log(`🔗 Source      : ${result.source}`);

        if (result.videos.length) {
            console.log(`\n📹 MEDIA (${result.videos.length}):`);
            result.videos.forEach(v => {
                console.log(`\n   [${v.index}] ${v.label}`);
                console.log(`       URL: ${v.url}`);
            });
        }

        if (result.images.length) {
            console.log(`\n🖼️  IMAGES (${result.images.length}):`);
            result.images.forEach(img => {
                console.log(`   [${img.index}] ${img.alt || '-'}`);
                console.log(`       URL: ${img.url}`);
            });
        }

        console.log('\n═══════════════════════════════════════');

    } catch (err) {
        console.error('❌ Fatal:', err.message);
        process.exit(1);
    }
}

// ============================================
// EXPORT + RUN
// ============================================
module.exports = { scrapeInstagram, formatResult };

if (require.main === module) {
    main();
}
[12/10 00.46] null: /**
PROXY FREE
TYPE: SCRAPE
BASE: https://proxylist.geonode.com
AUTHOR: SWIPER FVCK
NOTE:
# Semua proxy (default)
node proxy-list.js

# Filter Indonesia, socks5, elite
node proxy-list.js ID socks5 elite

# Filter US, http, elite
node proxy-list.js US http elite

# Filter Singapore, https, anonymous
node proxy-list.js SG https anonymous

(!) bebas atur sesukamu
**/

const axios = require('axios');

const API_URL = 'https://proxylist.geonode.com/api/proxy-list';

async function getProxyList(options = {}) {
    const {
        page = 1,
        limit = 100,
        sortBy = 'responseTime',
        sortType = 'asc',
        protocol = null,       // 'http', 'https', 'socks4', 'socks5'
        country = null,        // 'ID', 'US', 'SG', dll
        anonymity = null,      // 'transparent', 'anonymous', 'elite'
        google = null          // true = cuma yang bisa akses Google
    } = options;

    const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_type: sortType
    };

    if (protocol) params.protocols = protocol;
    if (country) params.country = country;
    if (anonymity) params.anonymityLevel = anonymity;
    if (google !== null) params.google = google;

    const res = await axios.get(API_URL, {
        params,
        timeout: 30000
    });

    return res.data;
}

function formatProxy(p) {
    return {
        ip: p.ip,
        port: p.port,
        protocol: p.protocols?.[0] || 'http',
        url: `${p.protocols?.[0] || 'http'}://${p.ip}:${p.port}`,
        country: p.country,
        city: p.city,
        isp: p.isp,
        org: p.org,
        anonymity: p.anonymityLevel,
        google: p.google,
        latency: p.latency,
        responseTime: p.responseTime,
        speed: p.speed,
        upTime: p.upTime,
        lastChecked: new Date(p.lastChecked * 1000).toISOString()
    };
}

function filterElite(proxies) {
    return proxies.filter(p => p.anonymityLevel === 'elite');
}

function filterByCountry(proxies, country) {
    return proxies.filter(p => p.country === country);
}

// ============================================
// CLI
// ============================================
async function main() {
    const country = process.argv[2] || null;
    const protocol = process.argv[3] || 'socks5';
    const anonymity = process.argv[4] || 'elite';

    console.log('🚀 Geonode Proxy List Scraper\n');

    const options = {
        page: 1,
        limit: 100,
        protocol,
        anonymity
    };

    if (country) options.country = country;

    console.log('📋 Filter:');
    console.log(`   Country   : ${country || 'ANY'}`);
    console.log(`   Protocol  : ${protocol}`);
    console.log(`   Anonymity : ${anonymity}\n`);

    try {
        const data = await getProxyList(options);

        console.log('═══════════════════════════════════════');
        console.log('📦 RESULT');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Total    : ${data.total}`);
        console.log(`📄 Page     : ${data.page}`);
        console.log(`📦 Limit    : ${data.limit}`);
        console.log(`✅ Fetched  : ${data.data.length}\n`);

        const formatted = data.data.map(formatProxy);

        console.log('🔥 TOP 10 PROXY:');
        formatted.slice(0, 10).forEach((p, i) => {
            console.log(`\n   [${i + 1}] ${p.url}`);
            console.log(`       Country  : ${p.country} (${p.city})`);
            console.log(`       ISP      : ${p.isp}`);
            console.log(`       Anonymity: ${p.anonymity}`);
            console.log(`       Latency  : ${p.latency}ms`);
            console.log(`       UpTime   : ${p.upTime.toFixed(2)}%`);
            console.log(`       Google   : ${p.google ? 'YES' : 'NO'}`);
        });

        console.log('\n═══════════════════════════════════════');

        require('fs').writeFileSync(
            `proxies-${country || 'all'}-${protocol}.json`,
            JSON.stringify(formatted, null, 2)
        );
        console.log(`💾 Saved to proxies-${country || 'all'}-${protocol}.json`);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// ============================================
// EXPORT + RUN
// ============================================
module.exports = {
    getProxyList,
    formatProxy,
    filterElite,
    filterByCountry
};

if (require.main === module) {
    main();
}
[12/10 01.08] null: /**
SOUNDCLOUD SEARCH
TYPE: SCRAPE
BASE: module @zibot/scdl
AUTHOR: SWIPER FVCK
NOTE: INSTALL DULU MODULENYA (npm i @zibot/scdl)
**/

const SoundCloud = require("@zibot/scdl");
const sc = new SoundCloud({ init: true });

async function searchSoundCloud(query, options = {}) {
    const {
        limit = 20,
        offset = 0,
        type = "tracks"  // "all", "tracks", "playlists", "users"
    } = options;

    const results = await sc.search({
        query,
        limit,
        offset,
        type
    });

    return results;
}

function formatTrack(track) {
    return {
        id: track.id,
        title: track.title,
        url: track.permalink_url,
        duration: track.duration,
        genre: track.genre,
        createdAt: track.created_at,
        playCount: track.playback_count,
        likes: track.likes_count,
        reposts: track.reposts_count,
        downloadCount: track.download_count,
        downloadable: track.downloadable,
        streamable: track.streamable,
        artist: {
            id: track.user?.id,
            username: track.user?.username,
            name: track.user?.full_name,
            avatar: track.user?.avatar_url,
            verified: track.user?.verified,
            profileUrl: track.user?.permalink_url
        },
        artwork: track.artwork_url || track.user?.avatar_url
    };
}

// ============================================
// CLI
// ============================================
async function main() {
    const query = process.argv[2] || "lofi hip hop";
    const limit = parseInt(process.argv[3]) || 10;
    const type = process.argv[4] || "tracks";

    console.log("🚀 SoundCloud Search Scraper");
    console.log(`🔍 Query : ${query}`);
    console.log(`📦 Limit : ${limit}`);
    console.log(`🎯 Type  : ${type}\n`);

    try {
        const results = await searchSoundCloud(query, { limit, type });

        console.log("═══════════════════════════════════════");
        console.log(`📦 RESULTS (${results.length})`);
        console.log("═══════════════════════════════════════");

        results.forEach((item, i) => {
            if (type === "tracks") {
                const t = formatTrack(item);
                console.log(`\n[${i + 1}] ${t.title}`);
                console.log(`    Artist   : ${t.artist.name} (@${t.artist.username})`);
                console.log(`    Duration : ${Math.floor(t.duration / 1000 / 60)}:${String(Math.floor(t.duration / 1000) % 60).padStart(2, "0")}`);
                console.log(`    Plays    : ${t.playCount?.toLocaleString() || 0}`);
                console.log(`    Likes    : ${t.likes?.toLocaleString() || 0}`);
                console.log(`    Genre    : ${t.genre || "-"}`);
                console.log(`    URL      : ${t.url}`);
            } else {
                console.log(`\n[${i + 1}] ${JSON.stringify(item, null, 2)}`);
            }
        });

        console.log("\n═══════════════════════════════════════");

    } catch (err) {
        console.error("❌ Fatal:", err.message);
        process.exit(1);
    }
}

// ============================================
// EXPORT + RUN
// ============================================
module.exports = { searchSoundCloud, formatTrack };

if (require.main === module) {
    main();
}
[12/10 01.10] null: /**
SOUNDCLOUD DOWNLOADER
TYPE: SCRAPE
BASE: module @zibot/scdl
AUTHOR: SWIPER FVCK
NOTE: INSTALL DULU MODULENYA (npm i @zibot/scdl)
**/

const SoundCloud = require("@zibot/scdl");
const fs = require("node:fs");
const path = require("node:path");

const sc = new SoundCloud({ init: true });

async function downloadTrack(url, options = {}) {
    const {
        outputDir = "./downloads",
        quality = "high"  // "high" atau "low"
    } = options;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("📋 Mengambil detail track...");
    const track = await sc.getTrackDetails(url);

    const artist = track.user?.username || "unknown";
    const title = track.title || "untitled";

    const safeName = `${artist} - ${title}`
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);

    const outputPath = path.join(outputDir, `${safeName}.mp3`);

    console.log(`\n⬇️  Downloading:`);
    console.log(`    Title    : ${title}`);
    console.log(`    Artist   : ${artist}`);
    console.log(`    Duration : ${track.duration ? Math.floor(track.duration / 60000) + ":" + String(Math.floor(track.duration / 1000) % 60).padStart(2, "0") : "-"}`);
    console.log(`    Quality  : ${quality}`);
    console.log(`    Output   : ${outputPath}\n`);

    const stream = await sc.downloadTrack(url, { quality });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        let downloaded = 0;

        stream.on("data", (chunk) => {
            downloaded += chunk.length;
            process.stdout.write(`\r    📥 ${(downloaded / 1024 / 1024).toFixed(2)} MB`);
        });

        stream.pipe(writer);

        writer.on("finish", () => {
            const stats = fs.statSync(outputPath);
            process.stdout.write("\n");
            console.log(`    ✅ Selesai: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            resolve(outputPath);
        });

        writer.on("error", (err) => {
            process.stdout.write("\n");
            reject(err);
        });

        stream.on("error", (err) => {
            process.stdout.write("\n");
            reject(err);
        });
    });
}

// ============================================
// CLI
// ============================================
async function main() {
    const url = process.argv[2];
    const outputDir = process.argv[3] || "./downloads";
    const quality = process.argv[4] || "high";

    if (!url) {
        console.error("Usage: node download.js <url> [outputDir] [quality]");
        console.error('Example: node download.js "https://soundcloud.com/user/track" ./downloads high');
        console.error("");
        console.error("Quality options:");
        console.error("  high  - 128kbps+ (default)");
        console.error("  low   - 64kbps");
        process.exit(1);
    }

    console.log("🚀 SoundCloud Downloader\n");

    try {
        const output = await downloadTrack(url, { outputDir, quality });
        console.log(`\n📁 File tersimpan di: ${path.resolve(output)}`);

    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

// ============================================
// EXPORT + RUN
// ============================================
module.exports = { downloadTrack };

if (require.main === module) {
    main();
}
[12/10 23.41] null: /**
GITHUB SEARCH
TYPE: SCRAPE
BASE: https://github.com
AUTHOR: SWIPER FVCK
NOTE: BISA PAKE TOKEN BISA KOSONG
**/

const https = require('https');
const { URL } = require('url');

const CONFIG = {
  perPage: 30,          // max 100, tapi 30 lebih aman
  maxPages: 5,          // berapa halaman mau diambil
  minDelayMs: 1500,     // delay minimum antar request
  maxDelayMs: 4000,     // delay maksimum antar request
  maxRetries: 5,        // kalau kena 403/429, retry berapa kali
  baseBackoffMs: 2000,  // backoff awal
  token: process.env.GITHUB_TOKEN || null, // optional
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickUA = () =>
  CONFIG.userAgents[randInt(0, CONFIG.userAgents.length - 1)];

const log = (...args) => console.log('[scraper]', ...args);
const err = (...args) => console.error('[scraper:err]', ...args);

function requestJson(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = {
      method: 'GET',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': pickUA(),
        Accept: 'application/vnd.github+json',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-GitHub-Api-Version': '2022-11-28',
        Connection: 'keep-alive',
        ...(CONFIG.token ? { Authorization: `Bearer ${CONFIG.token}` } : {}),
        ...headers,
      },
      timeout: 20000,
    };

    const req = https.request(opts, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: raw,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('request timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchWithBackoff(urlStr, label = '') {
  let attempt = 0;

  while (attempt <= CONFIG.maxRetries) {
    attempt += 1;
    let res;

    try {
      res = await requestJson(urlStr);
    } catch (e) {
      err(`network fail attempt ${attempt} ${label}:`, e.message);
      await sleep(CONFIG.baseBackoffMs * attempt);
      continue;
    }

    const remaining = parseInt(res.headers['x-ratelimit-remaining'] || '0', 10);
    const resetSec = parseInt(res.headers['x-ratelimit-reset'] || '0', 10);
    const now = Math.floor(Date.now() / 1000);

    if (res.status === 200) {
      log(`ok ${label} | remaining=${remaining} resetIn=${Math.max(0, resetSec - now)}s`);
      return { json: JSON.parse(res.body), headers: res.headers };
    }

    if (res.status === 403 || res.status === 429) {
      let waitMs;

      if (resetSec > now) {
        waitMs = (resetSec - now + 2) * 1000;
      } else {
        waitMs = CONFIG.baseBackoffMs * Math.pow(2, attempt - 1) + randInt(0, 1000);
      }

      waitMs = Math.min(waitMs, 60_000);

      log(`rate-limited (${res.status}) ${label} | remaining=${remaining} | tunggu ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${CONFIG.maxRetries})`);
      await sleep(waitMs);
      continue;
    }

    if (res.status >= 500) {
      const waitMs = CONFIG.baseBackoffMs * attempt;
      log(`server err ${res.status} ${label} | tunggu ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    err(`fatal ${res.status} ${label}:`, res.body.slice(0, 200));
    return { json: null, headers: res.headers };
  }

  err(`nyerah setelah ${CONFIG.maxRetries} retry: ${label}`);
  return { json: null, headers: {} };
}

async function searchRepos(query, page = 1) {
  const q = encodeURIComponent(query);
  const url = `https://api.github.com/search/repositories?q=${q}&per_page=${CONFIG.perPage}&page=${page}&sort=stars&order=desc`;
  const { json } = await fetchWithBackoff(url, `search p${page} "${query}"`);
  if (!json || !json.items) return { items: [], total: 0 };
  return { items: json.items, total: json.total_count || 0 };
}

function printRepo(repo, idx) {
  const line = '─'.repeat(72);
  console.log(line);
  console.log(`#${idx}  ${repo.full_name}`);
  console.log(`    ⭐ ${repo.stargazers_count}  🍴 ${repo.forks_count}  👁 ${repo.watchers_count}`);
  console.log(`    lang: ${repo.language || '-'}  updated: ${repo.updated_at?.slice(0, 10)}`);
  console.log(`    url : ${repo.html_url}`);
  if (repo.description) {
    console.log(`    desc: ${repo.description.replace(/\s+/g, ' ').slice(0, 160)}`);
  }
  if (repo.topics && repo.topics.length) {
    console.log(`    tags: ${repo.topics.slice(0, 8).join(', ')}`);
  }
}

// ---------- main ----------
async function main() {
  const query = process.argv.slice(2).join(' ').trim();

  if (!query) {
    console.log('usage: node github-scraper.js "<query>"');
    process.exit(1);
  }

  console.log('='.repeat(72));
  console.log(`github search   : "${query}"`);
  console.log(`token           : ${CONFIG.token ? 'yes' : 'no (anonymous, 10 req/min)'}`);
  console.log(`pages to fetch  : ${CONFIG.maxPages}`);
  console.log('='.repeat(72));

  let counter = 0;

  for (let page = 1; page <= CONFIG.maxPages; page++) {
    log(`fetch page ${page}/${CONFIG.maxPages} ...`);

    let result;
    try {
      result = await searchRepos(query, page);
    } catch (e) {
      err(`page ${page} gagal total:`, e.message);
      break;
    }

    if (!result.items.length) {
      log(`page ${page} kosong, stop.`);
      break;
    }

    console.log('');
    console.log(`>> page ${page}  (total results: ${result.total})`);

    for (const repo of result.items) {
      counter += 1;
      printRepo(repo, counter);
    }

    if (page < CONFIG.maxPages) {
      const wait = randInt(CONFIG.minDelayMs, CONFIG.maxDelayMs);
      log(`jeda ${wait}ms sebelum page berikutnya ...`);
      await sleep(wait);
    }
  }
}

main().catch((e) => {
  err('fatal:', e);
  process.exit(1);
});
[12/10 23.56] null: /**
GITHUB DOWNLOADER
TYPE: SCRAPE
BASE: https://github.com
AUTHOR: SWIPER FVCK
NOTE: BISA PAKE TOKEN ATAU ENGGA
Support jenis
owner/repo
owner/repo@ref
https://github.com/owner/repo
https://github.com/owner/repo.git
https://github.com/owner/repo/tree/ref
**/

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const CONFIG = {
  outDir: path.resolve(process.cwd(), 'downloads'),
  defaultRef: 'HEAD',           // HEAD | main | master | tag | commit sha
  format: 'zip',                // 'zip' | 'tar.gz'
  minDelayMs: 1500,
  maxDelayMs: 3500,
  maxRetries: 5,
  baseBackoffMs: 2000,
  chunkTimeoutMs: 30000,        // kalau gak ada data selama ini, anggap stuck
  token: process.env.GITHUB_TOKEN || null,   // optional, codeload gak butuh tapi bisa dipake buat api
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickUA = () => CONFIG.userAgents[randInt(0, CONFIG.userAgents.length - 1)];
const log = (...a) => console.log('[dl]', ...a);
const warn = (...a) => console.warn('[dl:warn]', ...a);
const err = (...a) => console.error('[dl:err]', ...a);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function humanBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)}MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

function parseRepoSpec(spec) {
  let s = spec.trim();
  s = s.replace(/\.git$/, '');

  if (s.startsWith('http')) {
    const u = new URL(s);
    const parts = u.pathname.split('/').filter(Boolean);
    const owner = parts[0];
    const repo = parts[1];
    let ref = CONFIG.defaultRef;
    const treeIdx = parts.indexOf('tree');
    if (treeIdx !== -1 && parts[treeIdx + 1]) ref = parts.slice(treeIdx + 1).join('/');
    return { owner, repo, ref };
  }

  const [repoPart, refPart] = s.split('@');
  const [owner, repo] = repoPart.split('/');
  return { owner, repo, ref: refPart || CONFIG.defaultRef };
}

function buildUrl(owner, repo, ref, format) {
  if (format === 'tar.gz') {
    return `https://codeload.github.com/${owner}/${repo}/tar.gz/refs/heads/${ref}`;
  }
  return `https://codeload.github.com/${owner}/${repo}/zip/${ref}`;
}

function makeProgressBar(total, label) {
  let lastLen = 0;
  const started = Date.now();
  let lastBytes = 0;
  let lastTime = started;

  return {
    update(received) {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      if (dt >= 0.5) {
        const speed = (received - lastBytes) / dt;
        lastBytes = received;
        lastTime = now;

        const pct = total ? ((received / total) * 100).toFixed(1) : '??';
        const barLen = 24;
        const filled = total
          ? Math.round((received / total) * barLen)
          : 0;
        const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

        const line = `  ${label} [${bar}] ${pct}%  ${humanBytes(received)}${total ? '/' + humanBytes(total) : ''}  ${humanBytes(speed)}/s`;
        process.stdout.write('\r' + line + ' '.repeat(Math.max(0, lastLen - line.length)));
        lastLen = line.length;
      }
    },
    done() {
      process.stdout.write('\r' + ' '.repeat(lastLen) + '\r');
    },
  };
}

function downloadOnce(urlStr, destPath, label) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const tmpPath = destPath + '.part';
    let received = 0;
    let total = 0;

    let startByte = 0;
    if (fs.existsSync(tmpPath)) {
      startByte = fs.statSync(tmpPath).size;
      if (startByte > 0) log(`resume dari ${humanBytes(startByte)}: ${label}`);
    }

    const headers = {
      'User-Agent': pickUA(),
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    };
    if (startByte > 0) headers['Range'] = `bytes=${startByte}-`;
    if (CONFIG.token) headers.Authorization = `Bearer ${CONFIG.token}`;

    const opts = {
      method: 'GET',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers,
      timeout: CONFIG.chunkTimeoutMs,
    };

    const req = https.request(opts, (res) => {
      if (res.statusCode === 416) {
        try { fs.unlinkSync(tmpPath); } catch {}
        req.destroy();
        return resolve({ ok: false, reason: 'range-invalid' });
      }

      if (res.statusCode !== 200 && res.statusCode !== 206) {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          req.destroy();
          resolve({
            ok: false,
            reason: `status ${res.statusCode}`,
            body: raw.slice(0, 200),
            headers: res.headers,
          });
        });
        return;
      }

      const cr = res.headers['content-range'];
      if (cr) {
        const m = cr.match(/\/(\d+)$/);
        if (m) total = parseInt(m[1], 10);
      } else if (res.headers['content-length']) {
        total = parseInt(res.headers['content-length'], 10) + startByte;
      }

      const flags = startByte > 0 ? 'a' : 'w';
      const ws = fs.createWriteStream(tmpPath, { flags });
      const bar = makeProgressBar(total, label);

      res.on('data', (chunk) => {
        received += chunk.length;
        bar.update(received + startByte);
      });

      res.pipe(ws);

      ws.on('finish', () => {
        bar.done();
        try {
          fs.renameSync(tmpPath, destPath);
        } catch (e) {
          return resolve({ ok: false, reason: 'rename: ' + e.message });
        }
        resolve({ ok: true, totalBytes: received + startByte });
      });

      ws.on('error', (e) => {
        bar.done();
        resolve({ ok: false, reason: 'write: ' + e.message });
      });

      res.on('aborted', () => {
        bar.done();
        resolve({ ok: false, reason: 'aborted (partial saved)' });
      });
    });

    req.on('timeout', () => {
      warn(`timeout ${label}, abort`);
      req.destroy(new Error('timeout'));
    });

    req.on('error', (e) => {
      resolve({ ok: false, reason: 'net: ' + e.message });
    });

    req.end();
  });
}

async function downloadWithRetry(urlStr, destPath, label) {
  let attempt = 0;
  while (attempt <= CONFIG.maxRetries) {
    attempt += 1;
    const res = await downloadOnce(urlStr, destPath, label);

    if (res.ok) {
      log(`selesai ${label} (${humanBytes(res.totalBytes)})`);
      return true;
    }

    warn(`gagal attempt ${attempt}/${CONFIG.maxRetries} ${label}: ${res.reason}`);

    if (res.reason && /status (403|404)/.test(res.reason)) {
      err(`permanen ${label}: ${res.reason} ${res.body || ''}`);
      return false;
    }

    const wait = CONFIG.baseBackoffMs * Math.pow(2, attempt - 1) + randInt(0, 1000);
    log(`tunggu ${Math.round(wait / 1000)}s lalu retry ...`);
    await sleep(wait);
  }
  err(`nyerah ${label} setelah ${CONFIG.maxRetries} retry`);
  return false;
}

// ---------- main ----------
async function main() {
  const args = process.argv.slice(2);

  if (!args.length) {
    console.log('usage:');
    console.log('  node github-downloader.js owner/repo');
    console.log('  node github-downloader.js owner/repo@main');
    console.log('  node github-downloader.js https://github.com/owner/repo');
    console.log('  node github-downloader.js --file repos.txt');
    console.log('  node github-downloader.js --format tar.gz owner/repo');
    console.log('  node github-downloader.js --out ./mydir owner/repo');
    console.log('');
    console.log('flags:');
    console.log('  --file <path>       batch list, satu repo per baris (# komentar ok)');
    console.log('  --format zip|tar.gz default zip');
    console.log('  --out <dir>         default ./downloads');
    console.log('  --ref <ref>         default HEAD');
    process.exit(1);
  }

  let repos = [];
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '--file') {
      const p = args[++i];
      if (!p || !fs.existsSync(p)) {
        err(`file gak ketemu: ${p}`);
        process.exit(1);
      }
      const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        repos.push(t);
      }
    } else if (a === '--format') {
      CONFIG.format = args[++i] === 'tar.gz' ? 'tar.gz' : 'zip';
    } else if (a === '--out') {
      CONFIG.outDir = path.resolve(process.cwd(), args[++i]);
    } else if (a === '--ref') {
      CONFIG.defaultRef = args[++i];
    } else {
      repos.push(a);
    }
    i++;
  }

  if (!repos.length) {
    err('gak ada repo yang mau di-download.');
    process.exit(1);
  }

  ensureDir(CONFIG.outDir);

  console.log('='.repeat(72));
  console.log(`out dir   : ${CONFIG.outDir}`);
  console.log(`format    : ${CONFIG.format}`);
  console.log(`ref       : ${CONFIG.defaultRef}`);
  console.log(`token     : ${CONFIG.token ? 'yes' : 'no'}`);
  console.log(`repos     : ${repos.length}`);
  console.log('='.repeat(72));

  let okCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < repos.length; idx++) {
    const spec = repos[idx];
    console.log('');
    console.log(`[${idx + 1}/${repos.length}] ${spec}`);

    let parsed;
    try {
      parsed = parseRepoSpec(spec);
    } catch (e) {
      err(`spec invalid: ${spec} (${e.message})`);
      failCount += 1;
      continue;
    }

    const { owner, repo, ref } = parsed;
    if (!owner || !repo) {
      err(`spec invalid: ${spec}`);
      failCount += 1;
      continue;
    }

    const url = buildUrl(owner, repo, ref, CONFIG.format);
    const ext = CONFIG.format === 'tar.gz' ? 'tar.gz' : 'zip';
    const safeRef = ref.replace(/[\/\\:]/g, '_');
    const filename = `${owner}-${repo}-${safeRef}.${ext}`;
    const destPath = path.join(CONFIG.outDir, filename);

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      log(`skip (udah ada): ${filename}`);
      okCount += 1;
      continue;
    }

    log(`url  : ${url}`);
    log(`dest : ${filename}`);

    const ok = await downloadWithRetry(url, destPath, filename);
    if (ok) okCount += 1;
    else failCount += 1;

    if (idx < repos.length - 1) {
      const wait = randInt(CONFIG.minDelayMs, CONFIG.maxDelayMs);
      log(`jeda ${wait}ms sebelum repo berikutnya ...`);
      await sleep(wait);
    }
  }
}

main().catch((e) => {
  err('fatal:', e);
  process.exit(1);
});

Title : **INSTAGRAM DOWNLOADER**

 *Description* : 
_Instagram Downloader video! cukup salin link dari reel yang kalian temukan di Instagram, lalu kalian eksekusi menggunakan scrape yang sudah saya buat ini, jika ada keluhan dan pertanyaan silahkan hubungi : putramodss@gmail.com_

Scrape Code :
/**
/** Created By PutraMods 😹🤝
/** Base: https://Instagram.com
/**
*/

import axios from "axios";
import * as cheerio from "cheerio";

const CREATOR = "© PutraMods Officiall 😜";
export async function igScrape(link) {
    if (!link) throw new Error("Link Instagram wajib diisi.");
    if (!/instagram\.com/i.test(link)) {
        throw new Error("Link Instagram tidak valid.");
        }
    const match = link.match(
        /(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/
    );  if (!match?.[1]) {
        throw new Error("Format URL Instagram tidak valid.");
    }
    const shortcode = match[1];
    const embedUrl =
        `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
        
    const response = await axios.get(embedUrl, {
        timeout: 30000,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept":
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Referer": "https://www.instagram.com/"
        },
        validateStatus: () => true
    });
    if (response.status !== 200) {
        throw new Error(
            `Instagram gagal diakses\nStatus: ${response.status}`
        );
    }
    const html = response.data;
    let mediaUrl = "";
    let type = "";
    const videoMatch =
        html.match(/\\?"video_url\\?":\s*\\?"([^"]+)\\?"/) ||
        html.match(/"video_url":"([^"]+)"/);
        
    if (videoMatch?.[1]) {
        mediaUrl = videoMatch[1]
            .replace(/\\/g, "")
            .replace(/u0026/g, "&");

        type = "video";
    }

    if (!mediaUrl) {
        const imageMatch =
            html.match(
                /\\?"display_url\\?":\s*\\?"([^"]+)\\?"/
            ) ||
            html.match(/"display_url":"([^"]+)"/);
        if (imageMatch?.[1]) {
            mediaUrl = imageMatch[1]
                .replace(/\\u0026/g, "&")
                .replace(/\\/g, "");

            type = "image";
        }
    }

    if (!mediaUrl) {
        const $ = cheerio.load(html);
        const video = $("video").first();
        if (video.attr("src")) {
            mediaUrl = video.attr("src");
            type = "video";
        }
    }

    if (!mediaUrl) {
        const $ = cheerio.load(html);

        const image =
            $("img.EmbeddedMediaImage").first().attr("src") ||
            $('meta[property="og:image"]').attr("content");

        if (image) {
            mediaUrl = image;
            type = "image";
        }
    }

    if (!mediaUrl) {
        throw new Error(
            "Gagal mengambil media. Postingan mungkin privat atau dibatasi."
        );
    }

    return {
        success: true,
        creator: CREATOR,
        data: {
            shortcode,
            type,
            url: mediaUrl
        }
    };
}

export default igScrape;


/*
* Created By PutraMods Offciall 😹
* Support by Vyn Group
**/

import i from "axios";

const e = new Map,
    a = new Map,
    s = async (n, t) => {
        try {
            return (await i.post(n, t, {
                headers: {
                    "content-type": "application/json"
                },
                timeout: 15e3
            })).data;
        } catch (i) {
            return null;
        }
    },
    f = n => {
        const t = Math.floor((Date.now() - n) / 1000);
        return t < 60 ? `${t}s` : `${Math.floor(t / 60)}m ${t % 60}s`;
    };

export default {
    run: async (i, t) => {
        const r = String(i.command || "").toLowerCase(),
            m = String(i.text || "").trim(),
            l = i.sender || i.chat || i.from;

        try {
            if ("am2" === r || "ampremium2" === r) {
                if (!m)
                    return i.reply(
                        "╭─「 ALIGHT MOTION 2 」\n│\n│ ✗ Email wajib diisi.\n│\n│ Contoh:\n│ .am2 user@gmail.com\n│\n╰────────────\n© Vyn Group"
                    );

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m))
                    return i.reply("✗ Format email tidak valid.\n\n© Vyn Group");

                const n = m.toLowerCase();

                if ("active" === a.get(n))
                    return i.reply(
                        `╭─「 ALIGHT MOTION 2 」\n│\n│ ⚠️ EMAIL SUDAH PREMIUM\n│\n│ 📧 Email : ${m}\n│ 💎 Status : Active\n│\n│ Double verify dibatalkan.\n│\n╰────────────\n© Vyn Group`
                    );

                if ("processing" === a.get(n) || "verifying" === a.get(n))
                    return i.reply(
                        `╭─「 ALIGHT MOTION 2 」\n│\n│ ⏳ Email sedang diproses.\n│\n│ 📧 Email : ${m}\n│\n│ Tunggu proses sebelumnya selesai.\n│\n╰────────────\n© Vyn Group`
                    );

                e.set(l, n);
                a.set(n, "processing");

                const t = Date.now();

                await i.reply(
                    `╭─「 ALIGHT MOTION 2 」\n│\n│ ✦ Mengirim magic link...\n│\n│ 📧 Email : ${m}\n│ ⏳ Status : Processing\n│\n╰────────────\n© Vyn Group`
                );

                const r = await s(
                    "https://am.zervida.my.id/api/amprem/link",
                    { email: m }
                );

                const o = f(t);

                if (!r || r.status === false) {
                    a.delete(n);
                    e.delete(l);

                    return i.reply(
                        `╭─「 ALIGHT MOTION 2 」\n│\n│ ✗ Gagal mengirim magic link.\n│\n│ 📧 Email : ${m}\n│ ⏱️ Waktu : ${o}\n│\n╰────────────\n© Vyn Group`
                    );
                }

                return i.reply(
                    `╭─「 ALIGHT MOTION 2 」\n│\n│ ✓ Magic link berhasil dikirim.\n│\n│ 📧 Email : ${m}\n│ ⏱️ Waktu : ${o}\n│\n│ Cek Inbox / Spam Gmail.\n│\n│ Setelah mendapatkan raw link:\n│ .amverify2 <raw_link>\n│\n╰────────────\n© Vyn Group`
                );
            }

            if ("amverify2" === r) {
                const t = m.trim();

                if (!/^https?:\/\//i.test(t))
                    return i.reply(
                        "╭─「 ALIGHT MOTION 2 」\n│\n│ ✗ Link tidak valid.\n│\n│ Masukkan raw link dari email.\n│\n╰────────────\n© Vyn Group"
                    );

                const r = e.get(l);

                if (!r)
                    return i.reply(
                        "╭─「 ALIGHT MOTION 2 」\n│\n│ ✗ Email tidak ditemukan.\n│\n│ Silakan jalankan:\n│ .am2 email@gmail.com\n│\n╰────────────\n© Vyn Group"
                    );

                if ("active" === a.get(r))
                    return i.reply(
                        `╭─「 ALIGHT MOTION 2 」\n│\n│ ⚠️ EMAIL SUDAH PREMIUM\n│\n│ 📧 Email : ${r}\n│ 💎 Status : Active\n│\n│ Double verify dibatalkan.\n│\n╰────────────\n© Vyn Group`
                    );

                if ("verifying" === a.get(r))
                    return i.reply(
                        `╭─「 ALIGHT MOTION 2 」\n│\n│ ⏳ Email sedang diverifikasi.\n│\n│ 📧 Email : ${r}\n│\n│ Jangan menjalankan verify dua kali.\n│\n╰────────────\n© Vyn Group`
                    );

                a.set(r, "verifying");

                const n = Date.now();

                await i.reply(
                    `╭─「 ALIGHT MOTION 2 」\n│\n│ ✦ Memproses verifikasi...\n│\n│ 📧 Email : ${r}\n│ ⏳ Status : Processing\n│\n╰────────────\n© Vyn Group`
                );

                const result = await s(
                    "https://am.zervida.my.id/api/amprem/claim",
                    {
                        email: r,
                        link: t
                    }
                );

                const o = f(n);

                if (!result || result.status === false) {
                    a.set(r, "processing");

                    return i.reply(
                        `╭─「 ALIGHT MOTION 2 」\n│\n│ ✗ Verifikasi gagal.\n│\n│ 📧 Email : ${r}\n│ ⏱️ Waktu proses: ${o}\n│\n│ Link mungkin sudah expired\n│ atau sudah digunakan.\n│\n╰────────────\n© Vyn Group`
                    );
                }

                a.set(r, "active");
                e.delete(l);

                return i.reply(
                    `╭─「 ALIGHT MOTION 2 」\n│\n│ ✓ VERIFIKASI BERHASIL\n│\n│ 📧 Email : ${r}\n│ 💎 Premium : Active\n│ ⏳ Duration : 1 Tahun\n│ ⏱️ Waktu proses : ${o}\n│\n│ ✓ Double verify protection aktif.\n│\n╰────────────\n© Vyn Group`
                );
            }
        } catch (n) {
            console.error("[ALIGHT MOTION 2 ERROR]", n);

            return i.reply(
                `╭─「 ALIGHT MOTION 2 ERROR 」\n│\n│ ✗ ${n.message}\n│\n╰────────────\n© Vyn Group`
            );
        }
    },

    cmd: ["am2", "ampremium2", "amverify2"],
    use: "am2 <email> | amverify2 <raw_link>",
    type: "developer",
    premium: !0,
    location: "plugins/developer/alightmotion2.js"
};

/**
 * Created By PutraMods 😜
 */

import crypto from "crypto";

const SECRET_HEX =
    "C5D58EF67A7584E4A29F6C35BBC4EB12";

const RANDOM_CDN =
    "https://media.savetube.vip/api/random-cdn";

const FALLBACK_CDN = [
    "cdn401.savetube.vip",
    "cdn406.savetube.vip",
];

const HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    "User-Agent":
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
};

const proses = new Set();

const sleep = ms =>
    new Promise(resolve =>
        setTimeout(resolve, ms)
    );

function extractId(url) {
    const m = String(url).match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/
    );

    if (!m) {
        throw new Error(
            "Link YouTube tidak valid."
        );
    }

    return m[1];
}

function decrypt(b64) {
    const buf = Buffer.from(
        b64,
        "base64"
    );

    const iv = buf.subarray(0, 16);
    const enc = buf.subarray(16);

    const decipher =
        crypto.createDecipheriv(
            "aes-128-cbc",
            Buffer.from(
                SECRET_HEX,
                "hex"
            ),
            iv
        );

    const out = Buffer.concat([
        decipher.update(enc),
        decipher.final(),
    ]);

    return JSON.parse(
        out.toString("utf8")
    );
}

async function request(
    url,
    {
        method = "GET",
        body,
        timeout = 30000,
    } = {}
) {
    const ctrl =
        new AbortController();

    const timer = setTimeout(
        () => ctrl.abort(),
        timeout
    );

    try {
        const res = await fetch(url, {
            method,
            headers: HEADERS,
            body: body
                ? JSON.stringify(body)
                : undefined,
            signal: ctrl.signal,
        });

        const text = await res.text();

        let json;

        try {
            json = JSON.parse(text);
        } catch {
            json = null;
        }

        if (!res.ok) {
            throw new Error(
                `HTTP ${res.status}`
            );
        }

        if (!json) {
            throw new Error(
                "Response bukan JSON."
            );
        }

        return json;
    } finally {
        clearTimeout(timer);
    }
}

async function retry(
    fn,
    times = 3,
    delay = 1500
) {
    let error;

    for (
        let i = 0;
        i < times;
        i++
    ) {
        try {
            return await fn(i);
        } catch (e) {
            error = e;

            if (
                i <
                times - 1
            ) {
                await sleep(delay);
            }
        }
    }

    throw error;
}

async function getCdn() {
    try {
        const result =
            await request(
                RANDOM_CDN,
                {
                    timeout: 10000,
                }
            );

        if (result?.cdn) {
            return result.cdn;
        }
    } catch {}

    return FALLBACK_CDN[
        Math.floor(
            Math.random() *
                FALLBACK_CDN.length
        )
    ];
}

function formatDuration(sec) {
    sec = Number(sec);

    if (!sec) return "-";

    const h = Math.floor(
        sec / 3600
    );

    const m = Math.floor(
        (sec % 3600) / 60
    );

    const s = sec % 60;

    return (
        h
            ? h +
              ":" +
              String(m).padStart(
                  2,
                  "0"
              )
            : m
    ) +
        ":" +
        String(s).padStart(
            2,
            "0"
        );
}

function pickQuality(
    available,
    wanted
) {
    const list = (
        available || []
    )
        .map(f =>
            Number(
                typeof f === "object"
                    ? f.quality
                    : f
            )
        )
        .filter(Boolean);

    if (!list.length) {
        return Number(wanted);
    }

    if (
        list.includes(
            Number(wanted)
        )
    ) {
        return Number(wanted);
    }

    return list.sort(
        (a, b) =>
            Math.abs(
                a - wanted
            ) -
            Math.abs(
                b - wanted
            )
    )[0];
}

async function getInfo(url) {
    const id =
        extractId(url);

    const cleanUrl =
        `https://youtu.be/${id}`;

    return retry(async () => {
        const cdn =
            await getCdn();

        const result =
            await request(
                `https://${cdn}/v2/info`,
                {
                    method: "POST",
                    body: {
                        url: cleanUrl,
                    },
                }
            );

        if (
            !result?.status ||
            !result?.data
        ) {
            throw new Error(
                "Gagal mengambil informasi YouTube."
            );
        }

        const info =
            decrypt(result.data);

        if (!info?.key) {
            throw new Error(
                "Key download tidak ditemukan."
            );
        }

        return {
            cdn,
            id,
            info,
        };
    });
}

async function requestDownload(
    cdn,
    key,
    type,
    quality
) {
    return retry(
        async () => {
            const result =
                await request(
                    `https://${cdn}/download`,
                    {
                        method: "POST",
                        body: {
                            downloadType:
                                type,
                            quality:
                                String(
                                    quality
                                ),
                            key,
                        },
                    }
                );

            if (
                !result?.status ||
                !result?.data
                    ?.downloadUrl
            ) {
                throw new Error(
                    "Gagal mendapatkan URL download."
                );
            }

            return result.data
                .downloadUrl;
        },
        3,
        2500
    );
}

async function savetube(
    url,
    format = "mp3"
) {
    format = String(
        format
    ).toLowerCase();

    if (
        !["mp3", "mp4"].includes(
            format
        )
    ) {
        throw new Error(
            "Format tidak valid."
        );
    }

    const {
        cdn,
        id,
        info,
    } = await getInfo(url);

    const isAudio =
        format === "mp3";

    const wanted =
        isAudio ? 128 : 720;

    const quality = isAudio
        ? wanted
        : pickQuality(
              info.video_formats,
              wanted
          ) || wanted;

    const downloadUrl =
        await requestDownload(
            cdn,
            info.key,
            isAudio
                ? "audio"
                : "video",
            quality
        );

    return {
        status: true,
        id,

        title:
            info.title ||
            "YouTube",

        duration:
            info.durationLabel ||
            formatDuration(
                info.duration
            ),

        thumbnail:
            info.thumbnail ||
            `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,

        uploader:
            info.uploader ||
            info.author ||
            info.channel ||
            info.owner ||
            "-",

        channel:
            info.channel ||
            info.uploader ||
            info.author ||
            "-",

        views:
            info.views ||
            info.viewCount ||
            "-",

        type: isAudio
            ? "audio"
            : "video",

        format,

        quality,

        downloadUrl,
    };
}

async function prosesDownload(
    e,
    a,
    q,
    format
) {
    const text =
        e.text?.trim() || "";

    const match =
        text.match(
            /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]{11}[^\s]*/i
        );

    if (!match) {
        return e.reply(
            `❌ Link YouTube tidak ditemukan.\n\n` +
                `Contoh:\n` +
                `.${format} https://youtu.be/xxxxxxxxxxx`
        );
    }

    const url =
        match[0].replace(
            /[)>]+$/,
            ""
        );

    const key =
        `${format}-${e.sender}`;

    if (proses.has(key)) {
        return e.reply(
            "✦ Masih ada proses download yang berjalan."
        );
    }

    proses.add(key);

    await a.sendReact(
        e.chat,
        "🕒",
        e.key
    );

    try {
        const result =
            await savetube(
                url,
                format
            );

        const caption =
            `╭─〔 *YOUTUBE DOWNLOADER* 〕─╮\n` +
            `│\n` +
            `│ 🎬 *Judul:* ${result.title}\n` +
            `│ 👤 *Pembuat:* ${result.uploader}\n` +
            `│ 📺 *Channel:* ${result.channel}\n` +
            `│ ⏱️ *Durasi:* ${result.duration}\n` +
            `│ 👁️ *Views:* ${result.views}\n` +
            `│ 🎧 *Format:* ${result.format.toUpperCase()}\n` +
            `│ 📦 *Kualitas:* ${result.quality}${format === "mp3" ? " kbps" : "p"}\n` +
            `│\n` +
            `╰────────────────────────╯\n\n` +
            `⏳ *Mengirim hasil...*`;

        await a.sendMessage(
            e.chat,
            {
                image: {
                    url: result.thumbnail,
                },
                caption,
            },
            {
                quoted: q || e,
            }
        );

        if (
            result.format ===
            "mp3"
        ) {
            await a.sendMessage(
                e.chat,
                {
                    audio: {
                        url: result.downloadUrl,
                    },
                    mimetype:
                        "audio/mpeg",
                    fileName:
                        `${result.title}.mp3`,
                },
                {
                    quoted: q || e,
                }
            );
        } else {
            await a.sendMessage(
                e.chat,
                {
                    video: {
                        url: result.downloadUrl,
                    },
                    mimetype:
                        "video/mp4",
                    fileName:
                        `${result.title}.mp4`,
                    caption:
                        `🎬 *${result.title}*\n` +
                        `📦 *720p*`,
                },
                {
                    quoted: q || e,
                }
            );
        }

        await a.sendReact(
            e.chat,
            "✅",
            e.key
        );
    } catch (error) {
        await a.sendReact(
            e.chat,
            "❌",
            e.key
        );

        return e.reply(
            `❌ *Gagal Download YouTube*\n\n` +
                `${error?.message || error}`
        );
    } finally {
        proses.delete(key);
    }
}

export default {
    run: async (
        e,
        a,
        {
            quoted: q,
        } = {}
    ) => {
        const text =
            e.text?.trim() || "";

        if (!text) {
            return e.reply(
                `╭─〔 *YOUTUBE DOWNLOADER* 〕─╮\n` +
                    `│\n` +
                    `│ 🎵 *MP3*\n` +
                    `│ .ythmp3 <link>\n` +
                    `│\n` +
                    `│ 🎬 *MP4*\n` +
                    `│ .ythmp4 <link>\n` +
                    `│\n` +
                    `│ MP4 otomatis 720p.\n` +
                    `│ MP3 otomatis 128kbps.\n` +
                    `│\n` +
                    `╰────────────────────────╯`
            );
        }

        const command =
            String(
                e.command ||
                    e.cmd ||
                    ""
            ).toLowerCase();

        let format = "mp3";

        if (
            command ===
                "ythmp4" ||
            /^ythmp4\b/i.test(
                text
            )
        ) {
            format = "mp4";
        }

        if (
            command ===
                "ythmp3" ||
            /^ythmp3\b/i.test(
                text
            )
        ) {
            format = "mp3";
        }

        return prosesDownload(
            e,
            a,
            q,
            format
        );
    },

    cmd: "ythmp3",

    alias: [
        "ythmp4",
    ],

    use:
        "<link>",

    type:
        "downloader",

    restrict: true,

    limit: 3,

    location:
        "plugins/downloader/youtubeh.js",
};

# Tiktok Downloader
import{proto as t}from"@whiskeysockets/baileys";const e=/tiktok\.com\/(?:@[\w.-]+\/video\/\d+|t\/\w+)|v[mt]\.tiktok\.com\/\w+/i;function i({title:e="Tzyh",author:i="Jooo"}={}){return[t.InteractiveAnnotation.fromObject({embeddedContent:{embeddedMusic:{musicContentMediaId:"999999999999999",songId:"999999999999999",title:e,author:i,artistAttribution:i,isExplicit:!1}},embeddedAction:!0,shouldSkipConfirmation:!0,polygonVertices:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]})]}export default{run:async(t,a,{cfg:n,func:o,quoted:s})=>{let l=s?.text||null;if(!l)return t.reply(o.example(t.cmd,"https://vt.tiktok.com/ZSF4cWcA2/"));if(!l.includes("tiktok.com"))return t.reply("✗ Link TikTok tidak valid.");const r=(l.match(/(https?:\/\/(?:www\.|(?!www))[^\s.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi)||[]).filter(t=>e.test(t)).map(t=>t.match(/(tiktok.com\/t\/)/g)?"https://vm.tiktok.com/"+t.split("/t/")[1]:t),d=[...new Set(r)];if(d.length<1)return t.reply("✗ Link video TikTok tidak ditemukan pada teks tersebut.");a.sendReact(t.chat,"🕒",t.key);for(let e=0;e<d.length;e++){let n=d[e];try{let s=await fetch("https://aji-coder.vercel.app/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:n})}),l=await s.json();if(!l.status){await t.reply(`✗ Gagal memproses link ke-${e+1}. Mungkin API sedang down atau link tidak valid/private.`);continue}const r=`*TIKTOK DOWNLOADER ${d.length>1?`(${e+1}/${d.length})`:""}*\n\n- Author: *${l.author||"-"}*\n- Deskripsi: ${l.title||"-"}`;let m=t;if(l.images&&l.images.length>0){m=await t.reply(r+`\n\n_Mengirim ${l.images.length} gambar & audio..._`);for(const e of l.images)await a.sendMedia(t.chat,e,null,{expiration:t.expiration}),await o.delay(1e3)}else if(l.nowm){const e=i({title:"Tzyh",author:"Jooo"});m=await a.sendMessage(t.chat,{video:{url:l.nowm},caption:r+"\n\n_Mengirim audio..._",mimetype:"video/mp4",annotations:e,interactiveAnnotations:e},{quoted:t,ephemeralExpiration:t.expiration})}l.music&&""!==l.music&&(await o.delay(1e3),await a.sendMessage(t.chat,{audio:{url:l.music},mimetype:"audio/mpeg",fileName:"tiktok_audio.mp3"},{quoted:m,ephemeralExpiration:t.expiration})),global.db.users[t.sender].limit-=5}catch(a){await t.reply(`Terjadi kesalahan pada link ke-${e+1}:\n${a.message}\n\ncoba gunakan ${t.prefix}tiktok2 sebagai gantinya`)}d.length>1&&await o.delay(2e3)}},cmd:"tiktok",alias:"tt",use:"link tiktok",type:"downloader",limit:!0,location:"plugins/downloader/tiktok.js"};