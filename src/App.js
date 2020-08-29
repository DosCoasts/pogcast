import React, { useState } from 'react';
import './App.css';
import ffmpeg from './ffmpeg.js/ffmpeg';
const rust = import("./native-pogcast/pkg");

const mp3Decoder = async (channel) => {
  const wasm = await ffmpeg();
  const decoder = new wasm.AVCodecWrapper("mp3");
  console.log(wasm);
  decoder.delete();

  const decode = async (path) => {
    const response = await fetch(path);
    const inBuf = response.arrayBuffer;
    let data_size = inBuf.byteLength;
    let decoded_frame = null;
    while (data_size > 0) {
      if (!decoded_frame) {
        //decoded_frame = wasm.av_frame_alloc();
        if (!decoded_frame) {
          console.error("Could not allocate audio frame");
        }
      }
    }
  };

  return {
    decode,
  };

  return async (path) => {
    const response = await fetch(path);
    const arrayBuffer = response.arrayBuffer;
    return;
  };
};

function App() {
  const [handle, setHandle] = useState();
  const bc = new BroadcastChannel('music');
  const decoder = mp3Decoder(bc);
  //decoder.decode('../music.mp3');

  const start = () => {
    rust.then(wasm => {
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
