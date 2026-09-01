const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const FETCH_TIMEOUT_MS = 8000;

function isSafeAddonUrl(value) {
  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function fetchManifest(manifestUrl) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(manifestUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Manifest request failed (${response.status})`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// GET /api/addons
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addons ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch addons:', err);

    res.status(500).json({
      error: 'Failed to fetch addons',
    });
  }
});

// POST /api/addons
router.post('/', async (req, res) => {
  const { manifest_url } = req.body;

  if (
    !manifest_url ||
    typeof manifest_url !== 'string'
  ) {
    return res.status(400).json({
      error: 'manifest_url is required',
    });
  }

  const normalizedUrl = manifest_url.trim();

  if (!isSafeAddonUrl(normalizedUrl)) {
    return res.status(400).json({
      error: 'Invalid or unsafe manifest URL',
    });
  }

  try {
    const manifest =
      await fetchManifest(normalizedUrl);

    if (
      !manifest ||
      typeof manifest !== 'object' ||
      Array.isArray(manifest)
    ) {
      return res.status(400).json({
        error: 'Invalid addon manifest',
      });
    }

    if (
      !manifest.name ||
      typeof manifest.name !== 'string'
    ) {
      return res.status(400).json({
        error:
          'Addon manifest is missing a valid name',
      });
    }

    const resources = Array.isArray(
      manifest.resources
    )
      ? manifest.resources
      : [];

    const category =
      manifest.type ||
      manifest.categories?.[0] ||
      'General';

    const existing = await pool.query(
      'SELECT id FROM addons WHERE manifest_url = $1',
      [normalizedUrl]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'This addon is already installed',
      });
    }

    const result = await pool.query(
      `INSERT INTO addons (
        name,
        manifest_url,
        category,
        resources
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        manifest.name.trim(),
        normalizedUrl,
        category,
        resources,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(
      'Failed to install addon:',
      err
    );

    if (err.name === 'AbortError') {
      return res.status(504).json({
        error:
          'Addon manifest request timed out',
      });
    }

    res.status(400).json({
      error:
        err.message ||
        'Failed to install addon',
    });
  }
});

// DELETE /api/addons/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({
      error: 'Invalid addon id',
    });
  }

  try {
    const result = await pool.query(
      'DELETE FROM addons WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Addon not found',
      });
    }

    res.json({
      message: 'Addon removed successfully',
      addon: result.rows[0],
    });
  } catch (err) {
    console.error(
      'Failed to delete addon:',
      err
    );

    res.status(500).json({
      error: 'Failed to delete addon',
    });
  }
});

module.exports = router;