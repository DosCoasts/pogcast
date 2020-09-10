import ffmpeg from '../ffmpeg.js/ffmpeg';
const mp3Decoder = async () => {
    const wasm = await ffmpeg();
    const decoder = new wasm.AVCodecWrapper();

    const decode = async (url) => {
        const response = await fetch(url);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        let receivedLength = 0;
        while (true) {
            const {done, value} = await reader.read();
            if (done) {
                break;
            }
            const output = Float32Array.from(decoder.decode(value));
            postMessage(output.buffer, [output.buffer]);
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

const decoder = mp3Decoder();
console.log(decoder);
onmessage = function({ data }) {
    console.log(data);
    decoder.then((decoder) => decoder.decode(data));
};