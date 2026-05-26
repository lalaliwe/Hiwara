const COMMANDS: &[&str] = &[
    "ping",
    "create_webview",
    "update_webview_bounds",
    "destroy_webview",
    "inject_script",
    "inject_init_script",
    "webview_go_back",
    "webview_can_go_back",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
