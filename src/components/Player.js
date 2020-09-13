import React, { useState, useEffect } from 'react';
import workers from '../workers/workers';
const rust = import("../native-pogcast/pkg");

const DEFAULT_OPTIONS = {
    volume: 50,
};

function Player() {
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(DEFAULT_OPTIONS.volume);
    const [rustPlayer, setRustPlayer] = useState();

    useEffect(() => {
        let player;
        rust.then((wasm) => {
            player = new wasm.Player(DEFAULT_OPTIONS);
            setRustPlayer(player);
        });
        return () => {
            if (player) {
                player.free();
                setRustPlayer(null);
            }
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

        rustPlayer.is_playing() ? rustPlayer.resume() : start();
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
        <div>
            <button onClick={() => playing ? stop() : play()}>{playing ? "Stop" : "Play"}</button>
            <div>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => handleVolume(e.target.value)} />
            </div>
        </div>
    );
}

export default Player;