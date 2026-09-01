const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const FETCH_TIMEOUT_MS = 30000;

async function fetchJson(url) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS
  );

  try {
    console.log('Requesting addon:', url);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DAMN/1.0',
      },
    });

    const text = await response.text();

    console.log(
      `Addon response: HTTP ${response.status}`
    );

    let data;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `Addon returned invalid JSON (HTTP ${response.status})`
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `Addon returned HTTP ${response.status}`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function buildStreamUrl(manifestUrl, imdbId) {
  const cleanUrl = String(manifestUrl).trim();

  if (!/^https?:\/\//i.test(cleanUrl)) {
    throw new Error(
      `Invalid stored manifest URL: ${cleanUrl}`
    );
  }

  const manifestPath = cleanUrl.replace(
    /\/manifest\.json(?:\?.*)?$/i,
    ''
  );

  return (
    `${manifestPath}/stream/movie/` +
    `${encodeURIComponent(imdbId)}.json`
  );
}

// GET /api/streams/:imdbId
router.get('/:imdbId', async (req, res) => {
  const { imdbId } = req.params;

  if (!/^tt\d+$/.test(imdbId)) {
    return res.status(400).json({
      error: 'Invalid IMDb ID',
    });
  }

  try {
    const addonsResult = await pool.query(
      `SELECT *
       FROM addons
       WHERE 'stream' = ANY(resources)`
    );

    const addons = addonsResult.rows;

    if (addons.length === 0) {
      return res.json([]);
    }

    const results = await Promise.all(
      addons.map(async (addon) => {
        try {
          const streamUrl = buildStreamUrl(
            addon.manifest_url,
            imdbId
          );

          console.log(
            `Fetching "${addon.name}" streams`
          );

          const data = await fetchJson(streamUrl);

          const streams = Array.isArray(
            data.streams
          )
            ? data.streams
            : [];

          console.log(
            `"${addon.name}" returned ${streams.length} stream(s)`
          );

          return {
            addon_id: addon.id,
            addon_name: addon.name,
            streams,
          };
        } catch (err) {
          console.error(
            `Stream addon "${addon.name}" failed:`,
            err.message
          );

          return {
            addon_id: addon.id,
            addon_name: addon.name,
            streams: [],
            error:
              err.name === 'AbortError'
                ? 'Addon request timed out after 30 seconds'
                : err.message ||
                  'Failed to fetch from this addon',
          };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error(
      'Failed to fetch stream sources:',
      err
    );

    res.status(500).json({
      error: 'Failed to fetch stream sources',
    });
  }
});

module.exports = router;