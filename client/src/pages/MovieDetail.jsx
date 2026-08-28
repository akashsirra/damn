import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import '../styles/moviedetail.css'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

function MovieDetail() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(`http://localhost:5000/api/tmdb/movie/${id}`)
        const data = await res.json()
        setMovie(data)

        if (data.imdb_id) {
          const streamsRes = await fetch(`http://localhost:5000/api/streams/${data.imdb_id}`)
          const streamsData = await streamsRes.json()
          setSources(streamsData)
        }
      } catch (err) {
        console.error('Failed to fetch movie details', err)
      } finally {
        setLoading(false)
        setSourcesLoading(false)
      }
    }
    fetchMovie()
  }, [id])

  if (loading) {
    return <div className="loading-screen">Loading the marquee...</div>
  }

  if (!movie) {
    return <div className="loading-screen">Movie not found.</div>
  }

  return (
    <div className="movie-detail-page">
      <div className="movie-detail-hero">
        {movie.backdrop_path && (
          <img
            src={`${TMDB_IMAGE_BASE}${movie.backdrop_path}`}
            alt={movie.title}
            className="movie-detail-backdrop"
          />
        )}
        <div className="movie-detail-info">
          {movie.poster_path && (
            <img
              src={`${TMDB_IMAGE_BASE}${movie.poster_path}`}
              alt={movie.title}
              className="movie-detail-poster"
            />
          )}
          <div className="movie-detail-text">
            <h1 className="movie-detail-title">{movie.title}</h1>
            <p className="movie-detail-overview">{movie.overview}</p>
            <p className="movie-detail-meta">
              {movie.release_date} · {movie.runtime ? `${movie.runtime} min` : ''} ·{' '}
              {movie.genres?.map((g) => g.name).join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="movie-detail-sources">
        <h2 className="movie-detail-sources-title">Sources</h2>
        {sourcesLoading ? (
          <p>Checking installed addons...</p>
        ) : sources.length === 0 ? (
          <p>No addons installed yet. Add some from the Manage Addons page.</p>
        ) : (
          sources.map((source) => (
            <div key={source.addon_id} className="source-block">
              <h3 className="source-addon-name">{source.addon_name}</h3>
              {source.error ? (
                <p className="source-error">{source.error}</p>
              ) : source.streams.length === 0 ? (
                <p className="source-empty">No streams found from this addon.</p>
              ) : (
                <ul className="source-stream-list">
                  {source.streams.map((stream, i) => (
                    <li key={i} className="source-stream-item">
                      {stream.title || stream.name || 'Unnamed stream'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MovieDetail
