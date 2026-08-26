import React, { useState, useEffect } from 'react';

const TMDB_API_KEY = '07d3978b5882d68e296023f77ae46c95';

export default function App() {
  const [query, setQuery] = useState('Inception');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  // View states
  const [hasChosenMovie, setHasChosenMovie] = useState(false);
  const [isAmbientDimmed, setIsAmbientDimmed] = useState(false);
  
  // Extended film metadata
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState('');
  const [runtime, setRuntime] = useState(null);
  const [genres, setGenres] = useState([]);
  const [budget, setBudget] = useState(0);
  const [imdbId, setImdbId] = useState('');
  const [trailerKey, setTrailerKey] = useState(null);
  const [activeTab, setActiveTab] = useState('stream');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lock scrolling globally on mounted body and html tags
  useEffect(() => {
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#14181c';
    document.body.style.color = '#9ab';
    document.body.style.fontFamily = 'Graphik-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }, []);

  // Search API call fetching top TWO matches
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSelectedMovie(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        );
        const searchData = await searchRes.json();

        if (cancelled) return;

        if (!searchData.results || searchData.results.length === 0) {
          setSearchResults([]);
          setSelectedMovie(null);
          setError('NO RESULTS FOUND');
          return;
        }

        const topTwo = searchData.results.slice(0, 2);
        setSearchResults(topTwo);
        setSelectedMovie(topTwo[0]);
      } catch (err) {
        if (!cancelled) {
          setError('ERROR LOADING FILM DATA');
          setSearchResults([]);
          setSelectedMovie(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Deep details API call
  useEffect(() => {
    if (!selectedMovie?.id) return;

    let cancelled = false;

    async function fetchDeepDetails() {
      try {
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/movie/${selectedMovie.id}?api_key=${TMDB_API_KEY}`
        );
        const detailData = await detailRes.json();

        const creditsRes = await fetch(
          `https://api.themoviedb.org/3/movie/${selectedMovie.id}/credits?api_key=${TMDB_API_KEY}`
        );
        const creditsData = await creditsRes.json();

        const videosRes = await fetch(
          `https://api.themoviedb.org/3/movie/${selectedMovie.id}/videos?api_key=${TMDB_API_KEY}`
        );
        const videosData = await videosRes.json();

        if (cancelled) return;

        setRuntime(detailData.runtime || null);
        setGenres(detailData.genres || []);
        setBudget(detailData.budget || 0);
        setImdbId(detailData.imdb_id || '');

        if (creditsData.cast) setCast(creditsData.cast.slice(0, 5));

        const dirObj = creditsData.crew?.find((c) => c.job === 'Director');
        setDirector(dirObj ? dirObj.name : '');

        const officialTrailer = videosData.results?.find(
          (v) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        setTrailerKey(officialTrailer ? officialTrailer.key : null);
      } catch (err) {
        // Fallback on network error
      }
    }

    fetchDeepDetails();
    return () => {
      cancelled = true;
    };
  }, [selectedMovie]);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setHasChosenMovie(true);
  };

  const handleBackToSearch = () => {
    setHasChosenMovie(false);
    setIsAmbientDimmed(false);
  };

  const formatCurrency = (val) => {
    if (!val) return null;
    return `$${(val / 1000000).toFixed(1)}M`;
  };

  const renderStars = (voteAverage) => {
    if (!voteAverage) return null;
    const stars = Math.round(voteAverage) / 2;
    const fullStars = Math.floor(stars);
    const hasHalf = stars % 1 !== 0;
    
    return (
      <span style={styles.starRating} title={`${voteAverage.toFixed(1)} / 10`}>
        {'★'.repeat(fullStars)}
        {hasHalf ? '½' : ''}
      </span>
    );
  };

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        html, body {
          overflow: hidden !important;
          height: 100% !important;
          touch-action: none;
        }
        .two-poster-container {
          display: flex;
          gap: 12px;
          width: 100%;
          max-width: 360px;
          justify-content: center;
        }
        .lb-poster-card {
          position: relative;
          box-sizing: border-box;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          flex: 1;
          max-width: 170px;
          transition: border-color 0.15s ease, transform 0.15s ease;
          border: 2px solid transparent;
        }
        .lb-poster-card:hover {
          border-color: #00e054 !important;
          transform: translateY(-2px);
        }
        .lb-input:focus {
          border-color: #ff8000 !important;
          color: #fff !important;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: #678;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 6px 12px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
        }
        .tab-btn.active {
          color: #fff;
          border-bottom-color: #00e054;
        }
        .dim-toggle-btn {
          background: #2c3440;
          border: 1px solid #456;
          color: #9ab;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dim-toggle-btn:hover {
          color: #fff;
          border-color: #00e054;
        }
        .back-btn {
          background: transparent;
          border: 1px solid #456;
          color: #9ab;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 5px 12px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .back-btn:hover {
          border-color: #ff8000;
          color: #fff;
        }
        .ext-link {
          color: #9ab;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 6px;
          border-radius: 3px;
          background: #242c34;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.15s ease;
        }
        .ext-link:hover {
          color: #fff;
          border-color: #00e054;
        }
      `}</style>

      <main
        style={{
          ...styles.contentContainer,
          justifyContent: hasChosenMovie ? 'flex-start' : 'center',
        }}
      >
        {/* SELECTION PHASE */}
        {!hasChosenMovie && (
          <div style={styles.centeredSearchBlock}>
            <div style={styles.searchSection}>
              <input
                type="text"
                className="lb-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SEARCH FILM TITLE..."
                style={styles.input}
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="two-poster-container">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="lb-poster-card"
                    onClick={() => handleSelectMovie(item)}
                    style={{
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={item.title}
                        style={styles.posterImage}
                      />
                    ) : (
                      <div style={styles.missingPoster}>NO POSTER</div>
                    )}
                    <div style={styles.cardTitle}>{item.title}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.centeredPlaceholder}>
                {loading ? 'SEARCHING CATALOG...' : error || 'TYPE A MOVIE TITLE TO BEGIN'}
              </div>
            )}
          </div>
        )}

        {/* MOVIE VIEW PHASE */}
        {hasChosenMovie && selectedMovie && (
          <div style={styles.viewContainer}>
            
            {/* Controls Bar */}
            <div
              style={{
                ...styles.controlsBar,
                opacity: isAmbientDimmed ? 0.15 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <button className="back-btn" onClick={handleBackToSearch}>
                ← SEARCH
              </button>

              <button
                className="dim-toggle-btn"
                onClick={() => setIsAmbientDimmed(!isAmbientDimmed)}
              >
                {isAmbientDimmed ? 'UNDIM' : 'AMBIENT DIM'}
              </button>
            </div>

            {/* Media Player Tabs */}
            <div
              style={{
                ...styles.tabContainer,
                opacity: isAmbientDimmed ? 0.15 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <button
                className={`tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
                onClick={() => setActiveTab('stream')}
              >
                FEATURE FILM
              </button>
              {trailerKey && (
                <button
                  className={`tab-btn ${activeTab === 'trailer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('trailer')}
                >
                  OFFICIAL TRAILER
                </button>
              )}
            </div>

            {/* Video Viewport */}
            <div style={styles.viewportFrame}>
              {activeTab === 'stream' ? (
                <iframe
                  key={`stream-${selectedMovie.id}`}
                  src={`https://vidfast.vc/movie/${selectedMovie.id}`}
                  style={styles.iframe}
                  frameBorder="0"
                  allowFullScreen
                  allow="encrypted-media"
                  title={selectedMovie.title}
                />
              ) : (
                <iframe
                  key={`trailer-${trailerKey}`}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                  style={styles.iframe}
                  frameBorder="0"
                  allowFullScreen
                  allow="encrypted-media; autoplay"
                  title={`${selectedMovie.title} Trailer`}
                />
              )}
            </div>

            {/* Compact Metadata Panel */}
            <article
              style={{
                ...styles.metadataPanel,
                opacity: isAmbientDimmed ? 0.15 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <header style={styles.metaHeader}>
                <div>
                  <h1 style={styles.titleText}>
                    {selectedMovie.title}
                    {selectedMovie.release_date && (
                      <span style={styles.releaseYear}>
                        {selectedMovie.release_date.substring(0, 4)}
                      </span>
                    )}
                  </h1>
                  {director && (
                    <div style={styles.directorSubline}>
                      DIRECTED BY <span style={styles.directorName}>{director.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {selectedMovie.vote_average > 0 && (
                  <div style={styles.ratingBadge}>
                    {renderStars(selectedMovie.vote_average)}
                  </div>
                )}
              </header>

              {/* Specs */}
              <div style={styles.specsRow}>
                {runtime && <span style={styles.specItem}>{runtime} MINS</span>}
                {genres.length > 0 && (
                  <span style={styles.specItem}>
                    {genres.map((g) => g.name.toUpperCase()).join(' · ')}
                  </span>
                )}
                {budget > 0 && (
                  <span style={styles.specItem}>BUDGET {formatCurrency(budget)}</span>
                )}
              </div>

              {/* Synopsis */}
              {selectedMovie.overview && (
                <p style={styles.synopsis}>{selectedMovie.overview}</p>
              )}

              {/* Cast List */}
              {cast.length > 0 && (
                <div style={styles.castRow}>
                  <span style={styles.sectionHeading}>CAST</span>
                  <div style={styles.castList}>
                    {cast.map((c) => (
                      <span key={c.id} style={styles.castPill}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Externals */}
              <div style={styles.externalLinksRow}>
                <span style={styles.sectionHeading}>EXTERNALS</span>
                <div style={styles.linksFlex}>
                  {imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${imdbId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ext-link"
                    >
                      IMDb ↗
                    </a>
                  )}
                  <a
                    href={`https://letterboxd.com/tmdb/${selectedMovie.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ext-link"
                  >
                    LETTERBOXD ↗
                  </a>
                </div>
              </div>
            </article>

          </div>
        )}

      </main>
    </div>
  );
}

const styles = {
  pageWrapper: {
    height: '100vh',
    height: '100dvh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 16px',
    boxSizing: 'border-box',
    backgroundColor: '#14181c',
    overflow: 'hidden',
  },
  contentContainer: {
    width: '100%',
    maxWidth: '720px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
  },
  centeredSearchBlock: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    margin: 'auto 0',
  },
  searchSection: {
    width: '100%',
    maxWidth: '360px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '3px',
    backgroundColor: '#2c3440',
    border: '1px solid #456',
    color: '#9ab',
    textAlign: 'center',
    fontSize: '12px',
    letterSpacing: '0.08em',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
  },
  posterImage: {
    width: '100%',
    aspectRatio: '2 / 3',
    objectFit: 'cover',
    display: 'block',
  },
  missingPoster: {
    width: '100%',
    aspectRatio: '2 / 3',
    backgroundColor: '#1b2228',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    letterSpacing: '0.05em',
    color: '#678',
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: '500',
    padding: '4px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    color: '#9ab',
    backgroundColor: '#1b2228',
    boxSizing: 'border-box',
  },
  centeredPlaceholder: {
    color: '#678',
    fontSize: '11px',
    letterSpacing: '0.08em',
    fontWeight: '600',
  },
  viewContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflow: 'hidden',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexShrink: 0,
  },
  tabContainer: {
    display: 'flex',
    gap: '6px',
    alignSelf: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    width: '100%',
    flexShrink: 0,
  },
  viewportFrame: {
    width: '100%',
    aspectRatio: '16 / 9',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#11161b',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    flexShrink: 0,
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  metadataPanel: {
    width: '100%',
    backgroundColor: '#1b2228',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '4px',
    padding: '12px 16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    flexGrow: 0,
  },
  metaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  titleText: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  releaseYear: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#678',
    marginLeft: '8px',
  },
  directorSubline: {
    fontSize: '10px',
    letterSpacing: '0.06em',
    color: '#678',
    marginTop: '2px',
    fontWeight: '600',
  },
  directorName: {
    color: '#9ab',
  },
  ratingBadge: {
    display: 'flex',
    alignItems: 'center',
  },
  starRating: {
    color: '#00e054',
    fontSize: '15px',
    letterSpacing: '1px',
  },
  specsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    fontSize: '10px',
    letterSpacing: '0.06em',
    color: '#00e054',
    fontWeight: '700',
  },
  specItem: {
    backgroundColor: 'rgba(0, 224, 84, 0.1)',
    padding: '2px 6px',
    borderRadius: '3px',
    border: '1px solid rgba(0, 224, 84, 0.2)',
  },
  synopsis: {
    margin: 0,
    fontSize: '12px',
    color: '#9ab',
    lineHeight: '1.45',
  },
  sectionHeading: {
    fontSize: '10px',
    letterSpacing: '0.08em',
    fontWeight: '700',
    color: '#678',
  },
  castRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '2px',
  },
  castList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  castPill: {
    backgroundColor: '#283038',
    color: '#c8d4e0',
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  externalLinksRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '8px',
    marginTop: '4px',
  },
  linksFlex: {
    display: 'flex',
    gap: '8px',
  },
};