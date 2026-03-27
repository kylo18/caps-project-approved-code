<?php

use Modules\Subjects\Models\Subject;
use Modules\Users\Models\User;
use Modules\PracticeExams\Models\PracticeExamSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// Helper to create a user manually since factories don't exist
function createTestUser($roleID, $programID = null) {
    // Ensure role exists
    DB::table('roles')->insertOrIgnore(['roleID' => $roleID, 'roleName' => 'Test Role']);
    // Ensure campus exists
    DB::table('campuses')->insertOrIgnore(['campusID' => 1, 'campusName' => 'Main Campus']);
    // Ensure status exists
    DB::table('statuses')->insertOrIgnore(['id' => 1, 'name' => 'pending']);
    
    if ($programID) {
        DB::table('programs')->insertOrIgnore(['programID' => $programID, 'programName' => 'Test Program']);
    }

    $userID = DB::table('users')->insertGetId([
        'userCode' => 'TEST-' . uniqid(),
        'firstName' => 'Test',
        'lastName' => 'User',
        'email' => uniqid() . '@test.com',
        'password' => bcrypt('password'),
        'roleID' => $roleID,
        'campusID' => 1,
        'programID' => $programID,
        'status_id' => 1,
        'isActive' => true,
    ]);

    return User::find($userID);
}

// Helper to create a subject manually
function createTestSubject($programID, $subjectName) {
    DB::table('programs')->insertOrIgnore(['programID' => $programID, 'programName' => 'Test Program']);
    DB::table('year_levels')->insertOrIgnore(['yearLevelID' => 1, 'name' => '1st Year']);

    $subjectID = DB::table('subjects')->insertGetId([
        'subjectCode' => 'CODE-' . uniqid(),
        'subjectName' => $subjectName,
        'programID' => $programID,
        'yearLevelID' => 1,
        'is_enabled_for_exam_questions' => true,
    ]);

    return Subject::find($subjectID);
}

// ──────────────────────────────────────────────
// GET /api/student/dashboard-subjects
// ──────────────────────────────────────────────

test('student can fetch grouped dashboard subjects', function () {
    $student = createTestUser(1, 1);
    Sanctum::actingAs($student);

    $subj1 = createTestSubject(1, 'Calculus 1');
    $subj2 = createTestSubject(1, 'Calculus 2');
    $subj3 = createTestSubject(6, 'English'); // GE subject (program 6)

    // Add practice exam settings so they appear in the dashboard
    PracticeExamSetting::create(['subjectID' => $subj1->subjectID, 'createdBy' => $student->userID]);
    PracticeExamSetting::create(['subjectID' => $subj2->subjectID, 'createdBy' => $student->userID]);
    PracticeExamSetting::create(['subjectID' => $subj3->subjectID, 'createdBy' => $student->userID]);

    $response = $this->getJson('/api/student/dashboard-subjects');

    $response->assertOk()
             ->assertJsonStructure([
                 'data' => [
                     '*' => ['baseName', 'subjectImage', 'versions'],
                 ],
             ]);

    // Calculus 1 & 2 must be merged into a single group
    $data = collect($response->json('data'));
    $calculusGroup = $data->firstWhere('baseName', 'Calculus');
    expect($calculusGroup)->not->toBeNull();
    expect($calculusGroup['versions'])->toHaveCount(2);

    $englishGroup = $data->firstWhere('baseName', 'English');
    expect($englishGroup)->not->toBeNull();
});

test('non-student cannot access dashboard subjects (role middleware denies)', function () {
    $faculty = createTestUser(2);
    Sanctum::actingAs($faculty);

    $this->getJson('/api/student/dashboard-subjects')->assertForbidden();
});

// ──────────────────────────────────────────────
// GET /api/subjects/{id}/exam-preview
// ──────────────────────────────────────────────

