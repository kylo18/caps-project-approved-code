NOTE: THIS IS THE INSTRUCTIONS FROM V.1.6 - 2.0 TRANSITION

1. Navigate to /home/ubuntu/CAPS/Testing_final

    cd /home/ubuntu/CAPS/Testing_final

2. Type This command:

    - git branch 

    - Ensure you are currently in this branch:

    * Environments/Test

    - If you are inside that branch, proceed to step 3. If not proceed to the next step below

    - If you are not inside that branch, type this command:

    git switch Environments/Test

    - Recheck by typing, <git branch>

    - You should be inside, <* Environments/Test>

    - Proceed to step 3

3. (SKIP THIS PART IN PRODUCTION!!) Navigate to the backend container and randomize first the answer

    docker exec -it caps_backend bash

    (NOTE: SKIP THIS PART IN PRODUCTION!!): php artisan choices:randomize-correct 


4. Run the script for migrating and seeding the necessary data in the database:


    - chmod u+x db_update.sh (NOTE: make sure this command runs first!!!!)
 
    - ./db_update.sh
   
    [V1.6]  NOTE: THIS IS THE CHANGES ADDED IN V1.6
            
        Another field will be added in the subjects table named:
        - is_enabled_for_exam_questions

    [V2.0] NOTE: THIS THE CHANGES FOR 2.0 DATABASE CHANGES SO PLEASE DOUBLE CHECK!!

        It will migrate the table named:


            classes:            //This is the name of the table  
                -classID        // This is the name of the fields, follow this format to read the table names and their fields 
                -facultyID
                -className
                -classCode
                -inviteToken
                -inviteLink
                -description
                -schedule
                -isActive

            class_enrollments: 
                -enrollmentID
                -classID
                -studentID
                -enrolledAt
                -unique_class_student

            class_personal_quizzes: 
                -classPersonalQuizID
                -classID
                -personalQuizID
                -startDate
                -deadlineDate

            class_quiz_attempts: 
                -attemptID
                -classID
                -personalQuizID
                -studentID
                -score
                -totalScore
                -accuracy
                -isCompleted
                -startedAt
                -completedAt

            personal_quizzes:
                -personalQuizID
                -title
                -description
                -instruction
                -quiz_type_id
                -subjectID
                -coverage_id
                -created_by
                -isArchived

            personal_quiz_questions:
                -personalQuizQuestionID
                -personalQuizID
                -questionID
                -personalQuizSubjectID
                -personalQuizUserID
                -personalQuizQuestionText
                -personalQuizImage
                -personalQuizScore
                -personalQuizCoverageId
                -personalQuizID
                -questionID


            class_personal_quiz_settings:
                -personalQuizSettingID
                -classPersonalQuizID
                -startTime
                -endTime
                -quizAttempts
                -quizTimer
                -quizTimerEnabled
                -shuffleQuestions
                -shuffleChoices
                -showCorrectAnswers
                -showCorrectQuestion
                -autoSubmitOnTimeout
                -allowLateSubmission
                -showScoreAfterQuiz
                -enableTimer
                -duration_minutes

            personal_quiz_choices:
                -personalQuizChoiceID
                -personalQuizQuestionID
                -choiceText
                -isCorrect
                -image
                -position

            student_quiz_attempts:
                -attemptID
                -personalQuizID
                -studentID
                -attemptNumber
                -startedAt
                -completedAt

            student_quiz_results: 
                -class_quiz_assignment_id
                -studentID
                -score
                -total_score
                -percentage
                -attempt_number
                -started_at
                -submitted_at
                -time_taken_seconds
                -isRecorded
                -isPassed

    [V.2.1] 06-14-2026
    This tables are added for 2.1

            user_code_reset_tokens:
                -email
                -token
                -created_at       

5. Check the mentioned table in the database.

6. If all exist, then the migration and normalization is complete



