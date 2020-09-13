pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[macro_export]
macro_rules! console_log {
    () => { web_sys::console::log_1("\n"); };
    ($($arg:tt)*) => { web_sys::console::log_1(&format!($($arg)*).into()); };
}