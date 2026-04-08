import SwiftRs
import Tauri
import UIKit
import WebKit

class PingArgs: Decodable {
  let value: String?
}

class DevicePlugin: Plugin {
  private let deviceInfoHandler = DeviceInfoHandler()
  private let immersiveHandler = ImmersiveHandler()
  private let navbarStyleHandler = NavbarStyleHandler()
  private let orientationHandler = OrientationHandler()
  private let toastHandler = ToastHandler()

  @objc public func ping(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(PingArgs.self)
    invoke.resolve(["value": args.value ?? ""])
  }
  
  @objc public func getDeviceInfo(_ invoke: Invoke) throws {
    try deviceInfoHandler.getDeviceInfo(invoke)
  }
  
  @objc public func getNetworkInfo(_ invoke: Invoke) throws {
    try deviceInfoHandler.getNetworkInfo(invoke)
  }
  
  @objc public func getBatteryInfo(_ invoke: Invoke) throws {
    try deviceInfoHandler.getBatteryInfo(invoke)
  }
  
  @objc public func enterImmersive(_ invoke: Invoke) throws {
    try immersiveHandler.enterImmersive(invoke)
  }
  
  @objc public func exitImmersive(_ invoke: Invoke) throws {
    try immersiveHandler.exitImmersive(invoke)
  }
  
  @objc public func setBarStyle(_ invoke: Invoke) throws {
    try navbarStyleHandler.setBarStyle(invoke)
  }
  
  @objc public func lockOrientation(_ invoke: Invoke) throws {
    guard let args = try? invoke.parseArgs(LockArgs.self) else {
      invoke.reject("Invalid arguments")
      return
    }
    try orientationHandler.lockOrientation(invoke, orientation: args.orientation)
  }
  
  @objc public func unlockOrientation(_ invoke: Invoke) throws {
    try orientationHandler.unlockOrientation(invoke)
  }
  
  @objc public func showToast(_ invoke: Invoke) throws {
    try toastHandler.showToast(invoke)
  }
}

@_cdecl("init_plugin_device")
func initPlugin() -> Plugin {
  return DevicePlugin()
}