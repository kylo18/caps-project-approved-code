# Bugs Encountered After Merging Junior Features and Production Code

## Website Side

- After logging in manually using `userCode` and password, the application gets stuck on a white screen. The browser console displays the following error:

```text
Uncaught ReferenceError: userInfo is not defined
    at h3 (index-W37Wg1e6.js:60:133228)
    at xr (index-W37Wg1e6.js:48:43284)
    at ih (index-W37Wg1e6.js:48:64536)
    at Ab (index-W37Wg1e6.js:48:75497)
    at $b (index-W37Wg1e6.js:48:117626)
    at S5 (index-W37Wg1e6.js:48:116690)
    at Hh (index-W37Wg1e6.js:48:116518)
    at Mb (index-W37Wg1e6.js:48:113545)
    at Jb (index-W37Wg1e6.js:48:123302)
    at MessagePort.ee (index-W37Wg1e6.js:25:1582)
```

- If using Google to log in, the login fails. The browser console displays the following error:

```text
Failed to load resource: the server responded with a status of 500 ()
```

## Mobile Side
- When logging in using google authentication, it fails. It will have this response in mobile app
```text
syntax error, unexpected variable "$remarks", expecting "function" or "const"
```
- When logging in using admin accounts, It cant log in. It should be able to log in and use the system depending on their role as long as the account is existing in the database
'''text
ID Code format must be like 00-X-00000.
'''
- Subjects are not loading even tho there are already exisitng subjects in the database
    - All functionalities that uses subjects are possibly having bugs because it cant be created and loaded
- Classes are not loading even tho there are already exisitng classes in the database
    - All functionalities that uses classes are possibly having bugs because it cant be created and loaded
- Cant export QE pdf's because there are no subjects that are not loaded
