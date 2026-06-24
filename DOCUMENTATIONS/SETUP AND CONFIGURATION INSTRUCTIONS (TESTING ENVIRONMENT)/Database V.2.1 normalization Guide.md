1. Navigate to /home/ubuntu/CAPS/Testing_final (NOTE: Navigate to the actual production path if deploying to prod!!)

    cd /home/ubuntu/CAPS/Testing_final (NOTE: Navigate to the actual production path if deploying to prod!!)

2. Type This command:

    - git branch 

    - Ensure you are currently in this branch:

    * VulnerabilityPatch

    - If you are inside that branch, proceed to step 3. If not proceed to the next step below

    - If you are not inside that branch, type this command:

    - git switch VulnerabilityPatch

    - Recheck by typing, <git branch>

    - You should be inside, <* VulnerabilityPatch>

    - Proceed to step 3

3. (SKIP THIS PART IN PRODUCTION!!) Navigate to the backend container and randomize first the answer

    docker exec -it caps_backend bash

    (NOTE: SKIP THIS PART IN PRODUCTION!!): php artisan choices:randomize-correct 

4. Run the script for migrating and seeding the necessary data in the database:

    - ./db_update.sh

    NOTE: THIS IS THE CHANGES ADDED IN V1.6

    user_code_reset_tokens:
        -email
        -token
        -created_at

    exam_attempts:
        -id
        -userId
        -subjectId
        -teacher_Id
        -type
        -question_ids
        -answers
        -total_points
        -started_at
        -expires_at
        -submitted_at
        -created_at
        -updated_at

5. Check the mentioned table in the database.

6. If all exist, then the migration and normalization is complete
