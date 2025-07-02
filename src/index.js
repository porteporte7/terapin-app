// Import React and ReactDOM for rendering
import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the main App component
import App from './App';
// Import Tailwind CSS (assuming it's configured in a global CSS file or via CDN in index.html)
import './index.css'; // This file will be empty or contain basic global styles

// Create a root for the React application
const root = ReactDOM.createRoot(document.getElementById('root'));
// Render the App component into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);