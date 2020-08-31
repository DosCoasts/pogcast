mod utils;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{BufferSize, Data, Sample, SampleRate, SampleFormat, Stream, StreamConfig};
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
pub struct Handle(Stream);

#[wasm_bindgen]
pub fn play(raw_data: &Float32Array) -> Handle {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    let v = raw_data.to_vec();
    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .expect("failed to find a default output device");
    let config = StreamConfig {
        channels: 1,
        sample_rate: SampleRate(44100),
        buffer_size: BufferSize::Fixed(v.len() as u32),
    };
    let mut supported_configs_range = device.supported_output_configs().expect("error while querying configs");
    for config in supported_configs_range {
        //console::log_1(&format!("{:?}", config).into());
    }

    let err_fn = |err| console::error_1(&format!("an error occurred on stream: {}", err).into());
    let write_data_f32 = move |data: &mut Data, _: &cpal::OutputCallbackInfo| write_data(data, &v);

    let stream = device.build_output_stream_raw(&config.into(), SampleFormat::F32, write_data_f32, err_fn).unwrap();
    stream.play().unwrap();

    return Handle(stream);
}

fn write_data(data: &mut Data, raw_data: &[f32]) {
    data.as_slice_mut().unwrap()[..].clone_from_slice(&raw_data);
    console::log_1(&format!("{:?}", data).into());
}