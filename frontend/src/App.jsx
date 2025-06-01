import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => setWelcomeMessage(data.message));
  }, []);

  const handleSendNewMessage = () => {
    navigate('/send-message');
  };

  return (
    <div className="min-vh-100" style={{
      backgroundImage: 'url("/blob-haikei.png")',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      fontFamily: "'Poppins', sans-serif"
    }}>
      
      <Navbar />

      <div className="container">
        <div className="row align-items-center min-vh-75">
          <div className="col-lg-4">
            <div className="pe-lg-5">
              <h1 className="display-1 fw-bold mb-4" style={{
                color: '#2d5016',
                lineHeight: '1.1',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                <span style={{color: '#8b9dc3', fontWeight: '300'}}>YUMMY</span><br/>
                <span style={{color: '#2d5016'}}>RECIPES!</span>
              </h1>
              
              <p className="fs-5 mb-5" style={{color: '#666', maxWidth: '400px'}}>
                Generate delicious recipes with AI! Just tell us your ingredients and cooking preferences.
              </p>

              <button
                onClick={handleSendNewMessage}
                className="btn button-green btn-lg px-5 py-3 fw-semibold"
                style={{
                  textTransform: 'uppercase',
                }}
              >
                Generate Recipe <i className="bi bi-feather"></i>
              </button>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="position-relative" style={{ margin: '50px' }}>
              <div className="text-center">
                <img 
                  src="/4890447-Photoroom.png" 
                  alt="Pasta dish"
                  style={{ maxWidth: '100%' }}
                />                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
