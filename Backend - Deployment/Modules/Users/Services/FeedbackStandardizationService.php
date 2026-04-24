<?php

namespace Modules\Users\Services;

use Modules\Users\Models\IssueType;
use Modules\Users\Models\IssueTypeVariant;
use Modules\Users\Models\SubjectNormalization;
use Modules\Users\Models\SubjectVariant;
use Modules\Users\Models\StatusNormalization;
use Modules\Users\Models\StatusVariant;
use Modules\Users\Models\CategoryNormalization;
use Modules\Users\Models\CategoryVariant;
use Illuminate\Support\Facades\Cache;

class FeedbackStandardizationService
{
    private static ?array $cache = null;

    /**
     * Get cached normalization data
     */
    private static function getCache(): array
    {
        if (self::$cache === null) {
            self::$cache = self::loadNormalizationData();
        }
        return self::$cache;
    }

    /**
     * Load normalization data from database with caching
     */
    private static function loadNormalizationData(): array
    {
        $cache = self::getCache();
        
        if (!empty($cache)) {
            return $cache;
        }

        $data = [
            'issue_types' => [],
            'statuses' => [],
            'categories' => [],
        ];

        // Load issue types and variants
        $issueTypes = IssueType::with('variants')->active()->get();
        foreach ($issueTypes as $issueType) {
            $data['issue_types'][$issueType->name] = $issueType->name;
            foreach ($issueType->variants as $variant) {
                $data['issue_types'][$variant->variant] = $issueType->name;
            }
        }

        // Load statuses and variants
        $statuses = StatusNormalization::with('variants')->get();
        foreach ($statuses as $status) {
            $data['statuses'][$status->normalized_name] = $status->normalized_name;
            foreach ($status->variants as $variant) {
                $data['statuses'][$variant->variant] = $status->normalized_name;
            }
        }

        // Load categories and variants
        $categories = CategoryNormalization::with('variants')->get();
        foreach ($categories as $category) {
            $data['categories'][$category->normalized_name] = $category->normalized_name;
            foreach ($category->variants as $variant) {
                $data['categories'][$variant->variant] = $category->normalized_name;
            }
        }

        // Cache for 1 hour
        Cache::put(self::CACHE_KEY, $data, 3600);

        return $data;
    }

    /**
     * Clear cache (useful after database updates)
     */
    public static function clearCache(): void
    {
        Cache::forget('feedback_normalization');
        self::$cache = null;
    }

    /**
     * Normalize value using database mappings
     */
    private static function normalizeValue(string $value, string $type): string
    {
        $value = trim($value);
        $cache = self::getCache();
        
        if (!isset($cache[$type])) {
            return $value;
        }
        
        foreach ($cache[$type] as $normalized => $variants) {
            if (in_array(strtolower($value), array_map('strtolower', $variants)) || 
                strtolower($value) === strtolower($normalized)) {
                return $normalized;
            }
        }
        
        return $value;
    }

    /**
     * Normalize issue type value
     */
    public static function normalizeIssueType(string $issueType): string
    {
        return self::normalizeValue($issueType, 'issue_types');
    }

    /**
     * Normalize status value
     */
    public static function normalizeStatus(string $status): string
    {
        return self::normalizeValue($status, 'statuses');
    }

    /**
     * Normalize category value
     */
    public static function normalizeCategory(string $category): string
    {
        return self::normalizeValue($category, 'categories');
    }

    
    /**
     * Normalize all feedback data
     */
    public static function normalizeFeedbackData(array $data): array
    {
        $normalized = $data;
        
        if (isset($normalized['issue_type'])) {
            $normalized['issue_type'] = self::normalizeIssueType($normalized['issue_type']);
        }
        
        if (isset($normalized['status'])) {
            $normalized['status'] = self::normalizeStatus($normalized['status']);
        }
        
        if (isset($normalized['category'])) {
            $normalized['category'] = self::normalizeCategory($normalized['category']);
        }
        
        return $normalized;
    }

    /**
     * Get all available normalized issue types
     */
    public static function getAvailableIssueTypes(): array
    {
        $cache = self::getCache();
        return array_keys($cache['issue_types'] ?? []);
    }

    
    /**
     * Get all available normalized statuses
     */
    public static function getAvailableStatuses(): array
    {
        $cache = self::getCache();
        return array_unique(array_merge(['New'], array_keys($cache['statuses'] ?? [])));
    }

    /**
     * Get all available normalized categories
     */
    public static function getAvailableCategories(): array
    {
        $cache = self::getCache();
        return array_keys($cache['categories'] ?? []);
    }
}
