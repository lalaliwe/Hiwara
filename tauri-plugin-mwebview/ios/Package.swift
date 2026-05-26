// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "tauri-plugin-mwebview",
    platforms: [
        .iOS(.v13),
    ],
    products: [
        .library(
            name: "tauri-plugin-mwebview",
            type: .static,
            targets: ["tauri-plugin-mwebview"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/tauri-apps/tauri-plugin-ios", from: "2.0.0"),
    ],
    targets: [
        .target(
            name: "tauri-plugin-mwebview",
            dependencies: [
                .product(name: "TauriPluginIOS", package: "tauri-plugin-ios"),
            ],
            path: "Sources"
        ),
    ]
)
