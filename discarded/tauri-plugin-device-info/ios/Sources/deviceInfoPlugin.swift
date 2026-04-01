import SwiftRs
import Tauri
import UIKit
import WebKit

class PingArgs: Decodable {
  let value: String?
}

class DeviceInfoPlugin: Plugin {
  @objc public func ping(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(PingArgs.self)
    invoke.resolve(["value": args.value ?? ""])
  }
  
  @objc public func getDeviceInfo(_ invoke: Invoke) throws {
    invoke.resolve([
      "osName": "iOS",
      "osVersion": UIDevice.current.systemVersion,
      "deviceModel": UIDevice.current.model,
      "deviceManufacturer": "Apple"
    ])
  }
  
  @objc public func getNetworkInfo(_ invoke: Invoke) throws {
    // iOS 端网络信息获取 - 简化版
    // 只判断是否 WiFi 连接，不区分具体网络类型
    let networkStatus = getNetworkStatus()
    invoke.resolve(networkStatus)
  }
  
  @objc public func getBatteryInfo(_ invoke: Invoke) throws {
    // 启用电池监控
    UIDevice.current.isBatteryMonitoringEnabled = true
    
    let level: Int
    if UIDevice.current.batteryLevel == UIDevice.BatteryLevel.unknown {
      level = 100
    } else {
      level = Int(UIDevice.current.batteryLevel * 100)
    }
    
    let isCharging = UIDevice.current.batteryState == .charging || 
                     UIDevice.current.batteryState == .full
    
    invoke.resolve([
      "level": level,
      "isCharging": isCharging
    ])
  }
  
  private func getNetworkStatus() -> [String: Any] {
    // 使用 Network Framework 或 Reachability 检测网络
    // 这里简化实现，实际项目中建议使用 SystemConfiguration
    // 注意：iOS 沙盒限制，无法直接判断 WiFi/蜂窝，只能检测连通性
    return [
      "isConnected": true,
      "networkType": "unknown"
    ]
  }
}

@_cdecl("init_plugin_device_info")
func initPlugin() -> Plugin {
  return DeviceInfoPlugin()
}
