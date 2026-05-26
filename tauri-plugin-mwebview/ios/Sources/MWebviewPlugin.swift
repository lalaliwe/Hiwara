import UIKit
import WebKit
import TauriPluginIOS

/// Tauri 插件入口 - 移动端 WebView 支持
@objc(MWebviewPlugin) public class MWebviewPlugin: Plugin {
    private var webviewHandler: WebviewHandler?

    /// Ping - 测试插件桥接
    @objc func ping(_ invoke: Invoke) throws {
        let response = PluginResponse.data(["success": true, "message": "MWebview plugin is alive on iOS"])
        invoke.resolve(response)
    }

    /// 创建嵌入式 WebView
    @objc func createWebview(_ invoke: Invoke) throws {
        guard let url = invoke.getString("url") else {
            invoke.reject("URL is required")
            return
        }
        let x = invoke.getDouble("x") ?? 0.0
        let y = invoke.getDouble("y") ?? 0.0
        let width = invoke.getDouble("width") ?? 0.0
        let height = invoke.getDouble("height") ?? 0.0
        let transparent = invoke.getBool("transparent") ?? false

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
                let response = PluginResponse.data(["success": true])
                invoke.resolve(response)
            } else {
                invoke.reject(error ?? "Failed to create webview")
            }
        }
    }

    /// 更新 WebView 边界
    @objc func updateWebviewBounds(_ invoke: Invoke) throws {
        let x = invoke.getDouble("x") ?? 0.0
        let y = invoke.getDouble("y") ?? 0.0
        let width = invoke.getDouble("width") ?? 0.0
        let height = invoke.getDouble("height") ?? 0.0

        webviewHandler?.updateBounds(
            x: CGFloat(x),
            y: CGFloat(y),
            width: CGFloat(width),
            height: CGFloat(height)
        )

        let response = PluginResponse.data(["success": true])
        invoke.resolve(response)
    }

    /// 销毁 WebView
    @objc func destroyWebview(_ invoke: Invoke) throws {
        webviewHandler?.destroy()

        let response = PluginResponse.data(["success": true])
        invoke.resolve(response)
    }

    /// 注入 JavaScript 脚本（页面加载后）
    @objc func injectScript(_ invoke: Invoke) throws {
        guard let script = invoke.getString("script") else {
            invoke.reject("Script is required")
            return
        }

        webviewHandler?.injectScript(script: script) { success, error in
            if success {
                let response = PluginResponse.data(["success": true])
                invoke.resolve(response)
            } else {
                invoke.reject(error ?? "Failed to inject script")
            }
        }
    }

    /// 注入初始化脚本/CSS（页面加载前）
    @objc func injectInitScript(_ invoke: Invoke) throws {
        guard let cssRules = invoke.getString("cssRules") else {
            invoke.reject("cssRules is required")
            return
        }

        // 构建注入 CSS 的 JavaScript
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

        let response = PluginResponse.data(["success": true])
        invoke.resolve(response)
    }

    /// WebView 后退
    @objc func webviewGoBack(_ invoke: Invoke) throws {
        webviewHandler?.goBack()

        let response = PluginResponse.data(["success": true])
        invoke.resolve(response)
    }

    /// 检查能否后退
    @objc func webviewCanGoBack(_ invoke: Invoke) throws {
        let canGoBack = webviewHandler?.canGoBack() ?? false
        let response = PluginResponse.data(["canGoBack": canGoBack])
        invoke.resolve(response)
    }
}
