import { Link } from 'react-router-dom'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

function MovieCard({ movie }) {
  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
    : null

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card">
      <div className="movie-card-frame">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} className="movie-card-poster" />
        ) : (
          <div className="movie-card-placeholder">No Image</div>
        )}
        <div className="movie-card-perforations movie-card-perforations-left" />
        <div className="movie-card-perforations movie-card-perforations-right" />
      </div>
      <p className="movie-card-title">{movie.title}</p>
    </Link>
  )
}

export default MovieCard
