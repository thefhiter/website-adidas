/* Adidas Store — pure Node.js (no npm deps needed) */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT   = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const ROOT   = __dirname;

/* ═══════════════════════════════════════════
   PRODUCT DATABASE (30 products)
   Each product conforms to SPEC §2 (data model):
   id, name, category, sub, price, originalPrice|null, colors, sizes,
   stock{size:count}, rating, reviewCount, isNew, tag, description,
   details[4-6], material, body, bodyL, stripe, collar, glow, vap[r,g,b]
═══════════════════════════════════════════ */

/* helper to build a per-size stock object from a sizes array + count list */
function stockOf(sizes, counts) {
  const o = {};
  sizes.forEach((s, i) => { o[s] = counts[i] !== undefined ? counts[i] : 0; });
  return o;
}

const PRODUCTS = [
  /* ════════ ORIGINALS — SHOES (real photos) ════════ */
  { id:'samba-og', name:'Samba OG', category:'originals', sub:'shoes', price:100, originalPrice:null,
    image:'/images/samba.jpg',
    colors:['#1b1b1b','#0a5c2a','#f5f0e6'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[6,12,20,24,18,10,4]),
    rating:4.8, reviewCount:412, isNew:false, tag:'Bestseller',
    description:'Born on the pitch, adopted by the streets. The Samba OG pairs a soft leather upper with a gum sole and timeless T-toe styling.',
    details:['Soft full-grain leather upper','Suede T-toe overlay','Gum rubber outsole','Signature 3-Stripes','Iconic since 1950'],
    material:'Leather and suede upper, gum rubber outsole',
    body:'#1b1b1b', bodyL:'#2a2a2a', stripe:'#f5f0e6', collar:'#0a5c2a', glow:'#0a7a38', vap:[20,150,70] },

  { id:'superstar', name:'Superstar', category:'originals', sub:'shoes', price:100, originalPrice:null,
    image:'/images/superstar.jpg',
    colors:['#f5f5f5','#111111'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[8,14,18,16,12,7,3]),
    rating:4.7, reviewCount:388, isNew:false, tag:'Icon',
    description:'The shell toe that defined a culture. Since 1969 the Superstar has moved from hardwood courts to the heart of street style.',
    details:['Smooth leather upper','Iconic rubber shell toe','Serrated 3-Stripes','Herringbone-pattern outsole','Superstar heel patch'],
    material:'Leather upper, rubber cupsole',
    body:'#e9e9e9', bodyL:'#ffffff', stripe:'#111111', collar:'#cccccc', glow:'#888888', vap:[180,180,180] },

  { id:'campus-00s', name:'Campus 00s', category:'originals', sub:'shoes', price:110, originalPrice:null,
    image:'/images/campus.jpg',
    colors:['#6a4a8a','#1b1b1b','#0a5c2a'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[5,11,16,15,10,6,2]),
    rating:4.6, reviewCount:210, isNew:true, tag:'New',
    description:'A Y2K reissue with chunky energy. Plush suede, a bold midsole and unmistakable Campus DNA.',
    details:['Premium suede upper','Oversized 00s proportions','Padded collar and tongue','Rubber cupsole','Tonal 3-Stripes'],
    material:'Suede upper, rubber outsole',
    body:'#5a3f78', bodyL:'#7a5aa0', stripe:'#f5f0e6', collar:'#3a2858', glow:'#7a4aaa', vap:[150,90,200] },

  { id:'sl-72-rs', name:'SL 72 RS', category:'originals', sub:'shoes', price:110, originalPrice:130,
    image:'/images/sl72.jpg',
    colors:['#0a5c2a','#c8a24a'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[4,9,13,12,8,5,2]),
    rating:4.5, reviewCount:96, isNew:false, tag:'Heritage',
    description:'A 70s running icon reborn. Lightweight nylon and suede with vintage racing lines and a feather-soft ride.',
    details:['Nylon and suede upper','Retro 1972 racing silhouette','EVA wedge midsole','Grippy rubber outsole','Heritage Trefoil branding'],
    material:'Nylon and suede upper, EVA midsole',
    body:'#0a4d24', bodyL:'#0a6630', stripe:'#c8a24a', collar:'#063a1a', glow:'#0a7a38', vap:[20,140,70] },

  /* ════════ MEN — SHOES ════════ */
  { id:'forum-low', name:'Forum Low', category:'men', sub:'shoes', price:120, originalPrice:140,
    image:'/images/forum.jpg',
    colors:['#f5f5f5','#0a3a8a'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[6,12,17,16,11,6,3]),
    rating:4.6, reviewCount:174, isNew:false, tag:'Archive',
    description:'1984 basketball heritage with the signature ankle strap that started it all. Premium leather, court-ready attitude.',
    details:['Full-grain leather upper','Adjustable ankle strap','X-pattern outsole','Padded sockliner','OG Forum branding'],
    material:'Leather upper, rubber outsole',
    body:'#e8e8e8', bodyL:'#ffffff', stripe:'#0a3a8a', collar:'#cccccc', glow:'#0a4aaa', vap:[20,90,220] },

  { id:'handball-spezial', name:'Handball Spezial', category:'men', sub:'shoes', price:100, originalPrice:null,
    image:'/images/spezial.jpg',
    colors:['#0a5c2a','#1b1b1b','#7a1020'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[7,13,19,18,12,7,3]),
    rating:4.8, reviewCount:356, isNew:false, tag:'Trending',
    description:'The indoor classic everyone wants. Rich suede, a slim profile and that perfect gum sole.',
    details:['Soft suede upper','Slim retro indoor profile','Gum rubber outsole','Contrast 3-Stripes','Spezial heel branding'],
    material:'Suede upper, gum rubber outsole',
    body:'#0a4d24', bodyL:'#0a6630', stripe:'#f5f0e6', collar:'#063a1a', glow:'#0a7a38', vap:[20,140,70] },

  { id:'nmd-r1', name:'NMD_R1 V3', category:'men', sub:'shoes', price:150, originalPrice:null,
    image:'/images/nmd.jpg',
    colors:['#111111','#cc0022'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[5,10,14,13,9,5,2]),
    rating:4.5, reviewCount:158, isNew:true, tag:'New',
    description:'Future-forward design meets all-day comfort. A responsive BOOST midsole, a Primeknit upper and signature midsole plugs.',
    details:['Responsive BOOST midsole','Adaptive Primeknit upper','Signature midsole plugs','Sock-like fit','Durable rubber outsole'],
    material:'Primeknit textile upper, BOOST midsole',
    body:'#141414', bodyL:'#222222', stripe:'#cc0022', collar:'#0a0a0a', glow:'#cc0022', vap:[200,30,50] },

  { id:'ultraboost-light', name:'Ultraboost Light', category:'men', sub:'shoes', price:190, originalPrice:null,
    image:'/images/ultraboost.jpg',
    colors:['#111111','#f5f5f5'], sizes:['6','7','8','9','10','11','12'],
    stock:stockOf(['6','7','8','9','10','11','12'],[4,9,15,14,10,6,3]),
    rating:4.9, reviewCount:502, isNew:false, tag:'Bestseller',
    description:'Our lightest BOOST ever. Explosive energy return in a featherweight Primeknit package built for every mile.',
    details:['Light BOOST midsole','Primeknit+ upper','Linear Energy Push system','Continental Rubber outsole','Supportive Linear heel'],
    material:'Primeknit+ upper, Light BOOST midsole',
    body:'#141414', bodyL:'#242424', stripe:'#ffffff', collar:'#0a0a0a', glow:'#555555', vap:[90,90,110] },

  /* ════════ WOMEN ════════ */
  { id:'gazelle-w', name:'Gazelle', category:'women', sub:'shoes', price:120, originalPrice:140,
    image:'/images/gazelle.jpg',
    colors:['#e89ab8','#0a3a8a','#1b1b1b'], sizes:['5','6','7','8','9','10'],
    stock:stockOf(['5','6','7','8','9','10'],[8,16,20,17,10,4]),
    rating:4.7, reviewCount:289, isNew:false, tag:'Icon',
    description:'A 90s icon in soft suede. The Gazelle delivers heritage style with a feminine colour palette and a low, easy profile.',
    details:['Premium suede upper','Slim retro silhouette','Tonal 3-Stripes','Comfortable textile lining','Gold foil Gazelle branding'],
    material:'Suede upper, rubber outsole',
    body:'#d77fa3', bodyL:'#e89ab8', stripe:'#ffffff', collar:'#b8688c', glow:'#e060a0', vap:[230,120,170] },

  { id:'superstar-w', name:'Superstar W', category:'women', sub:'shoes', price:100, originalPrice:null,
    image:'/images/superstar.jpg',
    colors:['#f5f5f5','#e89ab8'], sizes:['5','6','7','8','9','10'],
    stock:stockOf(['5','6','7','8','9','10'],[7,13,17,15,9,4]),
    rating:4.6, reviewCount:142, isNew:false, tag:null,
    description:'The shell-toe legend, cut for women. Clean leather, serrated 3-Stripes and the silhouette that never goes out of style.',
    details:['Leather upper','Rubber shell toe','Serrated 3-Stripes','Cushioned sockliner','Superstar heel patch'],
    material:'Leather upper, rubber cupsole',
    body:'#e9e9e9', bodyL:'#ffffff', stripe:'#111111', collar:'#cccccc', glow:'#e89ab8', vap:[220,180,200] },

  { id:'samba-og-w', name:'Samba OG W', category:'women', sub:'shoes', price:100, originalPrice:null,
    image:'/images/samba.jpg',
    colors:['#1b1b1b','#f5f0e6'], sizes:['5','6','7','8','9','10'],
    stock:stockOf(['5','6','7','8','9','10'],[9,18,22,18,11,5]),
    rating:4.7, reviewCount:201, isNew:false, tag:'Bestseller',
    description:'The Samba, sized for her. Soft leather, gum sole and that effortless terrace style — a true everyday icon.',
    details:['Leather and suede upper','Suede T-toe overlay','Gum rubber outsole','3-Stripes branding','Slim low profile'],
    material:'Leather and suede upper, gum rubber outsole',
    body:'#1b1b1b', bodyL:'#2a2a2a', stripe:'#f5f0e6', collar:'#0a5c2a', glow:'#0a7a38', vap:[20,150,70] },

  { id:'adicolor-tee-w', name:'Adicolor Classics Tee', category:'women', sub:'tees', price:35, originalPrice:45,
    image:'/images/tee_red.jpg',
    colors:['#c81e2c','#111111','#f5f5f5'], sizes:['XS','S','M','L','XL'],
    stock:stockOf(['XS','S','M','L','XL'],[14,22,28,20,10]),
    rating:4.4, reviewCount:88, isNew:false, tag:null,
    description:'A wardrobe essential in soft organic cotton, finished with a bold Trefoil and 3-Stripes on the shoulders.',
    details:['100% organic cotton','Regular fit','Trefoil logo at chest','3-Stripes on shoulders','Ribbed crewneck'],
    material:'100% organic cotton single jersey',
    body:'#a81824', bodyL:'#c81e2c', stripe:'#ffffff', collar:'#7a1018', glow:'#c81e2c', vap:[200,40,50] },
];

