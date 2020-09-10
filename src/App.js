import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ffmpeg from './ffmpeg.js/ffmpeg';
const rust = import("./native-pogcast/pkg");

const mp3Decoder = async (channel) => {
    const wasm = await ffmpeg();
    const decoder = new wasm.AVCodecWrapper();

    const decode = async (url) => {
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
        console.log(output);
        channel.postMessage(output);
    };

    return {
        decode,
        delete: decoder.delete,
    };
};

function App() {
    const [handle, setHandle] = useState();
    const decoder = useRef(null);
    useEffect(() => {
        const bc = new BroadcastChannel('mp3_chunks');
        bc.onmessage = ({ data }) => {
            console.log(data);
            rust.then((wasm) => wasm.play(data));
        };

        decoder.current = mp3Decoder(bc);
    }, []);

    const start = () => {
        rust.then((wasm) => setHandle(wasm.start()));
        decoder.current.then(decoder => {
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const url = 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3';
            decoder.decode(proxyUrl + url);
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
