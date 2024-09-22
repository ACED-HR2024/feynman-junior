import './App.css';
import React, { useState } from 'react';
import './App.css'; // Import the CSS file
import { handleClickFunction} from './functions/saveFile'

function App() {
  // State to hold the value of the textarea
  const [inputValue, setInputValue] = useState<string>('');

  // Handler for when the form is submitted
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent page reload
    console.log(inputValue); // Log the input value to the console
  };

  // Handler for when the textarea changes
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value); // Update the input value
  };

  return (
        <div className="app-container">
            <h1>Feynman Junior App</h1>
            <FeynmanJunior />
        </div>
  );
}

export default App;