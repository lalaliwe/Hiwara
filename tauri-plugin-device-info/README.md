# tauri-plugin-device-info

一个 Tauri v2 插件，用于获取设备的系统信息、网络状态和电池信息。

## 功能特性

- **设备信息**: 获取操作系统名称、版本、设备型号和制造商
- **网络信息**: 检测网络连接状态、网络类型（WiFi/4G/5G）、WiFi SSID 和 BSSID
- **电池信息**: 获取电池电量百分比、充电状态、温度和电压

## 安装

在你的 Tauri 项目的 `src-tauri/Cargo.toml` 中添加：

```toml
[dependencies]
tauri-plugin-device-info = { path = "../tauri-plugin-device-info" }
```

在 `src-tauri/src/lib.rs` 中初始化插件：

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_device_info::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 使用方法

### Rust API

```rust
use tauri_plugin_device_info::{DeviceInfoExt, NetworkType};

// 在 setup 或其他地方使用
app.handle().device_info().get_device_info()?;
app.handle().device_info().get_network_info()?;
app.handle().device_info().get_battery_info()?;
```

### JavaScript/TypeScript API

```typescript
import { 
  getDeviceInfo, 
  getNetworkInfo, 
  getBatteryInfo 
} from 'tauri-plugin-device-info-api';

// 获取设备信息
const deviceInfo = await getDeviceInfo();
console.log(`OS: ${deviceInfo.osName} ${deviceInfo.osVersion}`);

// 获取网络信息
const networkInfo = await getNetworkInfo();
if (networkInfo.isConnected) {
  console.log(`Network: ${networkInfo.networkType}`);
  if (networkInfo.networkType === 'wifi') {
    console.log(`WiFi SSID: ${networkInfo.wifiSsid}`);
  }
}

// 获取电池信息
const batteryInfo = await getBatteryInfo();
console.log(`Battery: ${batteryInfo.level}%`);
console.log(`Charging: ${batteryInfo.isCharging}`);
```

## 权限配置

在 `tauri.conf.json` 中配置权限：

```json
{
  "tauri": {
    "security": {
      "capabilities": ["default"]
    }
  }
}
```

## Android 权限

插件自动在 `AndroidManifest.xml` 中声明以下权限：

- `ACCESS_NETWORK_STATE`: 检测网络连接状态
- `ACCESS_WIFI_STATE`: 获取 WiFi 信息

## 平台支持

- ✅ Windows
- ✅ macOS
- ✅ Linux
- ✅ Android
- 🚧 iOS (待实现)

## 开发

确保你已安装：

- Node.js LTS
- Rust toolchain
- Tauri CLI
- Android Studio (用于 Android 开发)

运行测试：

```bash
npm run tauri dev
```

## License

MIT
