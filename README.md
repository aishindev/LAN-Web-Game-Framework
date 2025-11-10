### Introduction

Framework for creating web LAN games, based on Node.js / Express, Socket.io and React.

The ultimate goal of the project is for you to be able to download a framework to solve the boring parts (login, connecting the people, etc.) so so that you can concentrate 100% on creating your game.
### How to install?

1. Make a GitHub clone or download the zip.
---
2. Backend
-  Open the first terminal in the project and enter in the folder backend/
-  Make an npm i
-  Create an .env file and fill in the information based on the .env.EXAMPLE file
-  You can now make an node app.js
---
3. Frontend
-  Open the second terminal in the project and enter in the folder frontend/
- Make an npm i
- You can now make an npm run dev
---
4. Now, with the first terminal running the backend and the second running the frontend, everything should work.
5. The database starts with 3 default users: robert, jhon, pedro; all of these users have the password 1234. If you want to make more users, you can use the scripts for testing that are in backend/database/forTesting.js. There is no other option to create users outside of this.

### General API System

- Green: Actually working.
- Red: Future features.

![image alt](https://github.com/aishindev/LWGF/blob/main/readme_files/General_API_System.png)

### Database

- Green: Actually working.
- Red: Future features.

![image alt](https://github.com/aishindev/LWGF/blob/main/readme_files/Database_tables.png)

