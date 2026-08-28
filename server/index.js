const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tmdb', require('./routes/tmdb'));
app.use('/api/addons', require('./routes/addons'));
app.use('/api/streams', require('./routes/streams'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
