import SwiftRs
import Tauri
import UIKit
import WebKit

// Global state to hold the current style and colors
class NavbarStyleState {
    static let shared = NavbarStyleState()
    var style: String = "dark" // "light" or "dark"
    var statusBarColor: UIColor? = nil
    var navigationBarColor: UIColor? = nil
}

class NavbarStylePlugin: Plugin {
    
    @objc public func setBarStyle(_ invoke: Invoke) throws {
        guard let args = invoke.args as? [String: Any] else {
            invoke.reject("Invalid arguments")
            return
        }
        
        let style = args["style"] as? String ?? "dark"
        let statusBarColorHex = args["statusBarColor"] as? String
        let navigationBarColorHex = args["navigationBarColor"] as? String
        
        NavbarStyleState.shared.style = style
        
        // Parse and set colors if provided
        if let statusBarHex = statusBarColorHex {
            NavbarStyleState.shared.statusBarColor = hexToUIColor(statusBarHex)
        }
        
        if let navigationBarHex = navigationBarColorHex {
            NavbarStyleState.shared.navigationBarColor = hexToUIColor(navigationBarHex)
        }
        
        DispatchQueue.main.async {
            // Trigger status bar update
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first(where: { $0.isKeyWindow }),
               let rootVC = window.rootViewController {
                rootVC.setNeedsStatusBarAppearanceUpdate()
                
                // Set status bar background color
                if let statusBarColor = NavbarStyleState.shared.statusBarColor {
                    // iOS 13+ uses statusBarManager in UIWindowScene
                    if #available(iOS 13.0, *) {
                        let statusBarFrame = window.windowScene?.statusBarManager?.statusBarFrame ?? CGRect.zero
                        if !statusBarFrame.isEmpty {
                            let statusBarView = UIView(frame: statusBarFrame)
                            statusBarView.backgroundColor = statusBarColor
                            window.addSubview(statusBarView)
                        }
                    }
                }
                
                // Set navigation bar (tab bar) background color
                if let navigationBarColor = NavbarStyleState.shared.navigationBarColor {
                    // Update tab bar appearance
                    UITabBar.appearance().barTintColor = navigationBarColor
                    UITabBar.appearance().isTranslucent = false
                    
                    // For navigation controller
                    UINavigationBar.appearance().barTintColor = navigationBarColor
                    UINavigationBar.appearance().isTranslucent = false
                }
            }
            invoke.resolve(["success": true])
        }
    }
    
    // Helper function to convert hex string to UIColor
    private func hexToUIColor(_ hex: String) -> UIColor? {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else {
            return nil
        }
        
        let r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let b = CGFloat(rgb & 0x0000FF) / 255.0
        let a: CGFloat = 1.0
        
        // Handle 8-character hex (with alpha)
        if hexSanitized.count == 8 {
            let alpha = CGFloat((rgb & 0xFF000000) >> 24) / 255.0
            return UIColor(red: r, green: g, blue: b, alpha: alpha)
        }
        
        return UIColor(red: r, green: g, blue: b, alpha: a)
    }
}

// Extension to control the status bar style based on the global state
extension UIViewController {
    override var preferredStatusBarStyle: UIStatusBarStyle {
        if NavbarStyleState.shared.style == "light" {
            return .lightContent // White text
        }
        return .darkContent // Black text (iOS 13+)
    }
    
    // Override for child view controllers
    open override var childForStatusBarStyle: UIViewController? {
        return children.first
    }
}

@_cdecl("init_plugin_navbar_style")
func initPlugin() -> Plugin {
    return NavbarStylePlugin()
}
