import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg py-3" style={{ background: 'transparent' }}>
      <div className="container">
        <a className="navbar-brand d-flex align-items-center" href="/">
          <img 
            src="/54de71e6cf08137905971b9cdb41f1f2-Photoroom.png" 
            alt="RecipeAI logo" 
            style={{ height: '100px', marginRight: '10px' }} 
          />
          <span className="fw-bold fs-2" style={{ color: '#2d5016' }}>
            RecipeAI
          </span>
        </a>
        <div className="navbar-nav ms-auto">
          <button 
            onClick={() => navigate("/messages")}
            className="nav-link mx-3 btn btn-link p-0 border-0"
          >
            MY RECIPES
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
