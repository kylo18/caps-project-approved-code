<?php

namespace Modules\Support\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;

class AIController extends Controller
{
    /**
     * Handle chat request from the frontend and proxy to AI service.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'messages' => 'required|array|max:21',
            'messages.*.role' => 'required|string|in:user,assistant,system',
            'messages.*.content' => 'required|string|max:2000',
            'model' => 'nullable|string|in:lfm2-350m,tinyllama-1.1b,llama-3.2-1b,qwen-2.5-1.5b,deepseek-r1-1.5b'
        ]);

        try {
            // Internal URL for the AI service. 
            $aiServiceUrl = config('services.ai.url', 'http://ai-service:5000/generate');
            $selectedModel = $request->model ?? 'lfm2-350m';

            Log::info('AI Request:', [
                'url' => $aiServiceUrl,
                'model' => $selectedModel,
                'message_count' => count($request->messages)
            ]);

            $response = Http::timeout(60)->post($aiServiceUrl, [
                'messages' => $request->messages,
                'model' => $selectedModel
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error('AI Service Error:', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            // Return more specific error based on status code
            if ($response->status() === 503) {
                return response()->json([
                    'error' => 'The AI model is still loading. Please try again in a moment.'
                ], 503);
            }

            if ($response->status() === 400) {
                $errorData = $response->json();
                return response()->json([
                    'error' => $errorData['detail'] ?? 'Invalid request to AI service.'
                ], 400);
            }

            return response()->json([
                'error' => 'The AI service returned an error. Please try again later.'
            ], 503);

        } catch (ConnectionException $e) {
            Log::error('AI Service Connection Error:', [
                'message' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Cannot connect to AI service. Please ensure the AI service is running.',
                'type' => 'connection_error'
            ], 503);

        } catch (\Exception $e) {
            Log::error('AI Bridge Exception:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'An internal error occurred while processing your request.',
                'type' => 'server_error'
            ], 500);
        }
    }
}
