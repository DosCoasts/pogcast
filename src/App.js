import React, { useState, useEffect } from 'react';
import './App.css';
import workers from './workers/workers';
const rust = import("./native-pogcast/pkg");

const DEFAULT_OPTIONS = {
    volume: 50,
};

function App() {
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(DEFAULT_OPTIONS.volume);
    const [rustPlayer, setRustPlayer] = useState();

    useEffect(() => {
        rust.then((wasm) => setRustPlayer(new wasm.Player(DEFAULT_OPTIONS)));
        return () => {
            rustPlayer.free();
            setRustPlayer(null);
        };
    }, []);

    useEffect(() => {
        workers.decoderWorker.onmessage = ({ data }) =>  {
            const array = new Float32Array(data);
            rustPlayer.add_data(array);
        };
    }, [rustPlayer]);

    const play = () => {
        const start = () => {
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const audioUrl = 'https://www.bensound.com/bensound-music/bensound-ukulele.mp3';
            workers.decoderWorker.postMessage(proxyUrl + audioUrl);
        };
        const resume = () => rustPlayer.resume();

        rustPlayer.is_playing() ? resume() : start();
        setPlaying(true);
    };

    const stop = () => {
        rustPlayer.pause();
        setPlaying(false);
    };
    const handleVolume = (volume) => {
        setVolume(volume);
        rustPlayer.set_volume(volume);
    };
    return (
        <div className="App">
            <button onClick={() => playing ? stop() : play()}>{playing ? "Stop" : "Play"}</button>
            <div>
                <input type="range" min="1" max="100" value={volume} onChange={(e) => handleVolume(e.target.value)} />
            </div>
        </div>
    );
}

export default App;