/* ═══════════════════════════════════════════
   IN-MEMORY STORES
═══════════════════════════════════════════ */
const REVIEWS = {};     // { productId: [ {name,rating,text,date} ] }  (lazily seeded)
const ORDERS  = {};     // { orderId: order }
let   orderSeq = 1000;

/* ═══════════════════════════════════════════
   PERSISTENCE  (JSON files in ./data — owner edits survive restarts)
═══════════════════════════════════════════ */
const DATA_DIR = path.join(__dirname, 'data');
function dataPath(n) { return path.join(DATA_DIR, n + '.json'); }
function saveData(name, value) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(dataPath(name), JSON.stringify(value, null, 2)); }
  catch (e) { console.error('saveData', name, e.message); }
}
function loadData(name, fallback) {
  try { return JSON.parse(fs.readFileSync(dataPath(name), 'utf8')); }
  catch { saveData(name, fallback); return fallback; }
}

/* rehydrate products in place (keep const reference) */
(function () {
  const saved = loadData('products', PRODUCTS);
  if (Array.isArray(saved) && saved !== PRODUCTS) { PRODUCTS.length = 0; saved.forEach(p => PRODUCTS.push(p)); }
})();
function saveProducts() { saveData('products', PRODUCTS); }

Object.assign(ORDERS,  loadData('orders',  {}));
Object.assign(REVIEWS, loadData('reviews', {}));
orderSeq = Object.keys(ORDERS).reduce((mx, id) => {
  const n = parseInt((id.match(/ADI-(\d+)/) || [])[1], 10);
  return isNaN(n) ? mx : Math.max(mx, n);
}, 1000);
function saveOrders()  { saveData('orders',  ORDERS); }
function saveReviews() { saveData('reviews', REVIEWS); }

