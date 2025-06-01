import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

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
  const [file, setFile] = useState(null);

  const defaultModels = [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
  ];

  const handleMessageChange = (index, value) => {
    const updated = [...messages];
    updated[index].content = value;
    setMessages(updated);
  };

  const handleResponse = (messageId) => {
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
  };

  const handleSubmit = async () => {
    const payload = {
      models: defaultModels,
      messages: messages,
      temperature: Math.min(1, Math.max(0, parseFloat(temperature))),
      max_tokens: null
    };
    sendPayload(payload);
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
  };

  const handleUpload = async () => {
    if (!file) return alert('No file selected!');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const { models, messages, temperature, max_tokens } = json;

        if (!models || !messages || models.length === 0 || messages.length === 0) {
          alert("Invalid file. Please include 'models' and 'messages'.");
          return;
        }

        const payload = {
          models,
          messages,
          temperature: Math.min(1, Math.max(0, parseFloat(temperature || 1))),
          max_tokens: max_tokens || null
        };

        sendPayload(payload);
      } catch (error) {
        alert('Invalid JSON file.');
      }
    };

    reader.readAsText(file);
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
      <div className="container pb-5 px-4">

        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Generate Recipe</li>
          </ol>
        </nav>

        <h2 className="fw-bold" style={{ color: '#2d5016' }}>Tell Us What You Have in the Fridge</h2>
        <strong className="fw-bold" style={{ color: '#8b9dc3' }}>Turn your leftovers into a tasty meal!</strong>

        <div className="row align-items-center">
          <div className="col-md-7">
            <div className="card shadow-lg">
              <div className="row g-0">
                <div className="col-md-6 p-4">
                  {messages.map((msg, i) => (
                    <div key={i} className="mb-4">
                      <label className="form-label">
                        {msg.role.charAt(0).toUpperCase() + msg.role.slice(1)} message
                      </label>
                      {msg.role === "user" ? (
                        <textarea
                          className="form-control"
                          rows="5"
                          value={msg.content}
                          onChange={(e) => handleMessageChange(i, e.target.value)}
                          placeholder="Write your prompt here..."
                        />
                      ) : (
                        <input
                          className="form-control border-0 border-bottom"
                          value={msg.content}
                          onChange={(e) => handleMessageChange(i, e.target.value)}
                          placeholder={`Enter ${msg.role} message`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="col-md-6 p-4 border-start">
                  <div className="mb-3">
                    <label className="form-label">
                      Temperature: <strong>{temperature}</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="form-range"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Upload JSON</label>
                    <input type="file" className="form-control mb-2" onChange={handleFileChange} />
                    <button
                      className="btn button-purple w-100"
                      onClick={handleUpload}
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Upload + Send"}
                    </button>
                  </div>

                  <div className="mb-3">
                    <button
                      className="btn button-green w-100"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Generate Recipe"}
                    </button>

                    {response && (
                      <button
                        className="btn btn-outline-primary w-100 mt-3"
                        onClick={() => handleResponse(response.message_id)}
                      >
                        See Response
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-5 position-relative d-flex justify-content-center">
            <div className="position-relative" style={{ margin: '50px' }}>
              <div className="text-center">
                <img
                  src="/right-food.png"
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

export default SendMessage;
