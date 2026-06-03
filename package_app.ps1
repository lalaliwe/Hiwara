# Windows x86_64
npx tauri build --target x86_64-pc-windows-msvc

# Windows ARM64
npx tauri build --target aarch64-pc-windows-msvc

# Windows x86 (32-bit)
npx tauri build --target i686-pc-windows-msvc

# Android (APK, split per ABI)
npm run tauri android build -- --apk --split-per-abi