const SUBSCRIBERS = loadData('subscribers', []);
function saveSubscribers() { saveData('subscribers', SUBSCRIBERS); }

const SETTINGS = loadData('settings', {
  storeName: 'ADIDAS',
  adminPassword: process.env.ADMIN_PASSWORD || 'adidas-admin',
  freeShipThreshold: 100,
  standardFee: 5.99,
  expressFee: 14.99,
  promos: { ADIDAS20: { type: 'percent', value: 20 }, WELCOME: { type: 'fixed', value: 15 } },
});
function saveSettings() { saveData('settings', SETTINGS); }

/* ── admin auth (in-memory bearer tokens; cleared on restart) ── */
const ADMIN_TOKENS = new Set();
function makeToken() { return 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
function isAuthed(req) {
  const h = req.headers['authorization'] || '';
  const t = h.replace(/^Bearer\s+/i, '').trim();
  return !!t && ADMIN_TOKENS.has(t);
}
function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
    || ('p-' + Date.now().toString(36));
}

/* ═══════════════════════════════════════════
   DETERMINISTIC REVIEW SEEDING
   Seeds 2-3 plausible reviews per product from a stable hash of the id,
   so the same product always returns the same seeded reviews.
═══════════════════════════════════════════ */
const REVIEW_NAMES = [
  'Alex M.','Jordan P.','Sam K.','Taylor R.','Casey L.','Morgan W.','Jamie D.',
  'Riley S.','Drew B.','Quinn T.','Avery N.','Cameron H.','Reese O.','Skyler V.',
  'Parker G.','Hayden F.','Devon C.','Emerson J.','Rowan A.','Sage E.',
];
const REVIEW_SNIPPETS = [
  'Absolutely love this — exactly as pictured and the quality is premium.',
  'Fits true to size and feels incredible. Would buy again in another color.',
  'Great everyday piece. The detailing really sets it apart from the rest.',
  'Comfortable and stylish. Got compliments the first day I wore it.',
  'Excellent build quality. You can tell this is the real heritage design.',
  'Shipped fast and looks even better in person. Highly recommend.',
  'Perfect for both the streets and the gym. Versatile and well made.',
  'The fabric is soft yet durable. Held up great after multiple washes.',
  'A classic that never goes out of style. Worth every penny.',
  'Solid purchase. Sizing was spot on and the colorway is stunning.',
  'Runs slightly large but the comfort makes up for it. Love the look.',
  'My new go-to. Clean lines, premium feel, unmistakably Adidas.',
];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedReviews(product) {
  const h = hashStr(product.id);
  const count = 2 + (h % 2);                 // 2 or 3 reviews
  const list = [];
  const baseTime = Date.UTC(2026, 0, 1);     // anchor: 2026-01-01
  for (let i = 0; i < count; i++) {
    const seed = hashStr(product.id + ':' + i);
    const name = REVIEW_NAMES[seed % REVIEW_NAMES.length];
    const text = REVIEW_SNIPPETS[(seed >> 5) % REVIEW_SNIPPETS.length];
    /* keep seeded ratings close to the product's headline rating */
    const ratingPool = [
      Math.round(product.rating),
      5,
      Math.max(3, Math.round(product.rating) - 1),
    ];
    const rating = ratingPool[i % ratingPool.length];
    const daysAgo = (seed % 120) + 5;
    const date = new Date(baseTime - daysAgo * 86400000).toISOString().slice(0, 10);
    list.push({ name, rating, text, date });
  }
  return list;
}

