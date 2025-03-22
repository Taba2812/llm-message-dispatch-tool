import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Message() {
  const [message, setMessage] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;
  let params = useParams();

  useEffect(() => {
    fetch(`${apiUrl}/messages/${params.messageId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessage(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });
  }, [params.messageId]);

  if (loading) return <p>Loading messages...</p>;
  if (!message) return <p>Message not found.</p>;


  return (
    <div>
      <h2>Message ID: {message._id}</h2>
      <h4>Temperature: {message.temperature}</h4>
      <h4>Max Tokens: {message.max_tokens}</h4>
      <h4>Timestamp: {new Date(message.timestamp).toLocaleString()}</h4>

      <h2>Prompt</h2>
      <ul>
        {message.messages.map((msg, index) => (
          <li key={index}>
            <strong>{msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}:</strong> {msg.content}
          </li>
        ))}
      </ul>

      <h2>Model Responses</h2>
  <ul>
    {message.responses.map((res, index) => (
      <li key={index}>
        <strong>{message.models?.[index] || 'Unknown Model'}:</strong> {res}
      </li>
    ))}
  </ul>
</div>
  );
  
  
}

export default Message;
