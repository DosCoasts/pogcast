import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import ffmpeg from './ffmpeg.js/ffmpeg';
const rust = import("./native-pogcast/pkg");

const mp3Decoder = async (play) => {
    const wasm = await ffmpeg();
    const decoder = new wasm.AVCodecWrapper();

    const decode = async (url, handle) => {
        const response = await fetch(url);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        let receivedLength = 0;
        let chunks = [];
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
            // TODO: Implement stream decoding
            //const output = Float32Array.from(decoder.decode(value));
            //channel.postMessage(output);
            receivedLength += value.length;
            if (contentLength)
                console.log(`${Math.floor((receivedLength/contentLength)*100)}%...`);
        }
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (let chunk of chunks) {
            chunksAll.set(chunk, position);
            position += chunk.length;
        }
        const output = Float32Array.from(decoder.decode(chunksAll));
        console.log(handle);
        rust.then((wasm) => wasm.play(handle, output));
    };

    return {
        decode,
        delete: decoder.delete,
    };
};

function App() {
    const [handle, setHandle] = useState();
    const decoder = useMemo(() => mp3Decoder(), []);

    const start = () => {
        rust.then((wasm) => wasm.start())
            .then((handle) => {
                setHandle(handle);
                decoder.then(decoder => {
                    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                    const url = 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3';
                    decoder.decode(proxyUrl + url, handle);
                });
            });
    };
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
