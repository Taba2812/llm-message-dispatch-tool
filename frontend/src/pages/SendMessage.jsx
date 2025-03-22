import React, { useState } from "react";

function SendMessage() {
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

  const handleSubmit = async () => {
    const payload = {
        models: [
            "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
          ],
      messages: messages.filter((msg) => msg.content.trim() !== ""),
      temperature: Math.min(2, Math.max(0, parseFloat(temperature))),
      max_tokens: null,
    };

    try {
      const res = await fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Failed to send message:", error);
      setResponse({ error: "Failed to send message." });
    }
  };

  return (
    <div>
      <h1>Send Message API</h1>

      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <label className="block text-sm font-medium mb-1">{msg.role.charAt(0).toUpperCase() + msg.role.slice(1) + " message "}</label>
            <input
              value={msg.content}
              onChange={(e) => handleMessageChange(i, e.target.value)}
              placeholder={`Enter ${msg.role} message`}
            />
          </div>
        ))}
      </div>

      <div>
        <label>Temperature (0 to 2)</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />
        <div className="text-sm mt-1">Current: {temperature}</div>
      </div>

      <button onClick={handleSubmit}>
        Send
      </button>

      {response && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Response:</h3>
          <pre className="whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SendMessage;