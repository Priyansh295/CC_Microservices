// src/App.jsx - Updated with CssBaseline

// Import the baseline component
import CssBaseline from '@mui/material/CssBaseline';
// Keep the App.css import if you have custom styles or want to add them later
import './App.css';
// Import the RegisterForm component
import RegisterForm from './components/RegisterForm';

function App() {
  return (
    <> {/* Start with a React Fragment */}
      <CssBaseline /> {/* Apply MUI's baseline styles (incl. background) */}
      <RegisterForm /> {/* Render the form component */}
    </>
  );
}

export default App;