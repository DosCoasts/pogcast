# Pogcast

Just another podcast app.

## Motivation

`pogcast` is an experiment in using React as a general application UI layer with an underlying [Webassembly](https://webassembly.org/) layer to perform heavy-duty processing. The Javascript layer of the application ideally will only orchestrate the wasm application logic.

## Webassembly

This project uses two webassembly modules: ffmpeg.js and native-pogcast.

* [`robert-w-gries/ffmpeg.js`](https://github.com/robert-w-gries/ffmpeg.js) - A fork of the origianl Webassembly ffmpeg.js library that uses C++ bindings to build a simpler interface for decoding compressed audio data to raw output.
* [`robert-w-gries/rodio`](https://github.com/robert-w-gries/rodio) - A fork of the Rust playback library that uses the WebAudio API to manage playback in a background thread.
