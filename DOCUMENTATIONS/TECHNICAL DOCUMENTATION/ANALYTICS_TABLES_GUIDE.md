# Analytics Tables & Requirements Guide

This document identifies all active tables in the Analytics module (consolidated in the **2026** migrations), their purpose, and the logic required to populate them.

## 1. Table Breakdown

| Table Name | Content / Purpose | Implementation Requirement ("What to do") |
| :--- | :--- | :--- |
| **`exam_attempts`** | Tracks a user's single exam session (start/end times, status). | Instantiate on exam start; update `finished_at` and `status` upon completion. |
| **`exam_results`** | Granular data for every question answered (correct/wrong, time spent). | Log each answer submission in real-time or bulk insert at the end. |
| **`exam_analytics`** | High-level summary (Overall score, Rank, Percentile, Improvement). | Post-exam calculation comparing current results with historical and peer data. |
| **`exam_topic_analytics`** | Score breakdown by topic (e.g., Algebra, Biology). | Post-exam aggregation of `exam_results` grouped by `topic_id`. |
| **`exam_difficulty_analytics`** | Performance by difficulty level (Easy, Moderate, Hard). | Post-exam aggregation of `exam_results` grouped by `difficulty`. |
| **`exam_recommendations`** | Automated study advice based on weak areas. | Heuristic logic to generate advice from Topic/Difficulty analytics. |
| **`lesson_views`** | Tracks engagement with learning materials. | Log entries whenever a user views a lesson or resource. |
| **`question_stats_daily`** | Global question performance (error rates, skip rates). | Update global counters for each question answered to identify "killer questions". |

---

## 2. Implementation Roadmap

### A. Fix Migration Conflicts
> [!IMPORTANT]
> Remove or merge the duplicate `exams` table migrations:
> - `2026_03_20_000001_create_exams_table.php` (References `subjectID`)
> - `2026_03_23_230757_create_exams_table.php` (References `id`)

### B. Controller Logic
Implement the core calculation logic (likely in `AnalyticsController` or a matching `AnalyticsService`):
1. **`computeScore`**: Triggered on exam completion to calculate overall and topic-wise scores.
2. **`updateStats`**: Real-time or batch updates to `question_stats_daily`.
3. **`generateRecommendations`**: Runs after score computing to identify weak topics (scores < 60%) and suggest lessons.

### C. Verification
Use the `AnalyticsTestSeeder` (or create a new one) to populate these tables with dummy data to verify the Analytics Dashboard and student reports.