function reviewsFor(product) {
  if (!REVIEWS[product.id]) REVIEWS[product.id] = seedReviews(product);
  return REVIEWS[product.id];
}

/* ═══════════════════════════════════════════
   MIME TYPES
═══════════════════════════════════════════ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
  '.mjs' : 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map' : 'application/json; charset=utf-8',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.webp': 'image/webp',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf' : 'font/ttf',
  '.otf' : 'font/otf',
  '.txt' : 'text/plain; charset=utf-8',
  '.webmanifest':'application/manifest+json',
};

/* ═══════════════════════════════════════════
   STATIC FILE SERVER
═══════════════════════════════════════════ */
function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

/* ═══════════════════════════════════════════
   JSON HELPERS + CORS
═══════════════════════════════════════════ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(res, data, status = 200) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS));
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => {
      body += c;
      if (body.length > 12e6) { req.destroy(); resolve({}); }   // 12MB guard (allows base64 image upload)
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function totalStock(p) {
  return Object.values(p.stock || {}).reduce((a, b) => a + b, 0);
}

/* ═══════════════════════════════════════════
   /api/products  — filters + sort  (SPEC §3)
   ?category= &sub= &ids=csv &limit= &sort= &q= &tag=
   &minPrice= &maxPrice= &onSale=true &isNew=true
═══════════════════════════════════════════ */
function handleProducts(req, res) {
  const q = url.parse(req.url, true).query;
  let list = PRODUCTS.slice();

  if (q.category) list = list.filter(p => p.category === q.category);
  if (q.sub)      list = list.filter(p => p.sub === q.sub);
  if (q.tag)      list = list.filter(p => p.tag && p.tag.toLowerCase() === String(q.tag).toLowerCase());

  if (q.ids) {
    const ids = String(q.ids).split(',').map(s => s.trim()).filter(Boolean);
    list = list.filter(p => ids.includes(p.id));
  }

  if (q.onSale === 'true') list = list.filter(p => p.originalPrice != null && p.originalPrice > p.price);
  if (q.isNew  === 'true') list = list.filter(p => p.isNew === true);

  const minP = q.minPrice != null ? parseFloat(q.minPrice) : null;
  const maxP = q.maxPrice != null ? parseFloat(q.maxPrice) : null;
  if (minP != null && !isNaN(minP)) list = list.filter(p => p.price >= minP);
  if (maxP != null && !isNaN(maxP)) list = list.filter(p => p.price <= maxP);

  if (q.q) {
    const term = String(q.q).toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.includes(term) ||
      p.sub.includes(term) ||
      (p.tag && p.tag.toLowerCase().includes(term)) ||
      p.description.toLowerCase().includes(term)
    );
  }

  /* sort: 'price-asc'|'price-desc'|'name'|'rating'|'newest'|'featured' */
  const tagRank = { 'Bestseller':6, 'Icon':5, 'Trending':4, 'Limited':3, 'Exclusive':3, 'Archive':2, 'Classic':2, 'New':1 };
  switch (q.sort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'rating':     list.sort((a, b) => b.rating - a.rating); break;
    case 'newest':     list.sort((a, b) => (b.isNew === a.isNew ? b.rating - a.rating : (b.isNew ? 1 : -1))); break;
    case 'featured':
    default:
      if (q.sort === 'featured')
        list.sort((a, b) => ((tagRank[b.tag] || 0) - (tagRank[a.tag] || 0)) || (b.rating - a.rating));
      break;
  }

  if (q.limit) {
    const n = parseInt(q.limit, 10);
    if (!isNaN(n) && n >= 0) list = list.slice(0, n);
  }

  json(res, list);
}

function handleProduct(res, id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return json(res, { error: 'Not found' }, 404);
  json(res, p);
}

function handleRelated(res, id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return json(res, []);
  /* prefer same sub, then same category, fill up to 4 */
  const sameSub = PRODUCTS.filter(x => x.id !== id && x.sub === p.sub);
  const sameCat = PRODUCTS.filter(x => x.id !== id && x.category === p.category && x.sub !== p.sub);
  const seen = new Set();
  const related = [];
  for (const x of [...sameSub, ...sameCat]) {
    if (related.length >= 4) break;
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    related.push(x);
  }
  json(res, related.slice(0, 4));
}

/* ═══════════════════════════════════════════
   /api/meta  (SPEC §3)
   -> {categories, subs, priceRange:{min,max}, colors:[...], total}
═══════════════════════════════════════════ */
function handleMeta(res) {
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  const subs       = [...new Set(PRODUCTS.map(p => p.sub))];
  const colors     = [...new Set(PRODUCTS.flatMap(p => p.colors))];
  const prices     = PRODUCTS.map(p => p.price);
  json(res, {
    categories,
    subs,
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    colors,
    total: PRODUCTS.length,
  });
}

