# Bugs Encountered After Merging Junior Features and Production Code

## Website Side

- After logging in manually using `userCode` and password, the application gets stuck on a white screen. The browser console displays the following error:

```text
Uncaught ReferenceError: ProfileModalsHost is not defined
    at h3 (index-BRBf_m9C.js:60:188935)
    at mr (index-BRBf_m9C.js:48:43284)
    at oh (index-BRBf_m9C.js:48:64536)
    at Ab (index-BRBf_m9C.js:48:75497)
    at $b (index-BRBf_m9C.js:48:117626)
    at S5 (index-BRBf_m9C.js:48:116690)
    at Ph (index-BRBf_m9C.js:48:116518)
    at Mb (index-BRBf_m9C.js:48:113545)
    at Jb (index-BRBf_m9C.js:48:123302)
    at MessagePort.ee (index-BRBf_m9C.js:25:1582)
```

- If using Google to log in, the login fails. The browser console displays the following error:

```text
Uncaught ReferenceError: ProfileModalsHost is not defined
    at h3 (index-BRBf_m9C.js:60:188935)
    at mr (index-BRBf_m9C.js:48:43284)
    at oh (index-BRBf_m9C.js:48:64536)
    at Ab (index-BRBf_m9C.js:48:75497)
    at $b (index-BRBf_m9C.js:48:117626)
    at S5 (index-BRBf_m9C.js:48:116690)
    at Ph (index-BRBf_m9C.js:48:116518)
    at Mb (index-BRBf_m9C.js:48:113545)
    at Jb (index-BRBf_m9C.js:48:123302)
    at MessagePort.ee (index-BRBf_m9C.js:25:1582)
```

## Mobile Side
- When logging in using google authentication, it will be stuck in loading loop. It will have this response in mobile app
```text
Make sure to complete the guide at https://docs.expo.dev/push-notifications/fcm-credentials/ : Default FirebaseApp is not initialized in this process com.caps.mobile. Make sure to call FirebaseApp.initializeApp(Context) first.
```

- When logging in using admin accounts, It cant log in. It should be able to log in and use the system depending on their role as long as the account is existing in the database
'''text
ID Code format must be like 00-X-00000.
'''

- Can't update question
    - ```text
    Failed to update question
      ```

- CREATED QUIZ CANT BE SEEN 
    - There are quiz created but I can't see it

- Can't Create Class
    - ```text
    Failed to save class
    ```
    - All functionalties that is connected will have possible bugs unseen because classes cant be created 
     
- Can't enable practice exam settings
    - '''text
    Failed to save settings
    ```
