mod utils;

use rodio::{OutputStream, OutputStreamHandle, Sink};
use rodio::buffer::SamplesBuffer;
use js_sys::Float32Array;
use std::panic;
use wasm_bindgen::prelude::*;
use web_sys::console;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct Handles(Sink, OutputStreamHandle, OutputStream);

#[wasm_bindgen]
pub struct SinkHandle(Sink);

#[wasm_bindgen]
pub fn start() -> Handles {
    let (stream, stream_handle) = OutputStream::try_default().unwrap();
    let sink = Sink::try_new(&stream_handle).unwrap();
    return Handles(sink, stream_handle, stream);
}

#[wasm_bindgen]
pub fn play(handles: &Handles, raw_data: &Float32Array) {
    let v = raw_data.to_vec();
    let buffer = SamplesBuffer::new(1,44100, v);
    handles.0.append(buffer);
}
