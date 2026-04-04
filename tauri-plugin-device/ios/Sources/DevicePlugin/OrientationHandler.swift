import Foundation
import UIKit
import Tauri

struct LockArgs: Decodable {
    let orientation: String
}

class OrientationHandler: NSObject {

    func lockOrientation(_ invoke: Invoke, orientation: String) throws {
        var interfaceOrientation: UIInterfaceOrientation
        
        switch orientation.lowercased() {
        case "landscape":
            interfaceOrientation = .landscapeRight
        case "portrait":
            interfaceOrientation = .portrait
        default:
            interfaceOrientation = .portrait
        }
        
        DispatchQueue.main.async {
            UIDevice.current.setValue(Int(interfaceOrientation.rawValue), forKey: "orientation")
            UIViewController.attemptRotationToDeviceOrientation()
        }
        
        invoke.resolve(["success": true])
    }
    
    func unlockOrientation(_ invoke: Invoke) throws {
        DispatchQueue.main.async {
            UIDevice.current.setValue(Int(UIInterfaceOrientation.unknown.rawValue), forKey: "orientation")
            UIViewController.attemptRotationToDeviceOrientation()
        }
        
        invoke.resolve(["success": true])
    }
}
