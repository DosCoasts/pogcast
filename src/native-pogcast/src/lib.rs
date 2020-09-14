#[macro_use]
mod utils;

use js_sys::Float32Array;
use rodio::{OutputStream, Sink};
use rodio::buffer::SamplesBuffer;
use serde::{Serialize, Deserialize};
use wasm_bindgen::prelude::*;

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
        crate::utils::set_panic_hook();

        let (stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        let options = player_options.into_serde::<PlayerOptions>().unwrap();
        let mut player = Self {
            sink: sink,
            stream: stream,
            volume: options.volume,
        };
        player.set_volume(options.volume);
        player.suspend_stream();
        player
    }

    pub fn start_stream(&self) {
        self.stream.resume().unwrap();
    }

    pub fn suspend_stream(&self) {
        self.stream.suspend().unwrap();
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
