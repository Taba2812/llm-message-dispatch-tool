import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from "../components/Navbar"; 

function Message() {
  const [message, setMessage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const params = useParams();

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

  const handleImage = async () => {
    if (!window.confirm("Generate image based on the prompt responses?")) return;
    setImageLoading(true);
    const prompt = "Generate an image of the recipe based on the following LLM responses. Don't put text or words of any kind.";

    try {
      const res = await fetch(`${apiUrl}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell-Free",
          prompt,
          steps: 4,
          n: 1,
          message_id: params.messageId
        })
      });

      if (!res.ok) throw new Error((await res.json()).detail || "Failed to generate image");

      const updated = await fetch(`${apiUrl}/messages/${params.messageId}`);
      const updatedData = await updated.json();
      setMessage(updatedData);
      alert("Image generated!");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleScamper = async (step) => {
    const stepPrompts = {
      substitute: "What would you substitute in the current response?",
      combine: "What would you like to combine this with?",
      adjust: "What aspect would you adjust or tweak?",
      modify: "How would you modify or magnify the idea?",
      put_to_other_uses: "What other uses can you think of for this idea?",
      eliminate: "What can be removed or simplified?",
      reverse: "What would happen if we reversed or rearranged the idea?",
    };
    const userInput = window.prompt(stepPrompts[step], "");
    if (!userInput) return;

    try {
      const res = await fetch(`${apiUrl}/scamper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: params.messageId,
          scamper_system: "You are a creative assistant applying the SCAMPER method. Use the SCAMPER step specified in the user message to enhance the response given",
          scamper_user: `SCAMPER step: ${step}`,
          step_content: userInput,
          step
        })
      });

      if (!res.ok) throw new Error((await res.json()).detail || "SCAMPER operation failed");

      const updated = await fetch(`${apiUrl}/messages/${params.messageId}`);
      const updatedData = await updated.json();
      setMessage(updatedData);
      alert("SCAMPER operation completed!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const formatLRMResponse = (text) => {
    const thinkTagRegex = /<think>(.*?)<\/think>/s;
    const match = text.match(thinkTagRegex);

    if (match) {
      const reasoning = match[1];
      const response = text.replace(match[0], '');
      return (
        <>
          <p className="mb-2 text-warning"><strong>{'<think>'}</strong></p>
          <p className="text-muted">{reasoning}</p>
          <p className="mb-2 text-warning"><strong>{'</think>'}</strong></p>
          <div className="text-dark">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </>
      );
    }

    return <div className="text-dark"><ReactMarkdown>{text}</ReactMarkdown></div>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" style={{
        background: 'linear-gradient(135deg, #f5f1eb 0%, #e8dcc6 100%)',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <p className="fs-4 text-muted">Loading message...</p>
      </div>
    );
  }

  if (!message) return <p>Message not found.</p>;

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
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/messages" className="text-decoration-none">My Recipes</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Message #{params.messageId.slice(0, 6)}...</li>
          </ol>
        </nav>

        <h2 className="fw-bold mb-4" style={{ color: '#2d5016' }}>Message Details</h2>

        <div className="row mb-5">
          <div className="col-md-7">
            <div className="mb-4">
              <p><strong>Message ID:</strong> {message._id}</p>
              <p><strong>Temperature:</strong> {message.temperature}</p>
              <p><strong>Max Tokens:</strong> {message.max_tokens || "No limit"}</p>
              <p><strong>Timestamp:</strong> {new Date(message.timestamp).toLocaleString()}</p>
            </div>

            <h5 className="text-success"><i className="bi bi-pen"></i> Prompt</h5>
            <div className="mb-4">
              {message.messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong>{msg.role.charAt(0).toUpperCase() + msg.role.slice(1)} message:</strong> {msg.content}
                </div>
              ))}
            </div>
          </div>

          {message.image_url && (
            <div className="mb-4">
              <h5 className="text-success"><i className="bi bi-image"></i> Generated Image</h5>
              <img
                src={message.image_url}
                alt="Generated"
                style={{ width: "100%", maxWidth: "256px", height: "auto", objectFit: "cover" }}
                className="rounded shadow"
              />
            </div>
          )}
        </div>

        <h4 className="text-success mb-2"><i className="bi bi-cpu"></i> Model Responses</h4>
        {message.responses?.length > 0 && (
          <div className="accordion mb-4" id="modelResponsesAccordion">
            {message.responses.map((res, index) => (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header" id={`heading${index}`}>
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse${index}`}
                    aria-expanded="false"
                    aria-controls={`collapse${index}`}
                  >
                    {message.models?.[index] || `Model ${index + 1}`}
                  </button>
                </h2>
                <div
                  id={`collapse${index}`}
                  className="accordion-collapse collapse"
                  aria-labelledby={`heading${index}`}
                  data-bs-parent="#modelResponsesAccordion"
                >
                  <div className="accordion-body">
                    {formatLRMResponse(res)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SCAMPER Buttons */}
        <div className="mb-4">
        <h4 className="text-success mb-2"><i className="bi bi-magic"></i> Try SCAMPER</h4>
        <div className="d-flex flex-wrap gap-3">
            {[
              { step: "substitute", icon: "shuffle", color: "#e1f5fe" },
              { step: "combine", icon: "collection", color: "#e8f5e9" },
              { step: "adjust", icon: "sliders", color: "#fff3e0" },
              { step: "modify", icon: "tools", color: "#f3e5f5" },
              { step: "put_to_other_uses", icon: "lightbulb", color: "#fce4ec" },
              { step: "eliminate", icon: "trash", color: "#ffebee" },
              { step: "reverse", icon: "arrow-repeat", color: "#ede7f6" },
            ].map(({ step, icon, color }) => (
              <div
                key={step}
                onClick={() => handleScamper(step)}
                style={{
                  background: color,
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  minWidth: "120px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                }}
                className="hover-shadow"
              >
                <i className={`bi bi-${icon} mb-1`} style={{ fontSize: "1.2rem" }}></i>
                <div style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                  {step.replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase())}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* SCAMPER Results */}
        {message.scamper && Object.keys(message.scamper).length > 0 && (
          <>
            <h4 className="text-success mb-2"><i className="bi bi-lightbulb"></i> SCAMPER Responses</h4>
            <div className="accordion mb-4" id="scamperAccordion">
              {Object.entries(message.scamper).map(([step, responses], index) => (
                Array.isArray(responses) && responses.some(text => text.trim()) && (
                  <div className="accordion-item" key={step}>
                    <h2 className="accordion-header" id={`scamper-heading-${index}`}>
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#scamper-collapse-${index}`}
                        aria-expanded="false"
                        aria-controls={`scamper-collapse-${index}`}
                      >
                        {step.replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                      </button>
                    </h2>
                    <div
                      id={`scamper-collapse-${index}`}
                      className="accordion-collapse collapse"
                      aria-labelledby={`scamper-heading-${index}`}
                      data-bs-parent="#scamperAccordion"
                    >
                      <div className="accordion-body">
                        {responses
                          .filter(text => text.trim())
                          .map((text, idx) => (
                            <div key={idx} className="mb-3">
                              {formatLRMResponse(text)}
                            </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        )}


        {/* Action Buttons */}
        <div className="d-flex flex-wrap mt-3">
          <button className="btn button-orange me-2 mb-2" onClick={() => navigate("/messages")}>
            Back to Messages
          </button>
          <button className="btn button-purple mb-2" onClick={handleImage} disabled={imageLoading}>
            {imageLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              <>Generate Image <i className="bi bi-image"></i></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Message;
