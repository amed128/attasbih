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
    }
}
