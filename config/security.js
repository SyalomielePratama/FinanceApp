const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

// Middleware custom untuk sanitasi (pengganti xss-clean)
const sanitizeRequest = (req, res, next) => {
  const sanitize = (obj) => {
    for (let prop in obj) {
      if (typeof obj[prop] === 'string') {
        obj[prop] = obj[prop].replace(/<[^>]*>?/gm, ''); // hapus tag HTML
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        sanitize(obj[prop]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
};

// Rate limit: max 100 request per 15 menit per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.'
});

const securityMiddleware = (app) => {
  app.use(helmet());
  app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
  }));
  app.use(limiter);
  app.use(cookieParser());
  app.use(csurf({ cookie: true }));
  app.use(sanitizeRequest); // pengganti xss-clean
};

module.exports = securityMiddleware;
