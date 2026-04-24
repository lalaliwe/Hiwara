import SwiftRs
import Tauri
import UIKit
import WebKit

#if os(macOS)
import AppKit
#endif

class DeviceInfoHandler: NSObject {
    
    func getDeviceInfo(_ invoke: Invoke) throws {
        #if os(iOS)
        let osName = "iOS"
        let osVersion = UIDevice.current.systemVersion
        let deviceModel = UIDevice.current.model
        #elseif os(macOS)
        let osName = "macOS"
        // 获取macOS详细版本号,如 "14.2.1" 或 "Sonoma 14.2.1"
        let version = ProcessInfo.processInfo.operatingSystemVersion
        let osVersion = "\(version.majorVersion).\(version.minorVersion).\(version.patchVersion)"
        let deviceModel = "Mac"
        #else
        let osName = "Unknown"
        let osVersion = "Unknown"
        let deviceModel = "Unknown"
        #endif
        
        invoke.resolve([
            "osName": osName,
            "osVersion": osVersion,
            "deviceModel": deviceModel,
            "deviceManufacturer": "Apple"
        ])
    }
    
    func getNetworkInfo(_ invoke: Invoke) throws {
        let networkStatus = getNetworkStatus()
        invoke.resolve(networkStatus)
    }
    
    func getBatteryInfo(_ invoke: Invoke) throws {
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
        return [
            "isConnected": true,
            "networkType": "unknown"
        ]
    }
}
