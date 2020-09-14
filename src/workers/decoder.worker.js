import ffmpeg from '../ffmpeg.js/ffmpeg';

const mp3Decoder = async () => {
    const wasm = await ffmpeg();
    const decoder = new wasm.AVCodecWrapper();

    const decode = async (url) => {
        const response = await fetch(url);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        let receivedLength = 0;
        let bitRate = null;
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            const output = Float32Array.from(decoder.decode(value));
            if (!bitRate && contentLength) {
                bitRate = decoder.getBitRate();
                //const channels = decoder.getChannels();
                const totalSeconds = contentLength/(bitRate/8.0);
                postMessage({ msg: 'duration', duration: totalSeconds });
            }
            const CHUNK_SIZE = 1024 * 1024 * 1; // send 1MB at a time
            for (let i = 0; i < output.length; i += CHUNK_SIZE) {
                const chunk = new Float32Array(output.slice(i, i + CHUNK_SIZE));
                postMessage({ msg: 'buffer', buffer: chunk.buffer }, [chunk.buffer]);
            }
            receivedLength += value.length;
            if (contentLength)
                console.log(`${Math.floor((receivedLength/contentLength)*100)}%...`);
        }
    };

    return {
        decode,
        delete: decoder.delete,
    };
};

mp3Decoder().then((decoder) => {
    onmessage = function({ data }) {
        decoder.decode(data);
    };
});