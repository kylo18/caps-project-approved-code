1. Navigate to /home/ubuntu/CAPS/Testing_final

    cd /home/ubuntu/CAPS/Testing_final

2. Go to phpmyadmin and drop these tables:

    programs

    practice_exam_settings

3. Go inside migrations table and delete these fields:

    create_programs_table

    create_practice_exam_settings

4. Navigate to backend container and run this command:

    docker exec -it caps_backend bash

    php artisan migrate

    Note: It shoud migrate these tables:

    Sexes
    
    Students

    programs 

    practice_exam_settings

    jobs

    Note: Inside practice_exam_settings table, there should be another field named isEnabled. If that field exist, it means it is good to go. 

         Inside programs table, there should be a field named programName2. If that field exist, it is good to go.


5. Seed the tables so that students record will be seeded, run this command:

    php artisan db:seed

    Note: It will seed the sutdents table from csv files of students from

    Dapitan Campus

    Katipunan Campus 

    Tampilisan Campus

    It will also seed the fields to these tables:

    programs

    practice_exam_settings 

    Sexes

6. Go to phpmyadmin if the changes are applied. 

    