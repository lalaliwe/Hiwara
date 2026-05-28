import UIKit
import WebKit

/// iOS 原生 WKWebView 管理器
class WebviewHandler: NSObject {
    private var webView: WKWebView?
    private var initScript: String?
    private var postScript: String?
    private var isPageLoaded = false

    /// 创建嵌入式 WKWebView
    /// 通过 addSubview 添加到主窗口，定位在 topBar 下方
    func createWebview(
        url: String,
        x: CGFloat,
        y: CGFloat,
        width: CGFloat,
        height: CGFloat,
        transparent: Bool,
        completion: @escaping (Bool, String?) -> Void
    ) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let keyWindow = windowScene.windows.first,
              let rootView = keyWindow.rootViewController?.view else {
            completion(false, "No root view found")
            return
        }

        // 配置 WKWebView
        let config = WKWebViewConfiguration()
        let userContentController = WKUserContentController()

        // 如果有初始化脚本，添加到文档开始注入
        if let script = initScript {
            let userScript = WKUserScript(
                source: script,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            userContentController.addUserScript(userScript)
        }

        config.userContentController = userContentController

        // 创建 WebView
        let webView = WKWebView(frame: CGRect(x: x, y: y, width: width, height: height), configuration: config)

        webView.isOpaque = !transparent
        if transparent {
            webView.backgroundColor = UIColor.clear
            webView.scrollView.backgroundColor = UIColor.clear
        }

        // 导航代理
        webView.navigationDelegate = self

        // 加载 URL
        if let nsUrl = URL(string: url) {
            let request = URLRequest(url: nsUrl)
            webView.load(request)
        } else {
            completion(false, "Invalid URL: \(url)")
            return
        }

        // 添加到主视图（最上层）
        rootView.addSubview(webView)

        self.webView = webView
        self.isPageLoaded = false

        completion(true, nil)
    }

    /// 更新位置和尺寸
    func updateBounds(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        guard let webView = webView else { return }
        webView.frame = CGRect(x: x, y: y, width: width, height: height)
    }

    /// 销毁 WebView
    func destroy() {
        webView?.stopLoading()
        webView?.removeFromSuperview()
        webView = nil
        initScript = nil
        postScript = nil
        isPageLoaded = false
    }

    /// 注入 JavaScript（页面加载前/后执行）
    /// 暂存脚本，在 didCommit/didFinish 时自动注入
    /// 同时立即尝试注入，确保在 SPA 初始化前 token 就绪
    func injectScript(script: String, completion: @escaping (Bool, String?) -> Void) {
        postScript = script

        // 立即尝试注入（无论页面是否加载完成），解决 SPA 初始化前 token 未就绪的竞态
        if let webView = webView {
            webView.evaluateJavaScript(script) { _, error in
                if let error = error {
                    print("[MWebview] Eager script injection failed: \(error.localizedDescription)")
                } else {
                    print("[MWebview] Script injected eagerly")
                }
            }
        }

        completion(true, nil)
    }

    /// 设置初始化脚本（在下一次页面加载时注入）
    func setInitScript(script: String) {
        self.initScript = script

        // 如果 WebView 已存在，立即将脚本添加到 userContentController
        // 修复：此前在 createWebview 之后调用 setInitScript 导致首次加载未注入 CSS
        if let webView = webView {
            let userScript = WKUserScript(
                source: script,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
            webView.configuration.userContentController.addUserScript(userScript)
            print("[MWebview] Init script added to existing WebView")
        }
    }

    /// 后退导航
    func goBack() {
        if webView?.canGoBack == true {
            webView?.goBack()
        }
    }

    /// 检查能否后退
    func canGoBack() -> Bool {
        return webView?.canGoBack ?? false
    }
}

// MARK: - WKNavigationDelegate
extension WebviewHandler: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isPageLoaded = false
    }

    /// 页面内容开始到达时注入 token（早于 didFinish，确保 SPA 初始化前 token 已就绪）
    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        if let script = postScript {
            webView.evaluateJavaScript(script, completionHandler: nil)
            print("[MWebview] Post-load script injected on didCommit (early)")
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isPageLoaded = true
        // 页面加载完成后再次注入 token 脚本（兜底，防止 didCommit 时脚本未就绪）
        if let script = postScript {
            webView.evaluateJavaScript(script, completionHandler: nil)
            print("[MWebview] Post-load script injected on didFinish (fallback)")
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        isPageLoaded = false
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        isPageLoaded = false
    }
}
