package com.attasbih.app;

import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SafeArea")
public class SafeAreaPlugin extends Plugin {

    @PluginMethod
    public void getInsets(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            View rootView = getActivity().getWindow().getDecorView();
            WindowInsetsCompat windowInsets = ViewCompat.getRootWindowInsets(rootView);
            float density = getContext().getResources().getDisplayMetrics().density;

            int bottomPx = 0;
            int topPx = 0;

            if (windowInsets != null) {
                Insets navInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
                Insets statusInsets = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
                bottomPx = navInsets.bottom;
                topPx = statusInsets.top;
            }

            JSObject result = new JSObject();
            result.put("bottom", Math.round(bottomPx / density));
            result.put("top", Math.round(topPx / density));
            call.resolve(result);
        });
    }
}
