const express = require('express');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// GET /api/tmdb/trending
router.get('/trending', async (req, res) => {
  try {
    const response = await fetch(
      `${TMDB_BASE}/trending/movie/week?api_key=${API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// GET /api/tmdb/popular
router.get('/popular', async (req, res) => {
  try {
    const response = await fetch(
      `${TMDB_BASE}/movie/popular?api_key=${API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

// GET /api/tmdb/search?query=...
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }
  try {
    const response = await fetch(
      `${TMDB_BASE}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// GET /api/tmdb/movie/:id
router.get('/movie/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(
      `${TMDB_BASE}/movie/${id}?api_key=${API_KEY}&append_to_response=external_ids`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

module.exports = router;
