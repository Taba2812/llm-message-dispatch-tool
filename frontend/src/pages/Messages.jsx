import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL

  useEffect(() => {
    fetch(`${apiUrl}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });
  }, []);

  const handleBack = async () => {
    navigate("/");
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const truncate = (text, maxLength) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  if (loading) return <p>Loading messages...</p>;

  return (
    <div>
      <div>
        <button
          onClick={handleBack}
          style={{
            backgroundColor: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
        Home
        </button>
      </div>
      <h2>Messages</h2>
      {messages.length === 0 ? (
        <p>No messages available</p>
      ) : (
          messages.map((message) => (
            <div key={message.id}>
              <Link className='item' to={`/messages/${message.id}`}>
                [{formatTimestamp(message.timestamp)}] {truncate(message.preview, 32)}
              </Link>
            </div>
          ))
      )}
    </div>
  );
  
}

export default Messages;
