import React, { useState } from 'react';
import './App.css';
const wasm = import("./native-pogcast/pkg");

function App() {
  const [handle, setHandle] = useState();
  const start = () => {
    wasm.then(wasm => {
      setHandle(wasm.beep());
    });
  };
  const stop = () => {
    handle.free();
    setHandle(null);
  };
  const toggleBeep = () => {
    if (!handle) {
      start();
    } else {
      stop();
    }
  };
  return (
    <div className="App">
      <button onClick={toggleBeep}>{handle ? "Stop" : "Play"}</button>
    </div>
  );
}

export default App;
