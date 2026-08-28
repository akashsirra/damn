const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/addons - list all installed addons
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addons ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch addons' });
  }
});

// POST /api/addons - add a new addon by manifest URL
router.post('/', async (req, res) => {
  const { manifest_url } = req.body;
  if (!manifest_url) {
    return res.status(400).json({ error: 'Missing manifest_url' });
  }
  try {
    // Fetch and validate the manifest
    const response = await fetch(manifest_url);
    const manifest = await response.json();

    // Resources can be plain strings (e.g. "catalog") or objects
    // (e.g. { name: "stream", types: [...], idPrefixes: [...] })
    // per the Stremio addon spec. Normalize to plain resource names.
    const normalizedResources = (manifest.resources || []).map((r) =>
      typeof r === 'string' ? r : r.name
    );

    const result = await pool.query(
      `INSERT INTO addons (name, description, category, manifest_url, resources, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        manifest.name || 'Unnamed Addon',
        manifest.description || '',
        manifest.types ? manifest.types.join(',') : '',
        manifest_url,
        normalizedResources,
        'local',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add addon' });
  }
});

// DELETE /api/addons/:id - remove an addon
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM addons WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove addon' });
  }
});

module.exports = router;
