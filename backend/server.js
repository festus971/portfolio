require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ──────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// CORS — allow your frontend domain
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
}));

// Rate limiting — 5 contact submissions per IP per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting — 60 log events per IP per minute
const logLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── MongoDB Schemas ──────────────────────────────────────────────
const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true, maxlength: 200 },
  email:     { type: String, required: true, maxlength: 200 },
  subject:   { type: String, required: true, maxlength: 300 },
  message:   { type: String, required: true, maxlength: 5000 },
  ip:        { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const interactionSchema = new mongoose.Schema({
  event:     { type: String, required: true, maxlength: 100 },
  page:      { type: String, maxlength: 500 },
  referrer:  { type: String, maxlength: 500 },
  userAgent: { type: String, maxlength: 500 },
  ip:        { type: String },
  meta:      { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

// Auto-expire interaction logs after 90 days
interactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

const Contact = mongoose.model('Contact', contactSchema);
const Interaction = mongoose.model('Interaction', interactionSchema);

// ── Email transporter ────────────────────────────────────────────
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_PASS.includes('your_')) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify()
    .then(() => console.log('✅ Email transporter ready'))
    .catch(err => console.error('⚠️  Email config error:', err.message));
} else {
  console.warn('⚠️  Email not configured — form submissions will be saved but emails won\'t send');
}

// ── Routes ───────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/contact — receive contact form
app.post('/api/contact',
  contactLimiter,
  [
    body('name').trim().notEmpty().isLength({ max: 200 }).escape(),
    body('email').trim().isEmail().normalizeEmail().isLength({ max: 200 }),
    body('subject').trim().notEmpty().isLength({ max: 300 }).escape(),
    body('message').trim().notEmpty().isLength({ max: 5000 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    try {
      // Save to database
      const contact = await Contact.create({
        name,
        email,
        subject,
        message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Send email notification
      if (transporter) {
        await transporter.sendMail({
          from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          replyTo: email,
          subject: `[Portfolio] ${subject}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#4ade80;">New Portfolio Contact</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px;font-weight:bold;color:#666;">Name</td><td style="padding:8px;">${name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;color:#666;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:8px;font-weight:bold;color:#666;">Subject</td><td style="padding:8px;">${subject}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#f4f4f4;border-radius:8px;">
                <p style="white-space:pre-wrap;">${message}</p>
              </div>
              <p style="margin-top:16px;font-size:12px;color:#999;">
                Sent from your portfolio website • ${new Date().toLocaleString()}
              </p>
            </div>
          `,
        });
      }

      res.status(201).json({ success: true, id: contact._id });
    } catch (err) {
      console.error('Contact error:', err);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
);

// POST /api/log — log site interactions
app.post('/api/log',
  logLimiter,
  [
    body('event').trim().notEmpty().isLength({ max: 100 }),
    body('page').optional().trim().isLength({ max: 500 }),
    body('referrer').optional().trim().isLength({ max: 500 }),
    body('meta').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    try {
      await Interaction.create({
        event: req.body.event,
        page: req.body.page,
        referrer: req.body.referrer,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        meta: req.body.meta,
      });
      res.status(201).json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to log interaction' });
    }
  }
);

// GET /api/contacts — view all submissions (basic admin, protect in production)
app.get('/api/contacts', async (req, res) => {
  const key = req.query.key;
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
  res.json(contacts);
});

// GET /api/interactions — view logged events
app.get('/api/interactions', async (req, res) => {
  const key = req.query.key;
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const logs = await Interaction.find().sort({ createdAt: -1 }).limit(200);
  res.json(logs);
});

// ── Connect to MongoDB and start server ──────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
