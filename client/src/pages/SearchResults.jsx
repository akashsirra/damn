import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import '../styles/searchresults.css'

function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!query) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    async function fetchResults() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/tmdb/search?query=${encodeURIComponent(query)}`
        )
        const data = await res.json()
        setResults(data.results || [])
      } catch (err) {
        console.error('Failed to fetch search results', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [query])

  return (
    <div className="search-page">
      <h1 className="search-title">Results for "{query}"</h1>

      {loading ? (
        <p className="search-loading">Searching the archives...</p>
      ) : results.length === 0 ? (
        <p className="search-empty">No movies found.</p>
      ) : (
        <div className="search-grid">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchResults
