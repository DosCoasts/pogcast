import DecoderWorker from './decoder.worker.js';

const workers = {
    decoderWorker: new DecoderWorker(),
};

export default workers;