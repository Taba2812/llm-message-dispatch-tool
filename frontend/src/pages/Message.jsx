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
      <div><strong className='item'>Message ID </strong><strong>{message._id}</strong></div>
      <div><strong className='item'>Temperature </strong><strong>{message.temperature}</strong></div>
      <div><strong className='item'>Max Tokens </strong><strong>{message.max_tokens || "No limit"}</strong></div>
      <div><strong className='item'>Timestamp </strong><strong>{new Date(message.timestamp).toLocaleString()}</strong></div>


      <h2>Prompt</h2>
        {message.messages.map((msg, index) => (
          <div key={index}>
            <strong className='item'>{msg.role.charAt(0).toUpperCase() + msg.role.slice(1) + " message"}:</strong> <strong>{msg.content}</strong>
          </div>
        ))}

      <h2>Model Responses</h2>
  <ul>
    {message.responses.map((res, index) => (
      <li key={index}>
        <strong className='item'>{message.models?.[index] || 'Unknown Model'}:</strong><strong> {res}</strong>
      </li>
    ))}
  </ul>
</div>
  );
  
  
}

export default Message;
