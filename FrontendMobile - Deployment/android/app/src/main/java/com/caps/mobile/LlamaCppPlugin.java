package com.caps.mobile;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "LlamaCpp")
public class LlamaCppPlugin extends Plugin {

    private static final String TAG = "LlamaCppPlugin";

    static {
        System.loadLibrary("llama-cpp");
    }

    private native int loadModelNative(String path, int nCtx, int nThreads);
    private native void generateNative(String prompt);
    private native void abortNative();
    private native void unloadModelNative();
    private native void setPluginInstance(Object instance);

    @Override
    public void load() {
        setPluginInstance(this);
    }

    @Override
    protected void handleOnDestroy() {
        unloadModelNative();
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        String modelPath = call.getString("modelPath");
        int nCtx = call.getInt("nCtx", 2048);
        int nThreads = call.getInt("nThreads", 4);

        if (modelPath == null || modelPath.isEmpty()) {
            call.reject("Model path is required");
            return;
        }

        File modelFile = new File(modelPath);
        if (!modelFile.exists()) {
            call.reject("Model file not found: " + modelPath);
            return;
        }

        // Bridge doesn't block UI here, model loading is reasonably fast on SSD
        int result = loadModelNative(modelFile.getAbsolutePath(), nCtx, nThreads);

        if (result == 0) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Failed to load model. Check NDK logs for details.");
        }
    }

    @PluginMethod
    public void generate(PluginCall call) {
        String prompt = call.getString("prompt");
        if (prompt == null || prompt.isEmpty()) {
            call.reject("Prompt is required");
            return;
        }

        call.setKeepAlive(true);
        generateNative(prompt);
        call.resolve(); // Resolving immediately because streaming happens via listeners
    }

    @PluginMethod
    public void abort(PluginCall call) {
        abortNative();
        call.resolve();
    }

    @PluginMethod
    public void unload(PluginCall call) {
        unloadModelNative();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    // 🚀 FIX: Accept byte[] to safely handle partial UTF-8 sequences
    void emitToken(byte[] bytes) {
        String token = new String(bytes, StandardCharsets.UTF_8);
        JSObject data = new JSObject();
        data.put("token", token);
        notifyListeners("onToken", data);
    }

    void emitComplete() {
        notifyListeners("onComplete", new JSObject());
    }

    void emitError(String error) {
        JSObject data = new JSObject();
        data.put("error", error);
        notifyListeners("onError", data);
    }
}
