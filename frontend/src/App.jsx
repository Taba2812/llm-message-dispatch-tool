import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    console.log('Send new message clicked');
    // Later: show form or navigate to another route
  };

  const handleReadPreviousMessages = () => {
    console.log('Read previous messages clicked');
    navigate('/messages');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>{welcomeMessage || 'LLM Message Dispatch Tool'}</h1>

      <div style={{ marginTop: '2rem' }}>
        <button onClick={handleSendNewMessage} style={{ marginRight: '1rem' }}>
          Send new message
        </button>
        <button onClick={handleReadPreviousMessages}>
          Previous messages
        </button>
      </div>
    </div>
  );
}

export default App;