test('authenticated user can view exam preview', function () {
    $user = createTestUser(1, 1);
    Sanctum::actingAs($user);

    $subject = createTestSubject(1, 'Physics');
    
    PracticeExamSetting::create([
        'subjectID'          => $subject->subjectID,
        'total_items'        => 50,
        'easy_percentage'    => 30,
        'moderate_percentage'=> 50,
        'hard_percentage'    => 20,
        'enableTimer'        => true,
        'duration_minutes'   => 60,
        'createdBy'          => $user->userID,
    ]);

    $response = $this->getJson("/api/subjects/{$subject->subjectID}/exam-preview");

    $response->assertOk()
             ->assertJsonStructure([
                 'subjectName',
                 'subjectCode',
                 'totalQuestions',
                 'totalPoints',
                 'enableTimer',
                 'durationMinutes',
                 'difficultyBreakdown' => [
                     'easy'     => ['count', 'percentage'],
                     'moderate' => ['count', 'percentage'],
                     'hard'     => ['count', 'percentage'],
                 ],
             ])
             ->assertJsonPath('totalQuestions', 50)
             ->assertJsonPath('totalPoints', 100);
});

test('exam preview returns 404 when settings do not exist', function () {
    $user = createTestUser(1);
    Sanctum::actingAs($user);

    $subject = createTestSubject(1, 'History');

    $this->getJson("/api/subjects/{$subject->subjectID}/exam-preview")
         ->assertNotFound()
         ->assertJsonPath('message', 'Exam settings not found');
});

test('exam preview returns 404 for non-existent subject', function () {
    $user = createTestUser(1);
    Sanctum::actingAs($user);

    $this->getJson('/api/subjects/99999/exam-preview')->assertNotFound();
});

// ──────────────────────────────────────────────
// POST /api/subjects/{id}/upload-image
// ──────────────────────────────────────────────

test('faculty can upload a subject image', function () {
    Storage::fake('public');

    $faculty = createTestUser(2);
    Sanctum::actingAs($faculty);

    $subject = createTestSubject(1, 'Biology');

    $file = UploadedFile::fake()->image('biology.jpg');

    $response = $this->postJson("/api/subjects/{$subject->subjectID}/upload-image", [
        'image' => $file,
    ]);

    $response->assertOk()
             ->assertJsonPath('message', 'Image uploaded successfully')
             ->assertJsonStructure(['message', 'subjectImage']);

    // Confirm the path was stored in the DB
    expect($subject->fresh()->subjectImage)->not->toBeNull();

    // Confirm file exists in fake storage
    Storage::disk('public')->assertExists("subjects/{$file->hashName()}");
});

test('uploading a new image deletes the old image', function () {
    Storage::fake('public');

    $faculty = createTestUser(2);
    Sanctum::actingAs($faculty);

    $subject = createTestSubject(1, 'Chemistry');

    // Pre-populate an existing image
    $oldPath = 'subjects/old-image.jpg';
    Storage::disk('public')->put($oldPath, 'dummy content');
    
    $subject->subjectImage = $oldPath;
    $subject->save();

    $newFile = UploadedFile::fake()->image('new-image.jpg');

    $this->postJson("/api/subjects/{$subject->subjectID}/upload-image", [
        'image' => $newFile,
    ])->assertOk();

    // Old file must be gone
    Storage::disk('public')->assertMissing($oldPath);
});

test('student cannot upload a subject image', function () {
    $student = createTestUser(1);
    Sanctum::actingAs($student);

    $subject = createTestSubject(1, 'Math');

    $this->postJson("/api/subjects/{$subject->subjectID}/upload-image", [
        'image' => UploadedFile::fake()->image('test.jpg'),
    ])->assertForbidden();
});

test('upload without a file returns 422 validation error', function () {
    $faculty = createTestUser(2);
    Sanctum::actingAs($faculty);

    $subject = createTestSubject(1, 'Art');

    $this->postJson("/api/subjects/{$subject->subjectID}/upload-image", [])
         ->assertUnprocessable()
         ->assertJsonValidationErrors(['image']);
});

test('upload with invalid file type returns 422', function () {
    $faculty = createTestUser(2);
    Sanctum::actingAs($faculty);

    $subject = createTestSubject(1, 'Music');

    $this->postJson("/api/subjects/{$subject->subjectID}/upload-image", [
        'image' => UploadedFile::fake()->create('document.pdf', 500, 'application/pdf'),
    ])->assertUnprocessable()
      ->assertJsonValidationErrors(['image']);
});
