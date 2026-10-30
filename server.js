import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminDir = path.join(__dirname, 'admin-panel');
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY?.trim();
const ADMIN_UID = process.env.ADMIN_UID?.trim().toLowerCase();
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SECRET_KEY || !ADMIN_UID || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(ADMIN_UID)) {
  console.error('Missing required environment variables. Copy .env.example to .env and configure it.');
  process.exit(1);
}
const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const app = express();

// Serve frontend files and Google verification file
app.use(express.static(path.join(__dirname, "public")));
app.get("/google8e5414056d6444a9.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "google8e5414056d6444a9.html")
  );
});


// Google Search Console verification
app.get("/google8e5414056d6444a9.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "google8e5414056d6444a9.html")
  );
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } , fileFilter: (_req,file,cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)) });
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://kxvsgnovrrlrxkbmaoln.supabase.co', 'wss://kxvsgnovrrlrxkbmaoln.supabase.co'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.use(express.json({ limit: '1mb' }));

async function requireAdmin(req,res,next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired session.' });
    if (String(data.user.id || '').trim().toLowerCase() !== ADMIN_UID) return res.status(403).json({ error: 'Admin access denied. Check ADMIN_UID matches the signed-in Supabase user UUID, then restart the server.' });
    req.user = data.user;
    next();
  } catch (e) { next(e); }
}
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const tables = { products: 'products', mediators: 'mediators' };
app.get('/api/health', (_req,res) => res.json({ ok: true }));

// Public, read-only catalog endpoints. The secret key stays on the server;
// only active listings and explicitly approved public fields are returned.
app.get('/api/public/products', asyncRoute(async (_req,res) => {
  const { data, error } = await adminClient.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
  if (error) {
    console.error('Public products query failed:', error.message);
    return res.status(502).json({ error: 'Could not load products from Supabase.', details: error.message });
  }
  const fields = ['id','category','game','name','price','price_usd','price_flexy','supports_dzd','supports_usd','supports_flexy','description','image_url','gallery_urls','seller_social','is_promotion','is_active','created_at'];
  res.set('Cache-Control', 'no-store');
  res.json({ data: (data || []).map(row => Object.fromEntries(fields.filter(key => key in row).map(key => [key, row[key]]))) });
}));
app.get('/api/public/mediators', asyncRoute(async (_req,res) => {
  const { data, error } = await adminClient.from('mediators').select('*').eq('is_active', true).order('created_at', { ascending: false });
  if (error) {
    console.error('Public mediators query failed:', error.message);
    return res.status(502).json({ error: 'Could not load mediators from Supabase.', details: error.message });
  }
  const fields = ['id','name','description','image_url','facebook_url','whatsapp_url','instagram_url','tiktok_url','is_active','created_at'];
  res.set('Cache-Control', 'no-store');
  res.json({ data: (data || []).map(row => Object.fromEntries(fields.filter(key => key in row).map(key => [key, row[key]]))) });
}));

 app.post('/api/admin/upload',requireAdmin, upload.single('image'), asyncRoute(async (req,res) => {
  if (!req.file) return res.status(400).json({ error:'Upload a JPG, PNG, or WebP image under 5 MB.' });
  const ext = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[req.file.mimetype];
  const filePath = `${randomUUID()}.${ext}`;
  const { error } = await adminClient.storage.from('product-images').upload(filePath,req.file.buffer,{contentType:req.file.mimetype,upsert:false});
  if (error) return res.status(400).json({ error:error.message });
  const { data } = adminClient.storage.from('product-images').getPublicUrl(filePath);
  res.status(201).json({ url:data.publicUrl });
}));
app.get('/api/admin/:resource', requireAdmin, asyncRoute(async (req,res) => {
  const table = tables[req.params.resource]; if (!table) return res.status(404).json({ error:'Unknown resource.' });
  const { data,error } = await adminClient.from(table).select('*').order('created_at',{ascending:false});
  if (error) return res.status(400).json({ error:error.message }); res.json({ data });
}));
app.post('/api/admin/:resource', requireAdmin, asyncRoute(async (req,res) => {
  const table = tables[req.params.resource]; if (!table) return res.status(404).json({ error:'Unknown resource.' });
  const { data,error } = await adminClient.from(table).insert(req.body).select().single();
  if (error) return res.status(400).json({ error:error.message }); res.status(201).json({ data });
}));
app.patch('/api/admin/:resource/:id', requireAdmin, asyncRoute(async (req,res) => {
  const table = tables[req.params.resource]; if (!table) return res.status(404).json({ error:'Unknown resource.' });
  const id = String(req.params.id); if (!/^\d+$/.test(id)) return res.status(400).json({ error:'Invalid record id.' });
  const { data,error } = await adminClient.from(table).update(req.body).eq('id',Number(id)).select().single();
  if (error) return res.status(400).json({ error:error.message }); res.json({ data });
}));
app.delete('/api/admin/:resource/:id', requireAdmin, asyncRoute(async (req,res) => {
  const table = tables[req.params.resource]; if (!table) return res.status(404).json({ error:'Unknown resource.' });
  const id = String(req.params.id); if (!/^\d+$/.test(id)) return res.status(400).json({ error:'Invalid record id.' });
  const { error } = await adminClient.from(table).delete().eq('id',Number(id));
  if (error) return res.status(400).json({ error:error.message }); res.json({ ok:true });
}));
// Serve the administrator interface separately from the public storefront.
app.use('/admin', express.static(adminDir, { extensions: ['html'], dotfiles: 'deny', index: 'index.html' }));

// Do not expose backend/configuration files through the public static server.
app.use((req, res, next) => {
  let pathname = req.path || '/';
  try { pathname = decodeURIComponent(pathname); } catch {}
  const blocked = /(^|\/)(?:\.env(?:\..*)?|\.git(?:\/.*)?|server\.js|package(?:-lock)?\.json|README\.txt|[^/]+\.sql|node_modules)(?:$|\/)/i;
  if (blocked.test(pathname)) return res.status(404).type('text').send('Not found');
  next();
});
// Serve the existing static site from this same backend.
app.use(express.static(__dirname, { extensions:['html'], dotfiles:'deny', index:'index.html' }));
app.use((err,_req,res,_next) => {
  console.error(err);
  if (err instanceof multer.MulterError) return res.status(400).json({ error:err.message });
  res.status(500).json({ error:'Internal server error.' });
});
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(`DZ Game Market backend running at http://localhost:${port}`));
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing server or set PORT to another free port in .env.`);
  } else {
    console.error('Backend failed to start:', error.message);
  }
  process.exitCode = 1;
});
