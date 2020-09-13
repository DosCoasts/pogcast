mod utils;

use js_sys::{Array, Float32Array, Object};
use rodio::{OutputStream, Sink};
use rodio::buffer::SamplesBuffer;
use serde::{Serialize, Deserialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::console;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Deserialize, Serialize)]
struct PlayerOptions {
    #[serde(default)]
    volume: u32,
}

impl Default for PlayerOptions {
    fn default() -> Self {
        Self {
            volume: 50,
        }
    }
}

#[wasm_bindgen]
pub struct Player {
    sink: Sink,
    stream: OutputStream,
    volume: u32,
}

#[wasm_bindgen]
impl Player {
    #[wasm_bindgen(constructor)]
    pub fn new(player_options: &JsValue) -> Self {
        let (stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        let options = player_options.into_serde::<PlayerOptions>().unwrap();
        sink.set_volume(options.volume as f32 / 100.0);
        Self {
            sink: sink,
            stream: stream,
            volume: options.volume,
        }
    }

    pub fn add_data(&self, raw_data: &Float32Array) {
        let buffer = SamplesBuffer::new(1,44100, raw_data.to_vec());
        self.sink.append(buffer);
    }

    pub fn pause(&self) {
        self.sink.pause();
    }

    pub fn resume(&self) {
        self.sink.play();
    }

    pub fn is_playing(&self) -> bool {
        !self.sink.empty()
    }

    pub fn set_volume(&mut self, volume: u32) {
        self.volume = volume;
        self.sink.set_volume(volume as f32 / 100.0);
    }
}
