import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Navbar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?query=${encodeURIComponent(query.trim())}`)
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Midnight Reel</Link>
      <form className="navbar-search" onSubmit={handleSubmit}>
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="navbar-search-button">Search</button>
      </form>
      <Link to="/addons" className="navbar-link">Manage Addons</Link>
    </nav>
  )
}

export default Navbar
