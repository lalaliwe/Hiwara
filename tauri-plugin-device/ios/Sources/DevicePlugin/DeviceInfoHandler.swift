import SwiftRs
import Tauri
import UIKit
import WebKit

class DeviceInfoHandler: NSObject {
    
    func getDeviceInfo(_ invoke: Invoke) throws {
        invoke.resolve([
            "osName": "iOS",
            "osVersion": UIDevice.current.systemVersion,
            "deviceModel": UIDevice.current.model,
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
