// Initial configuration
require('dotenv').config()

// Internal modules
const jwt = require("./src/controllers/jwt");
const { database } = require("./database/databaseController");
const { tictactoe } = require('./src/games/tic_tae_toe');

// External modules
var cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const cors = require("cors");

// Express setup
const express = require("express");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

let expressServer = app.listen(process.env.PORT, () => {
  console.log("\n- Server working in: " + `127.0.0.0:${process.env.PORT}.\n`);
}); 

// Security and accounts management
// /login
// /checktoken

const sessionsManager = require("./src/routes/sessionsManager");
app.use("/api", sessionsManager);

// Creation of lobby`s

app.post("/api/createLobby", async (req, res) => {
  let {token, lobbyName, lobbyPassword, lobbyGameName} = req.body;
  try {
    let tokenDecoded = jwt.validateToken(token);
    if(tokenDecoded === false) res.status(401).json({ errorType: "invalidToken", operationSuccess: false });
    let {operationSuccess, lobby_id} = await database.createLobby(tokenDecoded.id, lobbyName, lobbyPassword, lobbyGameName)
    if(operationSuccess) return res.status(200).json({lobby_id, operationSuccess: true}); 
    else return res.status(500).json({ errorType: "unexpectedError", operationSuccess: false });
  } catch (error) {   
    switch(error.errorType) {
      case "userNotFound": return res.status(400).json({ errorType: "userNotFound", operationSuccess: false});
      case "gameNameError": return res.status(400).json({ errorType: "gameNameError", operationSuccess: false})
      case "databaseError": return res.status(500).json({ errorType: "databaseError", operationSuccess: false});
      default: res.status(500).json({errorType: "unexpectedError", operationSuccess: false}); 
    }
  }
});

// Function`s to handle the communication between clients.

const io = new Server(expressServer, {
  cors: { origin: "http://localhost:5173/" },
  credentials: true,
});

io.use( async (socket, next) => {
  try {
    let userData = jwt.validateToken(socket.handshake.auth.authToken);
    socket.id = userData.id;
    socket.username = await database.getUsernameSQL(userData.id);
    next();
  } catch (error) {
    return;
  }
});

