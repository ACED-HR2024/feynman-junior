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
    <div>
      <h1>Simple Form</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={inputValue}
          onChange={handleInputChange} // Corrected type for textarea event handler
          className="textarea"
          placeholder="Enter text here"
        />
        <button onClick = {handleClickFunction}>Submit</button>
      </form>
    </div>
  );
}

export default App;
