import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="navbar">
      {!isHome && (
        <Link to="/" className="nav-btn home-btn">
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Home</span>
        </Link>
      )}

      <div className="nav-brand">
        <span className="brand-text">Comfort Journey</span>
      </div>

      <div className="nav-actions">
        <a
          href="https://www.irctc.co.in/eticketing/StationLinguisticNames"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn donate-btn"
        >
          <span className="nav-icon">❤️</span>
          <span className="nav-text">Donate</span>
        </a>
      </div>
    </nav>
  );
};