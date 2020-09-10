import React, { useState, useEffect } from 'react';
import './App.css';
import workers from './workers/workers';
const rust = import("./native-pogcast/pkg");

function App() {
    const [handle, setHandle] = useState();

    useEffect(() => {
        rust.then((wasm) => {
            workers.decoderWorker.onmessage = ({ data }) =>  {
                const array = new Float32Array(data);
                if (handle)
                    wasm.play(handle, array);
            };
        })
    }, [handle]);

    const start = () => rust.then((wasm) => {
        const handle = wasm.start();
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const audioUrl = 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3';
        workers.decoderWorker.postMessage(proxyUrl + audioUrl);
        setHandle(handle);
    });
    const stop = () => {
        handle.free();
        setHandle(null);
    };
    return (
        <div className="App">
            <button onClick={() => handle ? stop() : start()}>{handle ? "Stop" : "Play"}</button>
        </div>
    );
}

export default App;
