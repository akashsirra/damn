import { useEffect, useState } from 'react'
import '../styles/manageaddons.css'

function ManageAddons() {
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [manifestUrl, setManifestUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchAddons() {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/addons')
      const data = await res.json()
      setAddons(data)
    } catch (err) {
      console.error('Failed to fetch addons', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddons()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!manifestUrl.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest_url: manifestUrl.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add addon')
      }
      setManifestUrl('')
      await fetchAddons()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`http://localhost:5000/api/addons/${id}`, {
        method: 'DELETE',
      })
      setAddons((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete addon', err)
    }
  }

  return (
    <div className="addons-page">
      <h1 className="addons-title">Manage Addons</h1>

      <form className="addons-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="addons-input"
          placeholder="Paste a Stremio addon manifest URL..."
          value={manifestUrl}
          onChange={(e) => setManifestUrl(e.target.value)}
        />
        <button type="submit" className="addons-submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Addon'}
        </button>
      </form>

      {error && <p className="addons-error">{error}</p>}

      {loading ? (
        <p className="addons-loading">Loading addons...</p>
      ) : addons.length === 0 ? (
        <p className="addons-empty">No addons installed yet.</p>
      ) : (
        <div className="addons-list">
          {addons.map((addon) => (
            <div key={addon.id} className="addon-card">
              <div className="addon-card-info">
                <h3 className="addon-card-name">{addon.name}</h3>
                <p className="addon-card-description">{addon.description}</p>
                <p className="addon-card-meta">
                  {addon.category} · {addon.resources?.join(', ')}
                </p>
              </div>
              <button
                className="addon-card-remove"
                onClick={() => handleDelete(addon.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManageAddons
