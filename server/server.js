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

// Import API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

// Bind API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

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
