require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60000, max: 200 });
app.use('/api/', limiter);

app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/analytics',    require('./routes/analytics'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UPI Fraud API running', timestamp: new Date() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 API running   → http://localhost:${PORT}`);
  console.log(`🏦 Bank dashboard → open bank/index.html`);
  console.log(`👤 Customer UI    → open customer/index.html\n`);
});