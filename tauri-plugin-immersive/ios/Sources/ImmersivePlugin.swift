import SwiftRs
import Tauri
import UIKit
import WebKit

// 沉浸模式状态管理
class ImmersiveState {
    static let shared = ImmersiveState()
    var isImmersive: Bool = false
}

class ImmersivePlugin: Plugin {
    private var state = ImmersiveState.shared

    @objc public func enterImmersive(_ invoke: Invoke) throws {
        DispatchQueue.main.async {
            self.state.isImmersive = true
            self.updateBars()
            invoke.resolve(["success": true])
        }
    }

    @objc public func exitImmersive(_ invoke: Invoke) throws {
        DispatchQueue.main.async {
            self.state.isImmersive = false
            self.updateBars()
            invoke.resolve(["success": true])
        }
    }

    private func updateBars() {
        // 获取当前窗口的根视图控制器
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

// 扩展 UIViewController 以控制状态栏和 Home 指示器
extension UIViewController {
    @objc var preferredStatusBarHidden: Bool {
        return ImmersiveState.shared.isImmersive
    }

    @objc func prefersHomeIndicatorAutoHidden() -> Bool {
        return ImmersiveState.shared.isImmersive
    }
}

@_cdecl("init_plugin_immersive")
func initPlugin() -> Plugin {
    return ImmersivePlugin()
}
