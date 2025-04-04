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

  const defaultModels = [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
  ]

  const handleMessageChange = (index, value) => {
    const updated = [...messages];
    updated[index].content = value;
    setMessages(updated);
  };

  const handleResponse = (messageId) => {
    //console.log(response.message_id)
    navigate(`/messages/${messageId}`);
  };

  const sendPayload = async (payload) => {
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
  }

  const handleSubmit = async () => {
    const payload = {
        models: [
            "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
          ],
        messages: messages,
        temperature: Math.min(1, Math.max(0, parseFloat(temperature))),
        max_tokens: null
    };

    sendPayload(payload);
  };

  const [file, setFile] = useState(null);
  const [payload, setPayload] = useState(null);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    console.log('File selected:', uploadedFile);
  };

  const handleUpload = async () => {
    if (!file) return alert('No file selected!');
    const reader = new FileReader();
    console.log(reader);
    reader.onload = (e) => {
      console.log("We are here!")
      try {
        const json = JSON.parse(e.target.result);
        const jsonModels = json.models;
        const jsonMessages = json.messages;
        const jsonTemperature = json.temperature || 1;
        const jsonMaxTokens = json.max_tokens || null;

        // Validation check: Ensure 'models' and 'messages' exist and are not empty
        if (!jsonModels || !jsonMessages || jsonModels.length === 0 || jsonMessages.length === 0) {
          alert("Invalid file. Please upload a valid JSON file with non-empty 'models' and 'messages'.");
          return;
        }

        console.log(json);
    
        const payload = {
          models: jsonModels,
          messages: jsonMessages,
          temperature: Math.min(1, Math.max(0, parseFloat(jsonTemperature))),
          max_tokens: jsonMaxTokens
        };
        setPayload(payload);
        sendPayload(payload);
      } catch (error) {
        alert('Error reading or parsing the file. Please upload a valid JSON file.');
      }
    };

    reader.readAsText(file);
  }

  return (
    <div>
      <h1 className="title">Send Message</h1>

      <div className="model">
        <p>These models will be used:</p>
        {defaultModels.map((item, index) => (
          <li className="model" key={index}>{item}</li>
        ))}
      </div>

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
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
        <div className="item">Temperature: <strong>{temperature} [Min: 0, Max: 1]</strong></div>
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>

      <div className="model">
        <p>If you know what you are doing, you can upload your own JSON file: </p>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>

      {response && (
        <div>
          <button onClick={() => handleResponse(response.message_id)}>See response</button>
        </div>
      )}
    </div>
  );
}

export default SendMessage;