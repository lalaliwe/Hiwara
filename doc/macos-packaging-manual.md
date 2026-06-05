# macOS 手动打包指南

## 构建指定架构

```bash
npm install
npm run build

# Intel Mac
npx tauri build --target x86_64-apple-darwin

# Apple Silicon Mac
npx tauri build --target aarch64-apple-darwin
```

## 创建 Universal Binary

```bash
mkdir -p src-tauri/target/universal/Hiwara.app/Contents/MacOS
cp -R src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Hiwara.app \
      src-tauri/target/universal/Hiwara.app

lipo -create \
    src-tauri/target/x86_64-apple-darwin/release/hiwara \
    src-tauri/target/aarch64-apple-darwin/release/hiwara \
    -output src-tauri/target/universal/Hiwara.app/Contents/MacOS/hiwara

# 验证（应显示 x86_64 arm64）
lipo -info src-tauri/target/universal/Hiwara.app/Contents/MacOS/hiwara
```

## 自签名

```bash
codesign --force --deep -s - src-tauri/target/universal/Hiwara.app
```

## 创建 DMG

```bash
hdiutil create -volname "Hiwara" \
    -srcfolder src-tauri/target/universal/Hiwara.app \
    -ov -format UDZO \
    src-tauri/target/universal/Hiwara-universal.dmg
```

## 正式签名（使用开发者证书）

```bash
# 签名
codesign --force --options runtime \
    --sign "Developer ID Application: Your Name (TEAMID)" \
    --deep \
    src-tauri/target/universal/Hiwara.app

# 创建 DMG
hdiutil create -volname "Hiwara" \
    -srcfolder src-tauri/target/universal/Hiwara.app \
    -ov -format UDZO \
    src-tauri/target/universal/Hiwara-universal.dmg

# 公证
xcrun notarytool submit src-tauri/target/universal/Hiwara-universal.dmg \
    --apple-id "your@apple.id" \
    --team-id "YOUR_TEAM_ID" \
    --password "xxxx-xxxx-xxxx-xxxx" \
    --wait

# 绑定公证票据
xcrun stapler staple src-tauri/target/universal/Hiwara-universal.dmg
```

## 输出路径说明

| 产物 | 路径 |
|---|---|
| Intel 可执行文件 | `src-tauri/target/x86_64-apple-darwin/release/hiwara` |
| ARM 可执行文件 | `src-tauri/target/aarch64-apple-darwin/release/hiwara` |
| Intel .app | `src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Hiwara.app` |
| ARM .app | `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Hiwara.app` |
| Universal .app | `src-tauri/target/universal/Hiwara.app` |
| Universal .dmg | `src-tauri/target/universal/Hiwara-universal.dmg` |

## 常见问题

### DMG 打不开或提示损坏？

自签名的应用首次打开需要在"系统设置 → 隐私与安全性"中点击"仍要打开"。使用 Developer ID 签名则不会出现此提示。

### `bundle_dmg.sh` 执行失败？

这是 Tauri v2 的已知问题，不影响构建。脚本已绕过此步骤，改用 `hdiutil` 直接创建 DMG。

### 只想构建当前架构？

直接运行 `npx tauri build`，会自动构建当前 Mac 架构。
