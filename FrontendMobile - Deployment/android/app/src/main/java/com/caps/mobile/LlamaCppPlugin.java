package com.caps.mobile;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
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

        Log.d(TAG, "loadModel called with path: " + modelPath);

        String resolvedPath = resolvePath(modelPath);
        if (resolvedPath == null) {
            call.reject("Failed to resolve model path: " + modelPath);
            return;
        }

        Log.d(TAG, "Resolved path: " + resolvedPath);

        File modelFile = new File(resolvedPath);
        if (!modelFile.exists()) {
            Log.e(TAG, "Model file not found: " + resolvedPath);
            call.reject("Model file not found: " + resolvedPath);
            return;
        }

        long fileSize = modelFile.length();
        Log.d(TAG, "Model file size: " + fileSize + " bytes");

        if (fileSize == 0) {
            Log.e(TAG, "Model file is empty: " + resolvedPath);
            call.reject("Model file is empty: " + resolvedPath);
            return;
        }

        int result = loadModelNative(resolvedPath, nCtx, nThreads);

        if (result == 0) {
            Log.d(TAG, "Model loaded successfully");
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            Log.e(TAG, "loadModelNative returned error code: " + result);
            call.reject("Failed to load model (error code: " + result + "). Check NDK logs for details.");
        }
    }

    private String resolvePath(String path) {
        if (path.startsWith("content://")) {
            Log.d(TAG, "Resolving content URI: " + path);
            return resolveContentUri(path);
        }

        if (path.startsWith("file://")) {
            String stripped = path.substring(7);
            Log.d(TAG, "Stripped file:// prefix: " + stripped);
            return stripped;
        }

        if (path.startsWith("/")) {
            return path;
        }

        Context context = getContext();
        if (context != null) {
            File dataDir = context.getFilesDir();
            File resolved = new File(dataDir, path);
            if (resolved.exists()) {
                Log.d(TAG, "Resolved relative path to: " + resolved.getAbsolutePath());
                return resolved.getAbsolutePath();
            }

            File cacheDir = context.getCacheDir();
            resolved = new File(cacheDir, path);
            if (resolved.exists()) {
                Log.d(TAG, "Resolved to cache dir: " + resolved.getAbsolutePath());
                return resolved.getAbsolutePath();
            }
        }

        return path;
    }

    private String resolveContentUri(String contentUriString) {
        try {
            Uri uri = Uri.parse(contentUriString);
            Context context = getContext();
            if (context == null) {
                Log.e(TAG, "Context is null, cannot resolve content URI");
                return null;
            }

            ContentResolver resolver = context.getContentResolver();
            String[] projection = { OpenableColumns.DISPLAY_NAME };

            String fileName = null;
            try (Cursor cursor = resolver.query(uri, projection, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex >= 0) {
                        fileName = cursor.getString(nameIndex);
                    }
                }
            }

            if (fileName == null) {
                fileName = "model_temp.gguf";
            }

            File dataDir = context.getFilesDir();
            File resolved = new File(dataDir, fileName);
            if (resolved.exists()) {
                Log.d(TAG, "Content URI resolved to existing file: " + resolved.getAbsolutePath());
                return resolved.getAbsolutePath();
            }

            String realPath = getRealPathFromURI(uri);
            if (realPath != null) {
                File realFile = new File(realPath);
                if (realFile.exists()) {
                    Log.d(TAG, "Content URI real path: " + realPath);
                    return realPath;
                }
            }

            Log.w(TAG, "Could not resolve content URI to file path, trying to copy to temp");
            return copyContentUriToFile(uri, fileName);
        } catch (Exception e) {
            Log.e(TAG, "Error resolving content URI: " + e.getMessage(), e);
            return null;
        }
    }

    private String copyContentUriToFile(Uri uri, String fileName) {
        Context context = getContext();
        if (context == null) return null;

        File tempFile = new File(context.getCacheDir(), fileName);
        
        try (ParcelFileDescriptor pfd = context.getContentResolver().openFileDescriptor(uri, "r")) {
            if (pfd == null) {
                Log.e(TAG, "Could not open content URI for reading");
                return null;
            }
            
            try (FileInputStream fis = new FileInputStream(pfd.getFileDescriptor());
                 FileOutputStream fos = new FileOutputStream(tempFile)) {
                FileChannel inChannel = fis.getChannel();
                FileChannel outChannel = fos.getChannel();
                inChannel.transferTo(0, inChannel.size(), outChannel);
            }
            
            Log.d(TAG, "Copied content URI to temp file: " + tempFile.getAbsolutePath());
            return tempFile.getAbsolutePath();
        } catch (IOException e) {
            Log.e(TAG, "Error copying content URI to file: " + e.getMessage());
            return null;
        }
    }

    private String getRealPathFromURI(Uri uri) {
        try {
            Context context = getContext();
            if (context == null) return null;

            ContentResolver resolver = context.getContentResolver();
            String[] projection = { "_data" };

            try (Cursor cursor = resolver.query(uri, projection, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int columnIndex = cursor.getColumnIndex("_data");
                    if (columnIndex >= 0) {
                        return cursor.getString(columnIndex);
                    }
                }
            }
        } catch (Exception e) {
            Log.d(TAG, "Could not get real path from URI: " + e.getMessage());
        }
        return null;
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
        call.resolve();
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
