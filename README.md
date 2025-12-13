## Introduction

This project is a template for creating web LAN games, based on Node.js / Express, Socket.io and React.

The ultimate goal of the project is for you to be able to download a template to solve the boring parts (login, connecting the people, etc.) so so that you can concentrate 100% on creating your game.

This project is still in beta, so errors may occur. If you encounter any, please let me know.

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
-  Open a second terminal in the project and enter in the folder frontend/
-  Make an npm i
-  Create an .env file and fill in the information based on the .env.EXAMPLE file
-  You can now make an npm run dev
---
4. Now, with the first terminal running the backend and the second running the frontend, everything should work.

### Create new game

This project is built using node js, react, socket io and SQLite, so you are expected to have a basic understanding of these technologies to complete these steps.

- Go to backend/database/forTesting.js > createNewGame()
1. You must create a new table to store your game information; this will store ALL the information for each individual game; keep this in mind.

- Go to frontend/src/pages/home/home.tsx
2. Add the game name to the gameNames variable in /home.

- Go to src/service/API/socketAPI
3. Create a new case in the switch statement with your game name in the startGame function, using the tic_tae_toe case as a template.

- Go to frontend/src/pages/game/game.tsx
4. Add your game name to the final switch statement in the code.

- Go to backend/app.js > io.on("connection")
5. Now you can create a new socket.on("your_game_name") based on the socket.on("tic_tae_toe") created in the backend; this will contain the instructions for how players will communicate with each other.

6. For the frontend, you can see and use the implementation in tictaetoe.tsx as a template.

7. After all these steps, you should be able to create a lobby, connect people to it, start a game, and send information through users within the game.

The goal of future updates will be to make this process faster, easier, and more understandable, as well as to make connections more stable and secure.

Even so, each update has a high chance of breaking your implementation, so thoroughly review the changes and decide if it's worth updating.

### General API System

- Green: Actually workin
- Red: Future features

![image alt](https://github.com/aishindev/LWGF/blob/main/readme_files/General_API_System.png)

### Database

- Green: Actually workin
- Red: Future features

![image alt](https://github.com/aishindev/LWGF/blob/main/readme_files/Database_tables.png)
