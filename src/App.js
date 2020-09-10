import React, { useState } from 'react';
import './App.css';
import ffmpeg from './ffmpeg.js/ffmpeg';
const rust = import("./native-pogcast/pkg");

const mp3Decoder = async () => {
    const wasm = await ffmpeg();
    const decoder = new wasm.AVCodecWrapper();

    const decode = async (url) => {
        const response = await fetch(url);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        let chunks = [];
        let receivedLength = 0;
        while (true) {
            const {done, value} = await reader.read();
            console.log(value);
            if (done) {
                break;
            }
            chunks.push(value);
            receivedLength += value.length;
        }
        console.log(chunks);
        console.log(receivedLength);
        let chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for(let chunk of chunks) {
            chunksAll.set(chunk, position); // (4.2)
            position += chunk.length;
        }
        console.log(chunksAll);
        const output = Float32Array.from(decoder.decode(chunksAll));
        console.log(output);
        decoder.delete();
        return output;
        /*return await fetch(url)
            .then(response => response.arrayBuffer())
            .then((buffer) => {
                const array = new Uint8Array(buffer);
                const output = Float32Array.from(decoder.decode(array));
                console.log(output);
                decoder.delete();
                return output;
            });*/
    };

    return {
        decode,
    };
};

function App() {
    const [handle, setHandle] = useState();
    const decoder = mp3Decoder();

    const start = () => {
        rust.then(wasm => {
            decoder.then(decoder => {
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                const url = 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3';
                decoder.decode(proxyUrl + url).then(data => setHandle(wasm.play(data)));
            });
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
