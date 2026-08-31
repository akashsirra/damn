const express = require('express');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

async function tmdbFetch(path) {
  if (!API_KEY) {
    const error = new Error('TMDB_API_KEY is not configured');
    error.status = 500;
    throw error;
  }

  const separator = path.includes('?') ? '&' : '?';

  const response = await fetch(
    `${TMDB_BASE}${path}${separator}api_key=${API_KEY}`
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.status_message || 'TMDB request failed'
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

// GET /api/tmdb/trending
router.get('/trending', async (req, res) => {
  try {
    res.json(await tmdbFetch('/trending/movie/week'));
  } catch (err) {
    console.error('TMDB trending error:', err);
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Failed to fetch trending movies' });
  }
});

// GET /api/tmdb/popular
router.get('/popular', async (req, res) => {
  try {
    res.json(await tmdbFetch('/movie/popular'));
  } catch (err) {
    console.error('TMDB popular error:', err);
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Failed to fetch popular movies' });
  }
});

// GET /api/tmdb/search?query=...
router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query || !query.trim()) {
    return res.status(400).json({
      error: 'Missing query parameter',
    });
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim());

    res.json(
      await tmdbFetch(`/search/movie?query=${encodedQuery}`)
    );
  } catch (err) {
    console.error('TMDB search error:', err);
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Failed to search movies' });
  }
});

// GET /api/tmdb/movie/:id
router.get('/movie/:id', async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid movie id',
    });
  }

  try {
    res.json(
      await tmdbFetch(
        `/movie/${id}?append_to_response=external_ids`
      )
    );
  } catch (err) {
    console.error('TMDB movie error:', err);
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Failed to fetch movie details' });
  }
});

module.exports = router;