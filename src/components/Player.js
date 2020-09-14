import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect } from 'react';
import workers from '../workers/workers';
const rust = import("../native-pogcast/pkg");

const DEFAULT_OPTIONS = {
    volume: 50,
};

function Player() {
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(DEFAULT_OPTIONS.volume);
    const [timestamp, setTimestamp] = useState(0);
    const [duration, setDuration] = useState(0);
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
            if (data.msg.localeCompare("buffer") === 0) {
                const array = new Float32Array(data.buffer);
                rustPlayer.add_data(array);
            } else if (data.msg.localeCompare("duration") === 0) {
                setDuration(data.duration);
            }
        };
    }, [rustPlayer]);

    const play = () => {
        const start = () => {
            rustPlayer.start_stream();
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

    const handleTimestamp = (ts) => {
        setTimestamp(ts);
    };

    const durationSpan = () => {
        const durationString = (d) => d.toString().padStart(2, '0');
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);
        return (
            <span>
                {hours > 0 && durationString(hours) + ':'}
                {minutes > 0 && durationString(minutes) + ':'}
                {durationString(seconds)}
            </span>
        );
    };

    return (
        <div className="Player">
            <button onClick={() => playing ? stop() : play()}>
                <FontAwesomeIcon icon={playing ? faPause : faPlay } />
            </button>
            <input type="range" min="0" max="100" value={volume} onChange={(e) => handleVolume(e.target.value)} />
            <div className="seek">
                <input type="range" value={timestamp} min="0" max={duration} onChange={(e) => handleTimestamp(e.target.value)} />
                {duration > 0 && durationSpan()}
            </div>
        </div>
    );
}

export default Player;