/* ═══════════════════════════════════════════
   /api/reviews/:id  (SPEC §3)
   GET  -> {average, count, reviews:[{name,rating,text,date}]}
   POST {name,rating,text} -> appends in-memory, returns updated list
═══════════════════════════════════════════ */
function reviewPayload(product) {
  const list = reviewsFor(product);
  const count = list.length;
  const average = count
    ? Math.round((list.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10
    : product.rating;
  return { average, count, reviews: list };
}

function handleReviewsGet(res, id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return json(res, { error: 'Not found' }, 404);
  json(res, reviewPayload(p));
}

async function handleReviewsPost(req, res, id) {
  const p = PRODUCTS.find(p => p.id === id);
  if (!p) return json(res, { error: 'Not found' }, 404);
  const body = await readBody(req);
  const name = (body.name || '').toString().trim();
  let rating = parseInt(body.rating, 10);
  const text = (body.text || '').toString().trim();

  if (!name || !text || isNaN(rating))
    return json(res, { error: 'name, rating and text are required' }, 400);
  rating = Math.max(1, Math.min(5, rating));

  const review = { name, rating, text, date: new Date().toISOString().slice(0, 10) };
  const list = reviewsFor(p);
  list.unshift(review);
  saveReviews();
  json(res, reviewPayload(p), 201);
}

/* ═══════════════════════════════════════════
   /api/newsletter  (SPEC §3)
   POST {email} -> {ok:true} (validate email shape)
═══════════════════════════════════════════ */
async function handleNewsletter(req, res) {
  const body = await readBody(req);
  const email = (body.email || '').toString().trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) return json(res, { ok: false, error: 'Invalid email address' }, 400);
  if (!SUBSCRIBERS.some(s => s.email === email)) {
    SUBSCRIBERS.push({ email, date: new Date().toISOString().slice(0, 10) });
    saveSubscribers();
  }
  json(res, { ok: true, email });
}

/* ═══════════════════════════════════════════
   /api/orders  (SPEC §3)
   POST {items,customer,shipping,totals} -> {orderId, ...} store in-memory
   GET  /api/orders/:id -> order or 404
═══════════════════════════════════════════ */
async function handleOrderCreate(req, res) {
  const body = await readBody(req);
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json(res, { error: 'Order must contain at least one item' }, 400);

  const orderId = 'ADI-' + (++orderSeq) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const createdAt = new Date().toISOString();
  const estimate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

  const order = {
    orderId,
    createdAt,
    status: 'confirmed',
    items,
    customer: body.customer || {},
    shipping: body.shipping || {},
    totals:   body.totals   || {},
    deliveryEstimate: estimate,
  };
  ORDERS[orderId] = order;
  saveOrders();

  /* decrement stock per ordered item so storefront + admin dashboard stay in sync */
  let stockChanged = false;
  items.forEach(it => {
    const p = PRODUCTS.find(x => x.id === it.id);
    if (!p || !p.stock) return;
    const size = it.size;
    const qty  = Math.max(0, parseInt(it.qty, 10) || 0);
    if (size != null && p.stock[size] != null && qty > 0) {
      p.stock[size] = Math.max(0, p.stock[size] - qty);
      stockChanged = true;
    }
  });
  if (stockChanged) saveProducts();

  json(res, order, 201);
}

function handleOrderGet(res, id) {
  const order = ORDERS[id];
  if (!order) return json(res, { error: 'Order not found' }, 404);
  json(res, order);
}

/* ═══════════════════════════════════════════
   /api/search  (SPEC §3)
   POST {query} -> {correctedQuery, products:[...]}
   Claude Opus 4.8 with robust fallback to local fuzzy search.
═══════════════════════════════════════════ */

/* Local fuzzy search — token overlap + substring scoring (the fallback). */
function localSearch(query) {
  const q = query.toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = PRODUCTS.map(p => {
    const hay = `${p.name} ${p.category} ${p.sub} ${p.tag || ''} ${p.description} ${p.material}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 10;
    if (p.name.toLowerCase().includes(q)) score += 12;
    for (const t of tokens) {
      if (!t) continue;
      if (p.name.toLowerCase().includes(t)) score += 5;
      if (p.sub.includes(t)) score += 4;
      if (p.category.includes(t)) score += 3;
      if (p.tag && p.tag.toLowerCase().includes(t)) score += 3;
      if (p.description.toLowerCase().includes(t)) score += 2;
      if (p.material.toLowerCase().includes(t)) score += 1;
      /* fuzzy: shared 4-char prefix with any name word catches simple typos */
      if (t.length >= 4) {
        for (const w of p.name.toLowerCase().split(/\s+/)) {
          if (w.length >= 4 && w.slice(0, 4) === t.slice(0, 4)) score += 2;
        }
      }
    }
    return { p, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.p);
  return scored;
}

function handleSearch(req, res) {
  readBody(req).then(body => {
    let query = (body.query || '').toString().trim();
    if (query.length < 2) return json(res, { correctedQuery: query, products: [] });

    const fallback = () => json(res, { correctedQuery: query, products: localSearch(query) });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return fallback();

    const productList = PRODUCTS.map(p =>
      `${p.id} | ${p.name} | ${p.category} | ${p.sub} | $${p.price}`
    ).join('\n');

    const payload = JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content:
          `You are the search engine for an Adidas store. The shopper typed: "${query}"\n\n` +
          `Catalog (id | name | category | sub | price):\n${productList}\n\n` +
          `Correct obvious typos in the query, then pick the most relevant product ids (max 8), best match first.\n` +
          `Return ONLY valid JSON, no prose, no markdown:\n` +
          `{"correctedQuery":"<corrected or same>","productIds":["id1","id2"]}`
      }]
    });

    const opts = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    let settled = false;
    const done = (fn) => { if (settled) return; settled = true; fn(); };

    const apiReq = https.request(opts, apiRes => {
      let data = '';
      apiRes.on('data', c => data += c);
      apiRes.on('end', () => {
        try {
          const msg = JSON.parse(data);
          if (!msg.content || !msg.content[0] || !msg.content[0].text) throw new Error('bad shape');
          let text = msg.content[0].text.trim();
          /* strip markdown fences if the model wrapped the JSON */
          text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const start = text.indexOf('{');
          const stop  = text.lastIndexOf('}');
          if (start !== -1 && stop !== -1) text = text.slice(start, stop + 1);
          const result = JSON.parse(text);
          const ids = Array.isArray(result.productIds) ? result.productIds : [];
          const products = ids
            .map(id => PRODUCTS.find(p => p.id === id))
            .filter(Boolean)
            .slice(0, 8);
          const corrected = (result.correctedQuery || query).toString();
          if (!products.length) return done(fallback);
          done(() => json(res, { correctedQuery: corrected, products }));
        } catch {
          done(fallback);
        }
      });
    });

    apiReq.on('error', () => done(fallback));
    apiReq.setTimeout(8000, () => { apiReq.destroy(); done(fallback); });
    apiReq.write(payload);
    apiReq.end();
  });
}

/* ═══════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════ */
/* ═══════════════════════════════════════════
   ADMIN API  (owner dashboard) — Bearer token required except /login
═══════════════════════════════════════════ */
function normalizeProduct(p) {
  const num = (v, d) => { const n = Number(v); return isNaN(n) ? d : n; };
  const toArr = (v, sep) => Array.isArray(v) ? v
    : (typeof v === 'string' ? v.split(sep).map(s => s.trim()).filter(Boolean) : []);
  p.price = num(p.price, 0);
  p.originalPrice = (p.originalPrice === '' || p.originalPrice == null) ? null : num(p.originalPrice, null);
  p.category = p.category || 'originals';
  p.sub = p.sub || 'shoes';
  p.colors = toArr(p.colors, ',').length ? toArr(p.colors, ',') : ['#1b1b1b'];
  p.sizes = toArr(p.sizes, ',').length ? toArr(p.sizes, ',') : ['M'];
  if (!p.stock || typeof p.stock !== 'object' || Array.isArray(p.stock)) {
    const st = {}; p.sizes.forEach(s => st[s] = 10); p.stock = st;
  }
  p.rating = num(p.rating, 4.5);
  p.reviewCount = num(p.reviewCount, 0);
  p.isNew = !!p.isNew;
  p.tag = p.tag || null;
  p.description = p.description || '';
  p.details = toArr(p.details, '\n');
  p.material = p.material || '';
  p.body = p.body || '#1b1b1b'; p.bodyL = p.bodyL || '#2a2a2a';
  p.stripe = p.stripe || '#ffffff'; p.collar = p.collar || '#111111'; p.glow = p.glow || '#444444';
  p.vap = Array.isArray(p.vap) ? p.vap : [120, 120, 120];
  p.image = p.image || null;
  return p;
}

async function adminLogin(req, res) {
  const body = await readBody(req);
  if (!body.password || String(body.password) !== SETTINGS.adminPassword)
    return json(res, { error: 'Invalid password' }, 401);
  const token = makeToken();
  ADMIN_TOKENS.add(token);
  json(res, { token, store: SETTINGS.storeName });
}

function adminStats(res) {
  const orders = Object.values(ORDERS);
  const rev = o => Number(o.totals && o.totals.total) || 0;
  const revenue = orders.reduce((a, o) => a + rev(o), 0);
  const units = {};
  orders.forEach(o => (o.items || []).forEach(i => { units[i.id] = (units[i.id] || 0) + (i.qty || 0); }));
  const topProducts = Object.entries(units).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return { id, qty, name: p ? p.name : id, image: p ? p.image : null, price: p ? p.price : 0 };
  }).sort((a, b) => b.qty - a.qty).slice(0, 6);
  const byStatus = {};
  orders.forEach(o => { const s = o.status || 'confirmed'; byStatus[s] = (byStatus[s] || 0) + 1; });
  const salesByDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const dayOrders = orders.filter(o => (o.createdAt || '').slice(0, 10) === d);
    salesByDay.push({ date: d, total: dayOrders.reduce((a, o) => a + rev(o), 0), count: dayOrders.length });
  }
  const lowStock = PRODUCTS.filter(p => { const t = totalStock(p); return t > 0 && t < 20; })
    .map(p => ({ id: p.id, name: p.name, stock: totalStock(p), image: p.image })).sort((a, b) => a.stock - b.stock);
  const outOfStock = PRODUCTS.filter(p => totalStock(p) === 0).map(p => ({ id: p.id, name: p.name }));
  const recentOrders = orders.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 8);
  json(res, {
    revenue, orderCount: orders.length, productCount: PRODUCTS.length,
    subscriberCount: SUBSCRIBERS.length,
    reviewCount: Object.values(REVIEWS).reduce((a, l) => a + l.length, 0),
    avgOrderValue: orders.length ? revenue / orders.length : 0,
    byStatus, salesByDay, topProducts, lowStock, outOfStock, recentOrders,
  });
}

async function adminProductCreate(req, res) {
  const body = await readBody(req);
  if (!body.name) return json(res, { error: 'name required' }, 400);
  let id = body.id ? slugify(body.id) : slugify(body.name);
  while (PRODUCTS.some(p => p.id === id)) id = id + '-' + Math.random().toString(36).slice(2, 5);
  const p = normalizeProduct(Object.assign({}, body, { id }));
  PRODUCTS.push(p); saveProducts();
  json(res, p, 201);
}
async function adminProductUpdate(req, res, id) {
  const idx = PRODUCTS.findIndex(p => p.id === id);
  if (idx < 0) return json(res, { error: 'Not found' }, 404);
  const body = await readBody(req); delete body.id;
  PRODUCTS[idx] = normalizeProduct(Object.assign({}, PRODUCTS[idx], body, { id }));
  saveProducts(); json(res, PRODUCTS[idx]);
}
function adminProductDelete(res, id) {
  const idx = PRODUCTS.findIndex(p => p.id === id);
  if (idx < 0) return json(res, { error: 'Not found' }, 404);
  const [removed] = PRODUCTS.splice(idx, 1); saveProducts();
  json(res, { ok: true, removed: removed.id });
}

function adminOrderList(res) {
  json(res, Object.values(ORDERS).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
}
async function adminOrderUpdate(req, res, id) {
  const o = ORDERS[id]; if (!o) return json(res, { error: 'Not found' }, 404);
  const body = await readBody(req);
  if (body.status) o.status = String(body.status);
  saveOrders(); json(res, o);
}
function adminOrderDelete(res, id) {
  if (!ORDERS[id]) return json(res, { error: 'Not found' }, 404);
  delete ORDERS[id]; saveOrders(); json(res, { ok: true });
}

function adminReviewsList(res) {
  const out = [];
  Object.keys(REVIEWS).forEach(pid => {
    const p = PRODUCTS.find(x => x.id === pid);
    (REVIEWS[pid] || []).forEach((r, i) => out.push(Object.assign({ productId: pid, productName: p ? p.name : pid, index: i }, r)));
  });
  out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  json(res, out);
}
function adminReviewDelete(res, pid, index) {
  if (!REVIEWS[pid]) return json(res, { error: 'Not found' }, 404);
  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= REVIEWS[pid].length) return json(res, { error: 'Bad index' }, 400);
  REVIEWS[pid].splice(i, 1); saveReviews(); json(res, { ok: true });
}

function adminSubscribers(res) { json(res, SUBSCRIBERS); }

function adminSettingsGet(res) {
  const s = Object.assign({}, SETTINGS); delete s.adminPassword;
  json(res, Object.assign(s, { hasPassword: true }));
}
async function adminSettingsUpdate(req, res) {
  const body = await readBody(req);
  ['storeName', 'freeShipThreshold', 'standardFee', 'expressFee', 'promos'].forEach(k => { if (body[k] != null) SETTINGS[k] = body[k]; });
  if (body.newPassword) SETTINGS.adminPassword = String(body.newPassword);
  saveSettings(); adminSettingsGet(res);
}

async function adminUpload(req, res) {
  const body = await readBody(req);
  const data = (body.dataUrl || '').toString();
  const m = data.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/);
  if (!m) return json(res, { error: 'Expected an image dataUrl' }, 400);
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const base = slugify((body.filename || 'upload').replace(/\.[a-z0-9]+$/i, ''));
  const name = base + '-' + Date.now().toString(36) + '.' + ext;
  try {
    fs.mkdirSync(path.join(PUBLIC, 'images'), { recursive: true });
    fs.writeFileSync(path.join(PUBLIC, 'images', name), Buffer.from(m[2], 'base64'));
  } catch (e) { return json(res, { error: 'write failed' }, 500); }
  json(res, { ok: true, path: '/images/' + name });
}

function routeAdmin(req, res, pathname, method) {
  if (pathname === '/api/admin/login' && method === 'POST') return adminLogin(req, res);
  if (!isAuthed(req)) return json(res, { error: 'Unauthorized' }, 401);
  let m;
  if (pathname === '/api/admin/stats' && method === 'GET') return adminStats(res);
  if (pathname === '/api/admin/products' && method === 'POST') return adminProductCreate(req, res);
  if ((m = pathname.match(/^\/api\/admin\/products\/([^/]+)$/))) {
    if (method === 'PUT' || method === 'PATCH') return adminProductUpdate(req, res, m[1]);
    if (method === 'DELETE') return adminProductDelete(res, m[1]);
  }
  if (pathname === '/api/admin/orders' && method === 'GET') return adminOrderList(res);
  if ((m = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/))) {
    if (method === 'PUT' || method === 'PATCH') return adminOrderUpdate(req, res, m[1]);
    if (method === 'DELETE') return adminOrderDelete(res, m[1]);
  }
  if (pathname === '/api/admin/reviews' && method === 'GET') return adminReviewsList(res);
  if ((m = pathname.match(/^\/api\/admin\/reviews\/([^/]+)\/(\d+)$/)) && method === 'DELETE') return adminReviewDelete(res, m[1], m[2]);
  if (pathname === '/api/admin/subscribers' && method === 'GET') return adminSubscribers(res);
  if (pathname === '/api/admin/settings' && method === 'GET') return adminSettingsGet(res);
  if (pathname === '/api/admin/settings' && (method === 'PUT' || method === 'POST')) return adminSettingsUpdate(req, res);
  if (pathname === '/api/admin/upload' && method === 'POST') return adminUpload(req, res);
  return json(res, { error: 'Admin endpoint not found' }, 404);
}

const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);
  const method   = req.method;

  /* CORS preflight on every /api/* route */
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  /* ── API ROUTES ── */
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/products' && method === 'GET') return handleProducts(req, res);
    if (pathname === '/api/meta'     && method === 'GET') return handleMeta(res);

    let m;
    if ((m = pathname.match(/^\/api\/products\/related\/(.+)$/)) && method === 'GET')
      return handleRelated(res, m[1]);
    if ((m = pathname.match(/^\/api\/products\/([^/]+)$/)) && method === 'GET')
      return handleProduct(res, m[1]);

    if ((m = pathname.match(/^\/api\/reviews\/([^/]+)$/))) {
      if (method === 'GET')  return handleReviewsGet(res, m[1]);
      if (method === 'POST') return handleReviewsPost(req, res, m[1]);
    }

    if (pathname === '/api/search'     && method === 'POST') return handleSearch(req, res);
    if (pathname === '/api/newsletter' && method === 'POST') return handleNewsletter(req, res);

    if (pathname === '/api/orders' && method === 'POST') return handleOrderCreate(req, res);
    if ((m = pathname.match(/^\/api\/orders\/([^/]+)$/)) && method === 'GET')
      return handleOrderGet(res, m[1]);

    /* ── ADMIN (owner dashboard) ── */
    if (pathname.startsWith('/api/admin/')) return routeAdmin(req, res, pathname, method);

    /* unknown API route */
    return json(res, { error: 'Endpoint not found' }, 404);
  }

  /* ── STATIC FILES: public/ first, then project root ── */
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  /* prevent path traversal */
  const safe = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const rel  = safe === '/' || safe === '\\' ? 'index.html' : safe.replace(/^[\/\\]+/, '');

  const candidates = [path.join(PUBLIC, rel), path.join(ROOT, rel)];
  for (const fp of candidates) {
    if (fp.startsWith(PUBLIC) || fp.startsWith(ROOT)) {
      try {
        if (fs.existsSync(fp) && fs.statSync(fp).isFile()) return serveStatic(res, fp);
      } catch { /* ignore and continue */ }
    }
  }

  /* SPA-style fallback to a 404 page if present, else inline */
  const notFound = path.join(PUBLIC, '404.html');
  if (fs.existsSync(notFound)) {
    fs.readFile(notFound, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end('<h1>404</h1>'); return; }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1 style="font-family:sans-serif;padding:40px">404 — Not Found</h1>');
});

/* ═══════════════════════════════════════════
   BOOT
═══════════════════════════════════════════ */
server.listen(PORT, () => {
  const aiActive = !!process.env.ANTHROPIC_API_KEY;
  const onSale   = PRODUCTS.filter(p => p.originalPrice != null && p.originalPrice > p.price).length;
  const base     = `http://localhost:${PORT}`;

  console.log('');
  console.log('  ADIDAS STORE  ·  pure Node.js server');
  console.log('  ────────────────────────────────────────────');
  console.log(`  Listening    ${base}`);
  console.log(`  Products     ${PRODUCTS.length}  (${onSale} on sale)`);
  console.log(`  AI Search    ${aiActive ? 'ON  · Claude Opus 4.8 (claude-opus-4-8)' : 'OFF · local fuzzy fallback (set ANTHROPIC_API_KEY)'}`);
  console.log('  ────────────────────────────────────────────');
  console.log('  Pages');
  console.log(`    Home         ${base}/`);
  console.log(`    Men          ${base}/men.html`);
  console.log(`    Women        ${base}/women.html`);
  console.log(`    Originals    ${base}/originals.html`);
  console.log(`    Collection   ${base}/collection.html`);
  console.log(`    Bag          ${base}/bag.html`);
  console.log(`    Dashboard    ${base}/admin.html   (password: ${SETTINGS.adminPassword})`);
  console.log('  API');
  console.log('    GET   /api/products            ?category &sub &ids &limit &sort &q &tag &minPrice &maxPrice &onSale &isNew');
  console.log('    GET   /api/products/:id');
  console.log('    GET   /api/products/related/:id');
  console.log('    GET   /api/meta');
  console.log('    POST  /api/search              {query}');
  console.log('    GET   /api/reviews/:id         · POST /api/reviews/:id  {name,rating,text}');
  console.log('    POST  /api/newsletter          {email}');
  console.log('    POST  /api/orders              {items,customer,shipping,totals}  · GET /api/orders/:id');
  console.log('');
});
