import SwiftRs
import Tauri
import UIKit
import WebKit

class NavbarStyleState {
    static let shared = NavbarStyleState()
    var style: String = "dark"
    var statusBarColor: UIColor? = nil
    var navigationBarColor: UIColor? = nil
}

class SetStyleArgs: Decodable {
    let style: String?
    let target: String?
    let statusBarColor: String?
    let navigationBarColor: String?
}

class NavbarStyleHandler: NSObject {
    
    func setBarStyle(_ invoke: Invoke) throws {
        guard let args = try? invoke.parseArgs(SetStyleArgs.self) else {
            invoke.reject("Invalid arguments")
            return
        }
        
        let style = args.style ?? "dark"
        let statusBarColorHex = args.statusBarColor
        let navigationBarColorHex = args.navigationBarColor
        
        NavbarStyleState.shared.style = style
        
        if let statusBarHex = statusBarColorHex {
            NavbarStyleState.shared.statusBarColor = hexToUIColor(statusBarHex)
        }
        
        if let navigationBarHex = navigationBarColorHex {
            NavbarStyleState.shared.navigationBarColor = hexToUIColor(navigationBarHex)
        }
        
        DispatchQueue.main.async {
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first(where: { $0.isKeyWindow }),
               let rootVC = window.rootViewController {
                rootVC.setNeedsStatusBarAppearanceUpdate()
                
                if let statusBarColor = NavbarStyleState.shared.statusBarColor {
                    if #available(iOS 13.0, *) {
                        let statusBarFrame = window.windowScene?.statusBarManager?.statusBarFrame ?? CGRect.zero
                        if !statusBarFrame.isEmpty {
                            let statusBarView = UIView(frame: statusBarFrame)
                            statusBarView.backgroundColor = statusBarColor
                            window.addSubview(statusBarView)
                        }
                    }
                }
                
                if let navigationBarColor = NavbarStyleState.shared.navigationBarColor {
                    UITabBar.appearance().barTintColor = navigationBarColor
                    UITabBar.appearance().isTranslucent = false
                    
                    UINavigationBar.appearance().barTintColor = navigationBarColor
                    UINavigationBar.appearance().isTranslucent = false
                }
            }
            invoke.resolve(["success": true])
        }
    }
    
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
        
        if hexSanitized.count == 8 {
            let alpha = CGFloat((rgb & 0xFF000000) >> 24) / 255.0
            return UIColor(red: r, green: g, blue: b, alpha: alpha)
        }
        
        return UIColor(red: r, green: g, blue: b, alpha: a)
    }
}
