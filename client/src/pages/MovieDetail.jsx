import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import '../styles/moviedetail.css'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

function getStreamLink(stream) {
  if (stream.url) return stream.url
  if (stream.externalUrl) return stream.externalUrl
  if (stream.infoHash) {
    const dn = encodeURIComponent(stream.title || stream.name || 'stream')
    return `magnet:?xt=urn:btih:${stream.infoHash}&dn=${dn}`
  }
  return null
}

function isPlayableUrl(stream) {
  return Boolean(stream.url)
}

function MovieDetailSkeleton() {
  return (
    <div className="movie-detail-page">
      <div className="movie-detail-hero">
        <div className="skeleton movie-detail-skeleton-backdrop" />
        <div className="movie-detail-info">
          <div className="skeleton movie-detail-skeleton-poster" />
          <div className="movie-detail-text">
            <div className="skeleton movie-detail-skeleton-title" />
            <div className="skeleton movie-detail-skeleton-line" />
            <div className="skeleton movie-detail-skeleton-line" />
            <div className="skeleton movie-detail-skeleton-line-short" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MovieDetail() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [nowPlaying, setNowPlaying] = useState(null)
  const playerRef = useRef(null)

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(`https://damn-server.onrender.com/api/tmdb/movie/${id}`)
        const data = await res.json()
        setMovie(data)

        if (data.imdb_id) {
          const streamsRes = await fetch(`https://damn-server.onrender.com/api/streams/${data.imdb_id}`)
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

  function handlePlay(stream, label) {
    setNowPlaying({ url: stream.url, label })
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  if (loading) {
    return <MovieDetailSkeleton />
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

      {nowPlaying && (
        <div className="movie-player-block" ref={playerRef}>
          <h2 className="movie-player-title">Now Playing: {nowPlaying.label}</h2>
          <video
            className="movie-player-video"
            src={nowPlaying.url}
            controls
            autoPlay
          />
        </div>
      )}

      <div className="movie-detail-sources">
        <h2 className="movie-detail-sources-title">Sources</h2>
        {sourcesLoading ? (
          <div className="source-block">
            <div className="skeleton source-skeleton-name" />
            <div className="skeleton source-skeleton-line" />
            <div className="skeleton source-skeleton-line" />
          </div>
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
                  {source.streams.map((stream, i) => {
                    const link = getStreamLink(stream)
                    const label = stream.title || stream.name || 'Unnamed stream'
                    const playable = isPlayableUrl(stream)
                    return (
                      <li key={i} className="source-stream-item">
                        {playable ? (
                          <button
                            className="source-stream-play"
                            onClick={() => handlePlay(stream, label)}
                          >
                            ▶ {label}
                          </button>
                        ) : link ? (
                          <a
                            href={link}
                            className="source-stream-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {label}
                          </a>
                        ) : (
                          <span className="source-stream-unlinked">{label}</span>
                        )}
                      </li>
                    )
                  })}
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