package com.attasbih.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppIconPlugin.class);
        registerPlugin(SafeAreaPlugin.class);
        // Opt into edge-to-edge: the WebView draws behind system bars.
        // WindowInsetsCompat then reports the real inset values so JS
        // can pad BottomNav and body accordingly.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);
        // Disable pinch-to-zoom in the WebView (viewport meta + CSS touch-action
        // already block it on web/PWA/iOS; this is belt-and-suspenders for Android).
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().getSettings().setSupportZoom(false);
            bridge.getWebView().getSettings().setBuiltInZoomControls(false);
            bridge.getWebView().getSettings().setDisplayZoomControls(false);
        }
    }
}
