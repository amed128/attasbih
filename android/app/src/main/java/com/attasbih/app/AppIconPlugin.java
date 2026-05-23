package com.attasbih.app;

import android.content.ComponentName;
import android.content.pm.PackageManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    private static final Map<String, String> ALIASES = new HashMap<String, String>() {{
        put("AppIconDark", ".MainActivityDark");
        put("AppIconBlue", ".MainActivityBlue");
    }};
    private static final String DEFAULT_ACTIVITY = ".MainActivity";

    @PluginMethod
    public void setIcon(PluginCall call) {
        String name = call.getString("name");
        String pkg = getContext().getPackageName();
        PackageManager pm = getContext().getPackageManager();

        String targetSuffix = (name != null) ? ALIASES.get(name) : DEFAULT_ACTIVITY;
        if (targetSuffix == null) {
            call.reject("Unknown icon name: " + name);
            return;
        }

        List<String> allSuffixes = Arrays.asList(
            DEFAULT_ACTIVITY,
            ".MainActivityDark",
            ".MainActivityBlue"
        );

        for (String suffix : allSuffixes) {
            int state = suffix.equals(targetSuffix)
                ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            pm.setComponentEnabledSetting(
                new ComponentName(pkg, pkg + suffix),
                state,
                PackageManager.DONT_KILL_APP
            );
        }

        call.resolve();
    }
}
