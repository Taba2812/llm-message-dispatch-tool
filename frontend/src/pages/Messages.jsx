import { useEffect, useState } from 'react';

function Messages() {
  const [messageIds, setMessageIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL

  useEffect(() => {
    fetch(apiUrl + "/messages") // Replace with your actual API endpoint
      .then((res) => res.json())
      .then((data) => {
        // Assuming the API response is of the shape you've shared
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
            <li key={messageId}>{messageId}</li> // Displaying the message ID
          ))}
        </ul>
      )}
    </div>
  );
}

export default Messages;
