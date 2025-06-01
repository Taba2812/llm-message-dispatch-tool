import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from "../components/Navbar"; 

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 10;

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const truncate = (text, maxLength) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const indexOfLast = currentPage * messagesPerPage;
  const indexOfFirst = indexOfLast - messagesPerPage;
  const currentMessages = messages.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(messages.length / messagesPerPage);
  
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100" style={{
      background: 'linear-gradient(135deg, #f5f1eb 0%, #e8dcc6 100%)',
      fontFamily: "'Poppins', sans-serif"
    }}>
      <p className="fs-4 text-muted">Loading messages...</p>
    </div>
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
  
    try {
      const response = await fetch(`${apiUrl}/messages/${id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to delete message");
      }
  
      alert("Message deleted successfully");
  
      // Remove the deleted message from state
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } catch (error) {
      alert("Error: " + error.message);
    }
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

      <div className="container">
        
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            My Recipes
          </li>
        </ol>
      </nav>

        <div className="row g-5 align-items-start">
          

          {/* Right Column with List and Pagination */}
          <div className="col-lg-7">
            {messages.length === 0 ? (
              <p className="text-muted">No messages available</p>
            ) : (
              <>
                <ul className="list-group mb-3">
                  {currentMessages.map((message) => (
                    <li className="list-group-item d-flex justify-content-between align-items-center" key={message.id}>
                      <div>
                        <div className="fw-semibold text-dark">{formatTimestamp(message.timestamp)}</div>
                        <div className="text-muted small">{truncate(message.preview, 64)}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <Link to={`/messages/${message.id}`} className="fs-5" style={{color:'#8DBCC7'}}>
                          <i className="bi bi-eye-fill"></i>
                        </Link>
                        <button 
                          onClick={() => handleDelete(message.id)} 
                          className="border-0 bg-transparent fs-5"
                          style={{ cursor: 'pointer', color:'#8DBCC7' }}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>

                    </li>
                  ))}
                </ul>

                <nav>
                  <ul className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </>
            )}
          </div>

          {/* Left Column with Image */}
          <div className="col-lg-5">
            <img src="/8dfb7f80e1b0fb0f5f3be02b3fd3be28-Photoroom.png" alt="Recipe Illustration" className="img-fluid w-100 h-100" style={{ objectFit: 'contain', maxHeight: '600px' }} />
          </div>


        </div>
      </div>
    </div>
  );
}

export default Messages;