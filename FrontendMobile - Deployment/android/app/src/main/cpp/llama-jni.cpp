#include <jni.h>
#include <string>
#include <vector>
#include <thread>
#include <atomic>
#include <mutex>
#include <android/log.h>

#include "llama.h"
#include "common.h"
#include "sampling.h"

#define LOG_TAG "LlamaCppJNI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static std::mutex g_mutex;
static struct llama_model * g_model = nullptr;
static struct llama_context * g_ctx = nullptr;
static struct common_sampler * g_sampler = nullptr;
static struct llama_batch g_batch;
static struct common_params_sampling g_sampling_params;
static std::atomic<bool> g_abort(false);
static std::thread * g_inference_thread = nullptr;

static JavaVM * g_jvm = nullptr;
static jobject g_plugin_instance = nullptr;

// Cached method IDs
static jmethodID mid_emitToken = nullptr;
static jmethodID mid_emitComplete = nullptr;
static jmethodID mid_emitError = nullptr;

extern "C" {

JNIEXPORT jint JNI_OnLoad(JavaVM * vm, void * reserved) {
    g_jvm = vm;
    JNIEnv * env;
    if (vm->GetEnv((void **) &env, JNI_VERSION_1_6) != JNI_OK) {
        return JNI_ERR;
    }
    return JNI_VERSION_1_6;
}

static void notify_token(const char * token_bytes, int len) {
    if (!g_jvm || !g_plugin_instance || !mid_emitToken) return;

    JNIEnv * env = nullptr;
    bool attached = false;
    if (g_jvm->GetEnv((void **) &env, JNI_VERSION_1_6) == JNI_EDETACHED) {
        if (g_jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) return;
        attached = true;
    }

    // Pass as byte array to avoid NewStringUTF crash on partial UTF-8 sequences
    jbyteArray jbytes = env->NewByteArray(len);
    env->SetByteArrayRegion(jbytes, 0, len, (const jbyte*)token_bytes);
    env->CallVoidMethod(g_plugin_instance, mid_emitToken, jbytes);
    env->DeleteLocalRef(jbytes);

    if (attached) g_jvm->DetachCurrentThread();
}

static void notify_complete() {
    if (!g_jvm || !g_plugin_instance || !mid_emitComplete) return;

    JNIEnv * env = nullptr;
    bool attached = false;
    if (g_jvm->GetEnv((void **) &env, JNI_VERSION_1_6) == JNI_EDETACHED) {
        if (g_jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) return;
        attached = true;
    }

    env->CallVoidMethod(g_plugin_instance, mid_emitComplete);
    if (attached) g_jvm->DetachCurrentThread();
}

static void notify_error(const char * error) {
    if (!g_jvm || !g_plugin_instance || !mid_emitError) return;

    JNIEnv * env = nullptr;
    bool attached = false;
    if (g_jvm->GetEnv((void **) &env, JNI_VERSION_1_6) == JNI_EDETACHED) {
        if (g_jvm->AttachCurrentThread(&env, nullptr) != JNI_OK) return;
        attached = true;
    }

    jstring jstr = env->NewStringUTF(error);
    env->CallVoidMethod(g_plugin_instance, mid_emitError, jstr);
    env->DeleteLocalRef(jstr);

    if (attached) g_jvm->DetachCurrentThread();
}

JNIEXPORT void JNICALL
Java_com_caps_mobile_LlamaCppPlugin_setPluginInstance(
    JNIEnv * env, jobject thiz, jobject instance) {
    
    if (g_plugin_instance) {
        env->DeleteGlobalRef(g_plugin_instance);
    }
    g_plugin_instance = env->NewGlobalRef(instance);

    // Cache method IDs once
    jclass cls = env->GetObjectClass(g_plugin_instance);
    mid_emitToken = env->GetMethodID(cls, "emitToken", "([B)V");
    mid_emitComplete = env->GetMethodID(cls, "emitComplete", "()V");
    mid_emitError = env->GetMethodID(cls, "emitError", "(Ljava/lang/String;)V");
}

JNIEXPORT jint JNICALL
Java_com_caps_mobile_LlamaCppPlugin_loadModelNative(
    JNIEnv * env, jobject thiz, jstring path, jint n_ctx, jint n_threads) {

    std::lock_guard<std::mutex> lock(g_mutex);

    if (g_model || g_ctx) {
        LOGE("Model already loaded, unload first");
        return -1;
    }

    const char * model_path = env->GetStringUTFChars(path, nullptr);
    if (!model_path) return -1;

    LOGI("Loading model: %s", model_path);

    llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0; // Android usually CPU-bound for llama.cpp core
    model_params.use_mmap = true;
    model_params.use_mlock = false;

    g_model = llama_model_load_from_file(model_path, model_params);
    env->ReleaseStringUTFChars(path, model_path);

    if (!g_model) return -1;

    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.n_ctx = n_ctx > 0 ? n_ctx : 2048;
    ctx_params.n_threads = n_threads > 0 ? n_threads : 4;
    ctx_params.n_threads_batch = ctx_params.n_threads;

    g_ctx = llama_init_from_model(g_model, ctx_params);
    if (!g_ctx) {
        llama_model_free(g_model);
        g_model = nullptr;
        return -1;
    }

    g_batch = llama_batch_init(ctx_params.n_ctx, 0, 1);

    g_sampling_params = common_params_sampling();
    g_sampling_params.top_k = 40;
    g_sampling_params.top_p = 0.95f;
    g_sampling_params.temp = 0.8f;
    g_sampling_params.min_p = 0.05f;
    g_sampling_params.seed = LLAMA_DEFAULT_SEED;
    g_sampling_params.generation_prompt.clear();

    g_sampler = common_sampler_init(g_model, g_sampling_params);
    
    LOGI("Model loaded successfully");
    return 0;
}

static void stop_inference_thread() {
    g_abort = true;
    if (g_inference_thread) {
        if (g_inference_thread->joinable()) {
            g_inference_thread->join();
        }
        delete g_inference_thread;
        g_inference_thread = nullptr;
    }
}

JNIEXPORT void JNICALL
Java_com_caps_mobile_LlamaCppPlugin_generateNative(
    JNIEnv * env, jobject thiz, jstring prompt) {

    if (!g_model || !g_ctx) {
        notify_error("Model not loaded");
        return;
    }

    // Stop previous work WITHOUT blocking UI if possible (simplified here)
    stop_inference_thread();
    g_abort = false;

    const char * prompt_str = env->GetStringUTFChars(prompt, nullptr);
    std::string prompt_copy(prompt_str ? prompt_str : "");
    env->ReleaseStringUTFChars(prompt, prompt_str);

    g_inference_thread = new std::thread([prompt_copy]() {
        LOGI("Starting inference");

        llama_memory_clear(llama_get_memory(g_ctx), true);
        common_sampler_reset(g_sampler);

        std::vector<llama_token> tokens = common_tokenize(g_ctx, prompt_copy, true, true);
        int n_ctx = llama_n_ctx(g_ctx);

        if (tokens.size() > n_ctx - 4) {
            notify_error("Prompt too long");
            return;
        }

        // 🚀 FIX: Batch prompt processing (much faster)
        common_batch_clear(g_batch);
        for (size_t i = 0; i < tokens.size(); ++i) {
            common_batch_add(g_batch, tokens[i], i, {0}, i == tokens.size() - 1);
        }

        if (llama_decode(g_ctx, g_batch) != 0) {
            notify_error("Prompt decode failed");
            return;
        }

        int n_past = tokens.size();

        // Generation loop
        while (n_past < n_ctx && !g_abort) {
            llama_token new_token_id = common_sampler_sample(g_sampler, g_ctx, -1);
            common_sampler_accept(g_sampler, new_token_id, true);

            if (llama_vocab_is_eog(llama_model_get_vocab(g_model), new_token_id)) break;

            // Get token piece safely
            std::string piece = common_token_to_piece(g_ctx, new_token_id, true);
            notify_token(piece.data(), piece.size());

            common_batch_clear(g_batch);
            common_batch_add(g_batch, new_token_id, n_past, {0}, true);
            n_past++;

            if (llama_decode(g_ctx, g_batch) != 0) {
                notify_error("Generation failed");
                return;
            }
        }

        if (!g_abort) notify_complete();
        LOGI("Inference finished");
    });
}

JNIEXPORT void JNICALL
Java_com_caps_mobile_LlamaCppPlugin_abortNative(JNIEnv * env, jobject thiz) {
    g_abort = true;
}

JNIEXPORT void JNICALL
Java_com_caps_mobile_LlamaCppPlugin_unloadModelNative(JNIEnv * env, jobject thiz) {
    stop_inference_thread();
    
    std::lock_guard<std::mutex> lock(g_mutex);

    if (g_sampler) { common_sampler_free(g_sampler); g_sampler = nullptr; }
    if (g_ctx) { llama_free(g_ctx); g_ctx = nullptr; }
    if (g_batch.token) { llama_batch_free(g_batch); g_batch = {}; }
    if (g_model) { llama_model_free(g_model); g_model = nullptr; }
    
    if (g_plugin_instance) {
        env->DeleteGlobalRef(g_plugin_instance);
        g_plugin_instance = nullptr;
    }
    LOGI("Model fully unloaded");
}

}
