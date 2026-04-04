import SwiftRs
import Tauri
import UIKit
import WebKit

class ImmersiveState {
    static let shared = ImmersiveState()
    var isImmersive: Bool = false
}

class ImmersiveHandler: NSObject {
    private var state = ImmersiveState.shared

    func enterImmersive(_ invoke: Invoke) throws {
        DispatchQueue.main.async {
            self.state.isImmersive = true
            self.updateBars()
            invoke.resolve(["success": true])
        }
    }

    func exitImmersive(_ invoke: Invoke) throws {
        DispatchQueue.main.async {
            self.state.isImmersive = false
            self.updateBars()
            invoke.resolve(["success": true])
        }
    }

    func load() {
        // Initialize if needed
    }
    
    private func updateBars() {
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first(where: { $0.isKeyWindow }),
           let rootVC = window.rootViewController {
            rootVC.setNeedsStatusBarAppearanceUpdate()
            if #available(iOS 11.0, *) {
                rootVC.setNeedsUpdateOfHomeIndicatorAutoHidden()
            }
        }
    }
}
