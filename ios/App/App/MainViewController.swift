import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Disable pinch-to-zoom on the WKWebView main scroll view.
        // The viewport meta (user-scalable=no) handles the top-level document,
        // but overflow:auto child elements create native UIScrollViews that
        // ignore the meta tag and need to be locked at the UIKit level.
        webView?.scrollView.minimumZoomScale = 1.0
        webView?.scrollView.maximumZoomScale = 1.0
    }
}
