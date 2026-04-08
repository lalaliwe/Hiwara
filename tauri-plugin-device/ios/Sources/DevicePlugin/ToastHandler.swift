import UIKit
import Tauri
import Foundation

class ToastArgs: Decodable {
    let message: String
    let duration: String?
}

class ToastHandler {
    func showToast(_ invoke: Invoke) throws {
        guard let args = try? invoke.parseArgs(ToastArgs.self) else {
            invoke.reject("Invalid arguments for showToast")
            return
        }
        
        DispatchQueue.main.async {
            self.createAndShowToast(
                message: args.message,
                duration: args.duration ?? "short"
            )
            
            // Return success response
            invoke.resolve(["success": true])
        }
    }
    
    private func createAndShowToast(message: String, duration: String) {
        // Determine duration - short is about 2 seconds, long is about 3.5 seconds
        let displayDuration: TimeInterval = duration.lowercased() == "long" ? 3.5 : 2.0
        
        // Get the key window's root view controller
        guard let viewController = UIApplication.shared.windows.first?.rootViewController else {
            print("Could not find root view controller to present toast")
            return
        }
        
        // Create the toast view
        let toastLabel = UILabel()
        toastLabel.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        toastLabel.textColor = UIColor.white
        toastLabel.textAlignment = .center
        toastLabel.font = UIFont.systemFont(ofSize: 16)
        toastLabel.text = message
        toastLabel.alpha = 0.0
        toastLabel.layer.cornerRadius = 8
        toastLabel.clipsToBounds = true
        toastLabel.numberOfLines = 0  // Allow multiple lines
        
        // Calculate size based on text
        let maxSize = CGSize(width: 300, height: 100)
        let requiredSize = message.boundingRect(
            with: maxSize,
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [NSAttributedString.Key.font: toastLabel.font],
            context: nil
        ).size
        
        // Adjust label frame
        let padding: CGFloat = 16
        let labelWidth = min(requiredSize.width + padding, maxSize.width)
        let labelHeight = min(requiredSize.height + padding/2, maxSize.height)
        
        toastLabel.frame = CGRect(
            x: (viewController.view.frame.size.width - labelWidth) / 2,
            y: viewController.view.frame.size.height - labelHeight - 100,
            width: labelWidth,
            height: labelHeight
        )
        
        // Add the toast to the view
        viewController.view.addSubview(toastLabel)
        
        // Fade in animation
        UIView.animate(
            withDuration: 0.3,
            delay: 0.0,
            options: .curveEaseOut,
            animations: {
                toastLabel.alpha = 1.0
            },
            completion: { _ in
                // Remove after duration
                UIView.animate(
                    withDuration: 0.3,
                    delay: displayDuration,
                    options: .curveEaseIn,
                    animations: {
                        toastLabel.alpha = 0.0
                    },
                    completion: { _ in
                        toastLabel.removeFromSuperview()
                    }
                )
            }
        )
    }
}