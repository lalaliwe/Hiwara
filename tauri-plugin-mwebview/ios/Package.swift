// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "tauri-plugin-mwebview",
    platforms: [
        .macOS(.v10_13),
        .iOS(.v13),
    ],
    products: [
        .library(
            name: "tauri-plugin-mwebview",
            type: .static,
            targets: ["tauri-plugin-mwebview"]),
    ],
    dependencies: [
        .package(name: "Tauri", path: "../.tauri/tauri-api")
    ],
    targets: [
        .target(
            name: "tauri-plugin-mwebview",
            dependencies: [
                .byName(name: "Tauri")
            ],
            path: "Sources")
    ]
)
