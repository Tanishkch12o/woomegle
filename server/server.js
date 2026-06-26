require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { isMock } = require('./config/firebase');

console.log(`Database engine: ${isMock ? 'Mock Firestore (In-Memory)' : 'Production Firebase Firestore'}`);

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Render reverse proxy headers (terminating SSL correctly)
app.set('trust proxy', 1);

// Hide Express headers
app.disable('x-powered-by');

// Security Middleware: Helmet (CSP, HSTS, Referrer Policy, Frame Protection)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://pagead2.googlesyndication.com"],
      connectSrc: ["'self'", "https://api.woomegle.com", "wss://api.woomegle.com"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://pagead2.googlesyndication.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: 'same-origin'
  },
  frameguard: {
    action: 'deny'
  }
}));

// Compression, Cookie Parser, XSS Clean, HPP
app.use(compression());
app.use(cookieParser());
app.use(xss());
app.use(hpp());

// CORS Middleware
app.use(cors({
  origin: [
    "https://woomegle.com",
    "https://www.woomegle.com"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging & Performance metrics monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: [
      "https://woomegle.com",
      "https://www.woomegle.com"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Robust Error Logging for Socket.io engine (capturing CORS, handshake, and origin failures)
io.engine.on("connection_error", (err) => {
  console.error("[SOCKET.IO CONNECTION/HANDSHAKE/CORS ERROR]", {
    code: err.code,
    message: err.message,
    context: err.context,
    reqHeaders: err.req ? {
      origin: err.req.headers.origin,
      referer: err.req.headers.referer,
      host: err.req.headers.host
    } : null
  });
});

// Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use('/api/', apiLimiter);

// Brute-force protection for login and signup endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login/signup requests per windowMs
  message: { message: "Too many login or signup attempts from this IP, please try again after 15 minutes." }
});

// Import API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

// Bind API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Dynamic Sitemap XML Endpoint for Search Engines
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://woomegle.com/</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://woomegle.com/signup</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://woomegle.com/login</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://woomegle.com/about</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://woomegle.com/contact</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://woomegle.com/privacy</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://woomegle.com/terms</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://woomegle.com/safety</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://woomegle.com/cookies</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://woomegle.com/guidelines</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
</urlset>`);
});

// In-memory location cache for GET /api/location (caches IP lookups for 24 hours)
const ipLocationCache = new Map();

// GET /api/location - Cached IP geolocation endpoint
app.get('/api/location', async (req, res) => {
  try {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[BACKEND /api/location] Client IP detected: ${clientIp}`);
    }

    // Check IP cache (24 hours expiry)
    if (clientIp && ipLocationCache.has(clientIp)) {
      const cached = ipLocationCache.get(clientIp);
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[BACKEND /api/location] Serving cached location for IP: ${clientIp}`, cached.data);
        }
        return res.json(cached.data);
      }
    }

    // Determine if IP is localhost or private, in which case ipwho.is without IP auto-detects server IP or defaults
    const isLocalhost = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
    const fetchUrl = isLocalhost ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[BACKEND /api/location] Fetching external geolocation from: ${fetchUrl}`);
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('External geolocation provider failed');

    const data = await response.json();
    const result = {
      countryCode: data.country_code || 'US',
      countryName: data.country || 'United States',
      ip: clientIp
    };

    if (clientIp) {
      ipLocationCache.set(clientIp, { data: result, timestamp: Date.now() });
    }

    return res.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[BACKEND /api/location ERROR]', error.message);
    }
    // Fallback to US if lookup fails
    return res.json({ countryCode: 'US', countryName: 'United States', ip: 'unknown', fallback: true });
  }
});

// Health check routes (/health and /api/health)
const healthHandler = (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Woomegle server is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Socket handler binding
const registerSocketHandlers = require('./socket/socketHandler');
registerSocketHandlers(io);

// 404 Middleware
app.use((req, res, next) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// 500 Error Handling & Crash reporting Middleware
app.use((err, req, res, next) => {
  console.error('[CRASH REPORT / ERROR]', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});
