const COMMANDS: &[&str] = &["ping", "getDeviceInfo", "getNetworkInfo", "getBatteryInfo"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
