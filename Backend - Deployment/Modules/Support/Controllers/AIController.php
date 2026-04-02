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
            'messages' => 'required|array|max:30',
            'messages.*.role' => 'required|string|in:user,assistant,system',
            'messages.*.content' => 'required|string|max:2000',
            'model' => 'nullable|string|in:lfm2-350m,llama-3.2-1b,qwen-2.5-1.5b,qwen-3-0.6b,qwen-3-1.7b,deepseek-r1-1.5b,tinyllama-1.1b',
            'thinking' => 'nullable|boolean',
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

            $response = Http::timeout(90)->post($aiServiceUrl, [
                'messages' => $request->messages,
                'model' => $selectedModel,
                'thinking' => (bool) $request->boolean('thinking'),
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
                $detail = $response->json()['error'] ?? 'Model still loading';
                return response()->json([
                    'error' => $detail,
                    'type' => 'loading_error'
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

    /**
     * Check if AI service is online.
     */
    public function status()
    {
        try {
            $statusUrl = config('services.ai.url', 'http://ai-service:5000/generate');
            // Assuming the status endpoint is / (root) or we just check connectivity
            $response = Http::timeout(5)->get(str_replace('/generate', '/', $statusUrl));
            
            return response()->json([
                'online' => $response->successful(),
                'status' => $response->status(),
                'service' => 'ai-bridge'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'online' => false,
                'error' => 'Service unreachable',
                'service' => 'ai-bridge'
            ], 503);
        }
    }
}
