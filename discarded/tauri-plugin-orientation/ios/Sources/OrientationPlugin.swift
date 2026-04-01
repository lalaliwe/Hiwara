import Foundation
import UIKit
import Tauri

// 对应 Rust 的 LockRequest 结构体
struct LockArgs: Decodable {
    let orientation: String
}

@objc(OrientationPlugin)
public class OrientationPlugin: Plugin {

    @objc public func lock(_ invoke: Invoke) {
        // 1. 解析参数
        guard let args = try? invoke.parseArgs(LockArgs.self) else {
            invoke.reject("Invalid arguments")
            return
        }
        
        // 2. 获取目标方向
        let orientation = args.orientation.lowercased()
        var interfaceOrientation: UIInterfaceOrientation
        
        switch orientation {
        case "landscape":
            interfaceOrientation = .landscapeRight
        case "portrait":
            interfaceOrientation = .portrait
        default:
            interfaceOrientation = .portrait
        }
        
        // 3. 在主线程执行旋转 (iOS UI 操作必须在主线程)
        DispatchQueue.main.async {
            // 强制设置设备方向
            UIDevice.current.setValue(Int(interfaceOrientation.rawValue), forKey: "orientation")
            // 告诉系统尝试旋转
            UIViewController.attemptRotationToDeviceOrientation()
        }
        
        // 4. 返回成功
        invoke.resolve(["success": true])
    }
}
