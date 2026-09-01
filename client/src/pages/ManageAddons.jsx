import { useEffect, useState } from 'react'
import '../styles/manageaddons.css'

const API_URL =
  import.meta.env.VITE_API_URL || 'https://damn-server.onrender.com'

function ManageAddons() {
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [manifestUrl, setManifestUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  async function fetchAddons() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/addons`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch addons')
      }

      const data = await res.json()

      setAddons(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch addons:', err)
      setError(err.message || 'Failed to fetch addons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddons()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    const url = manifestUrl.trim()

    if (!url) {
      setError('Please enter an addon manifest URL')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/addons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manifest_url: url,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add addon')
      }

      setManifestUrl('')
      await fetchAddons()
    } catch (err) {
      console.error('Failed to add addon:', err)
      setError(err.message || 'Failed to add addon')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (deletingId) return

    setDeletingId(id)
    setError('')

    try {
      const res = await fetch(
        `${API_URL}/api/addons/${id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data.error || 'Failed to remove addon'
        )
      }

      setAddons((prev) =>
        prev.filter((addon) => addon.id !== id)
      )
    } catch (err) {
      console.error('Failed to delete addon:', err)
      setError(err.message || 'Failed to remove addon')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="addons-page">
      <h1 className="addons-title">Manage Addons</h1>

      <form
        className="addons-form"
        onSubmit={handleSubmit}
      >
        <input
          type="url"
          className="addons-input"
          placeholder="Paste a Stremio addon manifest URL..."
          value={manifestUrl}
          onChange={(e) => setManifestUrl(e.target.value)}
          disabled={submitting}
        />

        <button
          type="submit"
          className="addons-submit"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Addon'}
        </button>
      </form>

      {error && (
        <p
          className="addons-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="addon-card">
          <div className="skeleton addon-skeleton-name" />
          <div className="skeleton addon-skeleton-line" />
        </div>
      ) : addons.length === 0 ? (
        <p className="addons-empty">
          No addons installed yet.
        </p>
      ) : (
        <div className="addons-list">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="addon-card"
            >
              <div className="addon-card-info">
                <h3 className="addon-card-name">
                  {addon.name}
                </h3>

                {addon.description && (
                  <p className="addon-card-description">
                    {addon.description}
                  </p>
                )}

                <p className="addon-card-meta">
                  {addon.category || 'Addon'}
                  {addon.resources?.length
                    ? ` · ${addon.resources.join(', ')}`
                    : ''}
                </p>
              </div>

              <button
                className="addon-card-remove"
                onClick={() =>
                  handleDelete(addon.id)
                }
                disabled={
                  deletingId === addon.id
                }
              >
                {deletingId === addon.id
                  ? 'Removing...'
                  : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManageAddons