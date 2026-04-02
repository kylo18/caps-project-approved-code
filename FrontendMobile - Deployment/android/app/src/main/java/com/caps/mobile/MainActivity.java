package com.caps.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LlamaCppPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
