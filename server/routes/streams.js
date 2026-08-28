const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/streams/:imdbId - query all installed addons for stream sources
router.get('/:imdbId', async (req, res) => {
  const { imdbId } = req.params;

  try {
    const addonsResult = await pool.query("SELECT * FROM addons WHERE 'stream' = ANY(resources)");
    const addons = addonsResult.rows;

    const results = await Promise.all(
      addons.map(async (addon) => {
        try {
          // Derive base URL from manifest_url (strip manifest.json)
          const base = addon.manifest_url.replace(/\/manifest\.json$/, '');
          const streamUrl = `${base}/stream/movie/${imdbId}.json`;

          const response = await fetch(streamUrl);
          const data = await response.json();

          return {
            addon_id: addon.id,
            addon_name: addon.name,
            streams: data.streams || [],
          };
        } catch (err) {
          return {
            addon_id: addon.id,
            addon_name: addon.name,
            streams: [],
            error: 'Failed to fetch from this addon',
          };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stream sources' });
  }
});

module.exports = router;
