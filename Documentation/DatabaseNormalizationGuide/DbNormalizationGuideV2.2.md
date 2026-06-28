1. Navigate to /home/ubuntu/CAPS/Testing_final (NOTE: Navigate to the actual production path if deploying to prod!!)

    cd /home/ubuntu/CAPS/Testing_final (NOTE: Navigate to the actual production path if deploying to prod!!)

2. Type This command:

    - git branch 

    - Ensure you are currently in this branch:

    * Environments/Test

    - If you are inside that branch, proceed to step 3. If not proceed to the next step below

    - If you are not inside that branch, type this command:

    - git switch Environments/Test

    - Recheck by typing, <git branch>

    - You should be inside, <* Environments/Test>

    - Proceed to step 3

3. (SKIP THIS PART IN PRODUCTION!!) Navigate to the backend container and randomize first the answer

    (NOTE: SKIP THIS PART IN PRODUCTION!!): php artisan choices:randomize-correct 
    
    docker exec -it caps_backend bash

4. Run the script for migrating and seeding the necessary data in the database:
    
    - chmod u+x db_update.sh
    - ./db_update.sh
    
    Note: If those two commands above won't run run this following:

    - docker exec -it <name of the backend container> bash
    - php artisan migrate
    - php artisan db:seed

    [V.2.1] 06-14-2026
    This tables are added for 2.1

            user_code_reset_tokens:
                -email
                -token
                -created_at       

5. Check the mentioned table in the database.

6. If all exist, then the migration and normalization is complete