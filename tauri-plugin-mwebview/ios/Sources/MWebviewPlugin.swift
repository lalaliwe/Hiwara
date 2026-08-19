import UIKit
import WebKit
import SwiftRs
import Tauri

/// Tauri 插件入口 - 移动端 WebView 支持
class MWebviewPlugin: Plugin {
    private var webviewHandler: WebviewHandler?

    /// Ping - 测试插件桥接
    @objc func ping(_ invoke: Invoke) throws {
        invoke.resolve(["success": true, "message": "MWebview plugin is alive on iOS"])
    }

    /// 创建嵌入式 WebView
    @objc func createWebview(_ invoke: Invoke) throws {
        guard let args = try? invoke.parseArgs(CreateWebviewArgs.self) else {
            invoke.reject("URL is required")
            return
        }
        let url = args.url
        let x = args.x ?? 0.0
        let y = args.y ?? 0.0
        let width = args.width ?? 0.0
        let height = args.height ?? 0.0
        let transparent = args.transparent ?? false

        let handler = WebviewHandler()
        self.webviewHandler = handler

        handler.createWebview(
            url: url,
            x: CGFloat(x),
            y: CGFloat(y),
            width: CGFloat(width),
            height: CGFloat(height),
            transparent: transparent
        ) { success, error in
            if success {
                invoke.resolve(["success": true])
            } else {
                invoke.reject(error ?? "Failed to create webview")
            }
        }
    }

    /// 更新 WebView 边界
    @objc func updateWebviewBounds(_ invoke: Invoke) throws {
        guard let args = try? invoke.parseArgs(UpdateBoundsArgs.self) else {
            invoke.reject("Invalid bounds arguments")
            return
        }
        let x = args.x ?? 0.0
        let y = args.y ?? 0.0
        let width = args.width ?? 0.0
        let height = args.height ?? 0.0

        webviewHandler?.updateBounds(
            x: CGFloat(x),
            y: CGFloat(y),
            width: CGFloat(width),
            height: CGFloat(height)
        )

        invoke.resolve(["success": true])
    }

    /// 销毁 WebView
    @objc func destroyWebview(_ invoke: Invoke) throws {
        webviewHandler?.destroy()
        invoke.resolve(["success": true])
    }

    /// 注入 JavaScript 脚本（页面加载后）
    @objc func injectScript(_ invoke: Invoke) throws {
        guard let args = try? invoke.parseArgs(InjectScriptArgs.self) else {
            invoke.reject("Script is required")
            return
        }

        webviewHandler?.injectScript(script: args.script) { success, error in
            if success {
                invoke.resolve(["success": true])
            } else {
                invoke.reject(error ?? "Failed to inject script")
            }
        }
    }

    /// 注入初始化脚本/CSS（页面加载前）
    @objc func injectInitScript(_ invoke: Invoke) throws {
        guard let args = try? invoke.parseArgs(InjectInitScriptArgs.self) else {
            invoke.reject("cssRules is required")
            return
        }

        let cssRules = args.cssRules
        let script = """
        (function() {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `\(cssRules.replacingOccurrences(of: "`", with: "\\`"))`;
            document.head.appendChild(style);
            console.log('[MWebview] Initialization CSS injected');
        })();
        """

        webviewHandler?.setInitScript(script: script)
        invoke.resolve(["success": true])
    }

    /// WebView 后退
    @objc func webviewGoBack(_ invoke: Invoke) throws {
        webviewHandler?.goBack()
        invoke.resolve(["success": true])
    }

    /// 检查能否后退
    @objc func webviewCanGoBack(_ invoke: Invoke) throws {
        let canGoBack = webviewHandler?.canGoBack() ?? false
        invoke.resolve(["canGoBack": canGoBack])
    }
}

class CreateWebviewArgs: Decodable {
    let url: String
    let x: Double?
    let y: Double?
    let width: Double?
    let height: Double?
    let transparent: Bool?
}

class UpdateBoundsArgs: Decodable {
    let x: Double?
    let y: Double?
    let width: Double?
    let height: Double?
}

class InjectScriptArgs: Decodable {
    let script: String
}

class InjectInitScriptArgs: Decodable {
    let cssRules: String
}

@_cdecl("init_plugin_mwebview")
func initPlugin() -> Plugin {
    return MWebviewPlugin()
}
