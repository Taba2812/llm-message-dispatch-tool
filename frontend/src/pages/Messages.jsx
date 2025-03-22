import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Messages() {
  const [messageIds, setMessageIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL

  useEffect(() => {
    fetch(`${apiUrl}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessageIds(data.message_ids);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading messages...</p>;

  return (
    <div>
      <h2>Messages</h2>
      {messageIds.length === 0 ? (
        <p>No messages available</p>
      ) : (
        <ul>
          {messageIds.map((messageId) => (
            <li key={messageId}>
              <Link to={`/messages/${messageId}`}>{messageId}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
}

export default Messages;
