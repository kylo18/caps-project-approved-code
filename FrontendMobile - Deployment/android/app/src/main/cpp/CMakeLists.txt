cmake_minimum_required(VERSION 3.22.1)

project("llama-cpp" VERSION 1.0.0 LANGUAGES C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# --------------------------------------------------------------------------
# CPU Optimizations for Android
# --------------------------------------------------------------------------

if(ANDROID_ABI STREQUAL "arm64-v8a")
    # Modern ARMv8.2-A optimizations (Dot Product, etc.)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=armv8.2-a+dotprod+crc")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=armv8.2-a+dotprod+crc")
    add_definitions(-DGGML_USE_NEON)
elseif(ANDROID_ABI STREQUAL "x86_64")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -march=x86-64-v3")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=x86-64-v3")
endif()

# --------------------------------------------------------------------------
# llama.cpp library
# --------------------------------------------------------------------------

set(LLAMA_SRC ${CMAKE_CURRENT_LIST_DIR}/llama)

# We want llama.cpp to build as a static library to be linked into our JNI shared lib
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "build examples" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "build server" FORCE)
set(LLAMA_BUILD_TESTS OFF CACHE BOOL "build tests" FORCE)

add_subdirectory(${LLAMA_SRC} build-llama)

# --------------------------------------------------------------------------
# JNI wrapper library
# --------------------------------------------------------------------------

add_library(llama-cpp SHARED llama-jni.cpp)

target_include_directories(llama-cpp PRIVATE
        ${LLAMA_SRC}
        ${LLAMA_SRC}/common
        ${LLAMA_SRC}/include
        ${LLAMA_SRC}/ggml/include)

target_link_libraries(llama-cpp
        llama
        common
        android
        log)
