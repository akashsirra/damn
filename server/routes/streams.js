const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const FETCH_TIMEOUT_MS = 10000;

async function fetchJson(url) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    let data = {};

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

function getAddonBaseUrl(manifestUrl) {
  const cleanUrl = manifestUrl.trim();

  return cleanUrl.replace(
    /\/manifest\.json(?:\?.*)?$/i,
    ''
  );
}

function buildStreamUrl(manifestUrl, imdbId) {
  const baseUrl = getAddonBaseUrl(manifestUrl);

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error('Addon manifest URL must use HTTP or HTTPS');
  }

  return (
    `${baseUrl}/stream/movie/` +
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

    const results = await Promise.all(
      addons.map(async (addon) => {
        try {
          if (!addon.manifest_url) {
            throw new Error(
              'Addon has no manifest URL'
            );
          }

          const streamUrl = buildStreamUrl(
            addon.manifest_url,
            imdbId
          );

          console.log(
            `Fetching streams from ${addon.name}:`,
            streamUrl
          );

          const data = await fetchJson(streamUrl);

          return {
            addon_id: addon.id,
            addon_name: addon.name,
            streams: Array.isArray(data.streams)
              ? data.streams
              : [],
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
                ? 'Addon request timed out'
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