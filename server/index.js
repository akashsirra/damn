const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    methods: ['GET', 'POST', 'DELETE'],
  })
);

app.use(
  express.json({
    limit: '1mb',
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
  });
});

app.use('/api/tmdb', require('./routes/tmdb'));
app.use('/api/addons', require('./routes/addons'));
app.use('/api/streams', require('./routes/streams'));

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON request body',
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `DAMN server running on port ${PORT} (${NODE_ENV})`
  );
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));