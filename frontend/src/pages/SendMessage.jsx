import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SendMessage() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "system", content: "" },
    { role: "user", content: "" },
  ]);
  const [temperature, setTemperature] = useState(0.5);
  const [response, setResponse] = useState(null);

  const handleMessageChange = (index, value) => {
    const updated = [...messages];
    updated[index].content = value;
    setMessages(updated);
  };

  const handleResponse = (messageId) => {
    //console.log(response.message_id)
    navigate(`/messages/${messageId}`);
  };

  const handleSubmit = async () => {
    const payload = {
        models: [
            "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
          ],
      messages: messages.filter((msg) => msg.content.trim() !== ""),
      temperature: Math.min(2, Math.max(0, parseFloat(temperature))),
      max_tokens: null
    };

    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Raw response was not valid JSON:", text);
        throw new Error("Invalid JSON returned from the server");
      }
      setResponse(data);
    } catch (error) {
      console.error("Failed to send message:", error);
      setResponse({ error: "Failed to send message." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="title">Send Message</h1>

      <div>
        {messages.map((msg, i) => (
          <div className="item" key={i}>
            <label>{msg.role.charAt(0).toUpperCase() + msg.role.slice(1) + " message "}</label>
            <input
              value={msg.content}
              onChange={(e) => handleMessageChange(i, e.target.value)}
              placeholder={`Enter ${msg.role} message`}
            />
          </div>
        ))}
      </div>

      <div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
        <div className="item">Temperature: <strong>{temperature} [Min: 0, Max: 2]</strong></div>
      </div>

      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Sending..." : "Send"}
      </button>

      {response && (
        <div>
          <button onClick={() => handleResponse(response.message_id)}>See response</button>
        </div>
      )}
    </div>
  );
}

export default SendMessage;