io.on("connection", (socket) => {
  let roomConnected = socket.rooms;

  /* ADMINISTRATIVE CONNECTIONS */

  socket.on("connectToPublicRoom", (message, callback) => {
    switch (message.room) {
      case "home": socket.join("home"); return callback(true);
      default: return callback({error: "roomNotFound"})
    }
  });

  socket.on("enterToLobby", async (message, callback) => {
    try {
      let {lobby_id, password} = message;
      let response = await database.enterLobby(socket.id, lobby_id, password);
      if(response.operationSuccess) {socket.join(`${lobby_id}`); return callback({lobby_id, operationSuccess: true});}
      else return callback({errorType: "unexpectedError", operationSuccess: false});
    } catch (error) {
      switch(error.errorType) {
        case "connectionAlreadyExist": return callback ({errorType: "connectionAlreadyExist", operationSuccess: false});
        case "invalidPassword": return callback({errorType: "invalidPassword", operationSuccess: false});
        case "lobbyNotFound": return callback({errorType: "lobbyNotFound", operationSuccess: false});
        case "databaseError": return callback({errorType: "databaseError", operationSuccess: false});
        default: return callback({errorType: "unexpectedError", operationSuccess: false});
      }
    }
  });

  socket.on("connectToLobby", async (message, callback) => {
    try {
      let {lobby_id} = message;
      let {gameName, isTheOwner} = await database.connectToLobby(socket.id, lobby_id);
      socket.join(`${lobby_id}`); 
      return callback({gameName, isTheOwner, operationSuccess: true});
    } catch (error) {
      switch(error.errorType) {
        case "connectionDontExist": return callback({errorType: "connectionDontExist", operationSuccess: false})
        case "databaseError": return callback({errorType: "databaseError", operationSuccess: false});
        case "gameNameNotFound": return callback({errorType: "gameNameNotFound", operationSuccess: false});
        default: return callback({errorType: "unexpectedError", operationSuccess: false});
      }
    }
  });

  socket.on("checkIfGameAlreadyStart", async (message, callback) => {
  try {
    const {lobby_id} = message;
    let {gameStarted} = await database.checkIfGameAlreadyStartedSQL(lobby_id)
    .catch((err) => {return callback({errorType: err.errorType, operationSuccess: false})});

    if(gameStarted) return callback({operationSuccess: true});
    else return callback({operationSuccess: false})
  } catch (error) {}
});
  
  /* INFORMATION INTERCHANGE CONNECTIONS */

  socket.on("chatModuleMessage", (message) => {
    if (roomConnected.has(message.room))
      socket.broadcast
        .to(`${message.room}`)
        .emit(
          "chatModuleMessage",
          JSON.stringify({
            room: message.room,
            username: socket.username,
            message: message.message,
          })
        );
  });

  socket.on("lobbyConfigChange", async (message, callback) => {
    let {lobby_id, change} = message;

    await database.checkIfUserIsLobbyOwnerSQL(socket.id, lobby_id)
    .catch(() => {callback({errorType: "notTheOwner", operationSuccess: false})});

    socket.broadcast.to(`${lobby_id}`).emit("lobbyConfigChange", { change });
  });

  /* GAME CONTROL CONNECTIONS */

  socket.on("tic_tae_toe", async (message, callback) => {
    try {
      let { lobby_id, purpose } = message;
      
      if (roomConnected.has(lobby_id)) {
        
        if(purpose === undefined) {return callback({errorType: "noPurpose", operationSuccess: false})}

        if(purpose === "createGame") {

          let {isTheOwner} = await database.checkIfUserIsLobbyOwnerSQL(socket.id, lobby_id)
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});

          if(!isTheOwner) return callback({errorType: "notTheOwner", operationSuccess: false})
            
          let gameAlreadyExist = await tictactoe.checkIfGameIsAlreadyCreatedSQL(database.db, lobby_id) 
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});

          if(!gameAlreadyExist) { return callback({errorType: "gameAlreadyExist", operationSuccess: false})}

          let response = await database.getUsersInsideLobbySQL(lobby_id)
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});
          
          let playerLimit = await database.checkPlayerLimitSQL("tic_tae_toe", lobby_id) 
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});

          if(response.length > playerLimit) return callback({errorType: "playerLimitSurpassed", operationSuccess: false});

          switch(message.gameMode) {
            case "normal": 
            var player_x = socket.id;
            var player_o = response[1].user_id;
            break;
            case "inverted": 
            var player_x = response[1].user_id;
            var player_o = socket.id;
            break;
            default: return callback({errorType: "gameModeDontExist", operationSuccess: false});
          }

          await tictactoe.createGame(database.db, lobby_id, player_x, player_o)
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});

          await database.markGameStartedSQL(lobby_id)
          .catch((err) => {return callback({errorType: err.errorType, operationSuccess: false})});

          return callback({operationSuccess: true})
        }

        if(purpose === "playerAction") {
          let {gameFinished} = await database.checkIfGameAlreadyFinishedSQL(lobby_id)
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});

          if(gameFinished) {
            return callback({errorType: "gameAlreadyFinished", operationSuccess: false})
          }

          let {victory} = await tictactoe.processChange(database.db, lobby_id, socket.id, message.move)
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});

          if(victory) {
            database.markGameFinishedSQL(lobby_id)
            .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});
            socket.broadcast.to(`${lobby_id}`).emit("tic_tae_toe", {
                enemyMove: message.move,
                enemyVictory: true,
            });
            callback({operationSuccess:true})
          }
          else {
            socket.broadcast.to(`${lobby_id}`).emit("tic_tae_toe", {
                enemyMove: message.move,
                enemyVictory: false,
            });
            callback({operationSuccess:true})
          }
        }

        if(purpose === "getDataFromGame") {
          let {turn, player_x, board_marked_position} = await tictactoe.getDataFromGameSQL(database.db, lobby_id)
          .catch((err) => { return callback({errorType: err.errorType, operationSuccess: false})});
          let player = ((socket.id === player_x) ?  1 : 2);
          let {gameFinished} = await database.checkIfGameAlreadyFinishedSQL(lobby_id);
          callback (response = { turn, board_marked_position, player, gameFinished})          
        }
      }      
    } catch (error) {
      console.log(error)
      return callback ({message: "Internal error", operationSuccess: false});
    }
  });
});
