import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Message() {
  const [message, setMessage] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`${apiUrl}/messages/${params.messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to delete message");
      }

      alert("Message deleted successfully");
      navigate("/messages");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleBack = async () => {
    navigate("/messages");
  };

  const handleImage = async () => {
    if (!window.confirm("Generate image based on the prompt responses?")) return;
    const prompt = "Generate an image of the based on the following LLM responses. Don't put text or words of any kind."
    try {
      const res = await fetch(`${apiUrl}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell-Free",
          prompt: prompt,
          steps: 4,
          n: 1,
          message_id: params.messageId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate image");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Image generation failed");

      const updated = await fetch(`${apiUrl}/messages/${params.messageId}`);
      const updatedData = await updated.json();
      setMessage(updatedData);
      alert("Image generated!");
    } catch(error) {
      alert("Error: " + error.message)
    }
  }

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message_id: params.messageId,
          scamper_system: "You are a creative assistant applying the SCAMPER method. Use the SCAMPER step specified in the user message to enhance the response given",
          scamper_user: `SCAMPER step: ${step}`,
          step_content: userInput,
          step: step
        })
      });

      if(!res.ok){
        const err = await res.json();
        throw new Error(err.detail || "SCAMPER operation failed");
      }

      const updated = await fetch(`${apiUrl}/messages/${params.messageId}`);
      const updatedData = await updated.json();
      setMessage(updatedData);
      alert("SCAMPER operation completed!")
    } catch(error) {
      alert("Error: " + error.message)
    }
  }

  const formatLRMResponse = (text) => {
    const thinkTagRegex = /<think>(.*?)<\/think>/s;
    const match = text.match(thinkTagRegex);

    if (match) {
      const reasoningContent = match[1]; // inside <think>
      const response = text.replace(match[0], ''); // remove whole <think>...</think>

      return (
        <>
          <span style={{ color: 'gold' }}>{'<think>'}</span>
          <span style={{ color: 'silver' }}>{reasoningContent}</span>
          <span style={{ color: 'gold' }}>{'</think>'}</span>
          <span style={{ color: 'white' }}>{response}</span>
        </>
      );
    }

    return <span style={{ color: 'white' }}>{text}</span>;
  };

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
            marginBottom: '0.5rem',
            cursor: 'pointer'
          }}
        >
        Back to messages
        </button>
      </div>

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
        <strong className='item'>{message.models?.[index] || 'Unknown Model'}:</strong>
        <strong> {formatLRMResponse(res)}</strong>
      </li>
    ))}
  </ul>
  <div>
    <h1>Let's SCAMPER!</h1>
    <button onClick={() => handleScamper('substitute')} className='scamper'>Substitute</button>
    <button onClick={() => handleScamper('combine')} className='scamper'>Combine</button>
    <button onClick={() => handleScamper('adjust')} className='scamper'>Adjust</button>
    <button onClick={() => handleScamper('modify')} className='scamper'>Modify</button>
    <button onClick={() => handleScamper('put_to_other_uses')} className='scamper'>Put to other uses</button>
    <button onClick={() => handleScamper('eliminate')} className='scamper'>Eliminate</button>
    <button onClick={() => handleScamper('reverse')} className='scamper'>Reverse</button>
  </div>
  {message.scamper && (
    <div>
      {Object.entries(message.scamper).map(([step, responses]) =>
        Array.isArray(responses) && responses.some(text => text.trim()) ? (
          <div key={step} style={{ marginBottom: '1rem' }}>
            <h3 className='item' style={{ textTransform: 'capitalize' }}>{step}</h3>
            <ul>
              {responses
                .filter(text => text.trim())
                .map((text, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', color: 'white' }}>{text}</pre>
                  </li>
                ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  )}
  <div>
    {message.image_url && (
      <div style={{ marginTop: '1rem' }}>
        <h3>Generated Image</h3>
        <img src={message.image_url} alt="Generated" style={{ width: "256px", height: "256px", objectFit: "cover" }} />
      </div>
    )}
  </div>
  <div>
    <button
      onClick={handleImage}
      style={{
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'white',
        color: 'black',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Generate Image
    </button>
  </div>
    <button
    onClick={handleDelete}
    style={{
      marginTop: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: 'darkred',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    Delete Message
    </button>
</div>

  );
}

export default Message;
