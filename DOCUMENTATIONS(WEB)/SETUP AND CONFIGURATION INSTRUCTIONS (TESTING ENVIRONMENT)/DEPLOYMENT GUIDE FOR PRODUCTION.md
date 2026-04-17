1. Navigate to the working finals, paste this code below

    cd /home/ubuntu/CAPS/Testing_final/

2. Check if the containers are running, type this below

    docker ps

    if no containers are running type:

    docker-compose up -d --build

    Wait until the containers are running, to confirm type:

    docker ps

    the conatiners should be running 

3. You need to remove the pictures. Type:

    rm -f /home/ubuntu/CAPS/docker-data/backend_pictures/*/*

4. Navigate to the backend container, type:

    docker exec -it caps_backend bash 

5. After that, make sure you fresh it. Type:

    php artisan migrate:fresh

6. Type this to seed it:

    php artisan db:seed 

7. Go to phpmyadmin, paste this url to your browser:

    http://18.142.190.113:8080/

8. click caps_db, it is located in the left side 

9. Find users table and click it

10. Delete all records

11. Register as Dean and you will be automatically approved

12. Log in using your registered Dean Account

