import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import App from './App';
import Messages from './pages/Messages';
import Message from './pages/Message';
import SendMessage from './pages/SendMessage';

import "./index.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:messageId" element={<Message />} />
      <Route path="send-message" element={<SendMessage />} />
    </Routes>
  </Router>
);