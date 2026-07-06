import { useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound">
      <div className="notfound-card">
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-text">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <button className="notfound-btn" onClick={() => navigate('/')}>
          Back to sign in
        </button>
      </div>
    </div>
  );
}

export default NotFound;