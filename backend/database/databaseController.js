var sqlite3 = require("sqlite3");

var bcrypt = require("bcrypt");

class databaseClass {
  db;
  #game_names = [];

  constructor() {
    this.db = new sqlite3.Database(
      "./database/database.db",
      sqlite3.OPEN_READWRITE,
      (err) => {
        if (err && err.code == "SQLITE_CANTOPEN") throw "DATABASE NOT FOUND";
        console.log("- Database started with no problems.\n");
      }
    );

    this.db.each(`SELECT game_name FROM game_names`, (error, row) => {
      if (error) throw new Error(error.message);
      this.#game_names.push(row.game_name);
    });
  }

  async loginUser(username, password) {
    let response = await this.getLoginInfoSQL(username)
    .catch((err) => {throw ({errorType: err.errorType})})
    let passwordMatch = await bcrypt.compare(password, response.hashPassword);
    if (passwordMatch) return { operationSuccess: true, userID: response.user_id, username: response.databaseUsername};
    else return { operationSuccess: false };
  }

  async createLobby(lobbyOwnerId, lobbyName, lobbyPassword, lobbyGameName) {
    await this.checkIfUserExistSQL(lobbyOwnerId)
    .catch((err) => {throw ({errorType: err.errorType})});
    
    let lobby_id = await this.createLobbySQL(lobbyOwnerId,lobbyName,lobbyPassword,lobbyGameName)
    .catch((err) => {throw ({errorType: err.errorType})});

    await this.createNewUserConnectedToLobbySQL(lobby_id, lobbyOwnerId)
    .catch((err) => {throw ({errorType: err.errorType})});

    return {operationSuccess: true, lobby_id};
  }

  /** 
  * Function to enter a lobby and save in the database that the user has permission to do so again in the future.
  */
  async enterLobby(user_id, lobby_id, password) {
    await this.compareLobbyPasswordSQL(lobby_id, password)
    .catch((err) => {throw ({errorType: err.errorType})});

    let response = await this.checkIfUserIsConnectedToLobbySQL(user_id, lobby_id)
    .catch((err) => {throw ({errorType: err.errorType})});
    
    if(response.connectionExist) throw ({errorType: "connectionAlreadyExist", operationSuccess: false})

    return await this.createNewUserConnectedToLobbySQL(lobby_id, user_id)
    .catch((err) => {throw ({errorType: err.errorType})});
  }

  /** 
  * Function to reconnect to the lobby later after using "enterLobby".
  */
  async connectToLobby(user_id, lobby_id) {
    await this.checkIfUserIsConnectedToLobbySQL(user_id, lobby_id)
    .catch((err) => {throw ({errorType: err.errorType})});

    let {isTheOwner} = await this.checkIfUserIsLobbyOwnerSQL(user_id, lobby_id)
    .catch((err) => {throw ({errorType: err.errorType})});

    let {gameName} = await this.getLobbyGameNameSQL(lobby_id)
    .catch((err) => {throw ({errorType: err.errorType})});

    return {isTheOwner, gameName}
  }  

  /*/////////////////////
  /////////SQL///////////
  /////////////////////*/

  ////////CREATE/////////

  createLobbySQL(owner_id, name, password, game_name) {
    return new Promise((resolve, reject) => {
      if (this.#game_names.includes(game_name) === false)
      return reject({errorType: "gameNameError"});
      this.db.run(
        `INSERT INTO lobby (owner, name, password, game_name) VALUES (?, ?, ?, ?)`,
        [owner_id, name, password, this.#game_names.indexOf(game_name) + 1],
        function (error) {
          if (error) return reject({ errorType: "databaseError"});
          else return resolve(this.lastID);  
        }
      );
    });
  }

  createNewUserConnectedToLobbySQL(lobby_id, user_id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO user_connected_to_lobby (lobby_id, user_id) VALUES (?, ?)`,
        [lobby_id, user_id],
        function (error) {
          if (error) {return reject({ errorType: "databaseError", error: error.message });}
          return resolve({operationSuccess: true});
        }
      );
    });
  }

  /////////GET///////////
  
  getLobbyGameNameSQL(lobby_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT game_names.game_name FROM lobby 
         INNER JOIN game_names 
         ON lobby.game_name = game_names.game_names_id where lobby.lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error) reject({ errorType: "DatabaseError", error: error.message })
          if(row.length === 0) return reject({errorType: "gameNameNotFound"})
          if (row) return resolve({gameName: row[0].game_name});
        }
      );
    });
  }

  getLoginInfoSQL(username) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT user_id, password, username FROM users WHERE username = ?`,
        [username],
        (error, row) => {
          if (error) return reject({ errorType: "databaseError", error});
          if(row.length === 0) return reject({errorType: "userNotFound"})
          if (row) {
            return resolve({
              user_id: row[0].user_id,
              hashPassword: row[0].password,
              databaseUsername: row[0].username,
            });
          } 
        }
      )
    });
  }

  getUsernameSQL(user_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT username FROM users WHERE user_id = ?`,
        [user_id],
        (error, row) => {
          if (error) return reject({ errorType: "databaseError", error});
          if(row.length === 0) return reject({errorType: "userNotFound"})
          if (row) {return resolve(row[0].username)}
        }
      )
    });
  }

  getUsersInsideLobbySQL(lobby_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT user_id FROM user_connected_to_lobby WHERE lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error) reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) return reject({errorType: "nobodyInsideTheLobby"})
          if (row) return resolve(row);
        }
      );
    });
  }

  /////////CHECK///////////

  checkIfUserIsConnectedToLobbySQL(user_id, lobby_id) {
  return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM user_connected_to_lobby WHERE user_id = ? AND lobby_id = ?`,
        [user_id, lobby_id],
        (error, row) => {
          if (error) reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) return resolve({connectionExist: false})
          if (row) return resolve({connectionExist: true});
        }
      );
    });
  }

  checkIfUserExistSQL(user_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT user_id, username FROM users WHERE user_id = ?`,
        [user_id],
        (error, row) => {
          if (error) reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) return reject({errorType: "userNotFound"})
          if (row)
            return resolve({
              userExist: true,
            });
        }
      );
    });
  }

  checkIfUserIsLobbyOwnerSQL(user_id, lobby_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT owner FROM lobby WHERE owner = ? AND lobby_id = ?`,
        [user_id, lobby_id],
        (error, row) => {
          if (error) return reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) return resolve({isTheOwner: false})
          if (row)
            return resolve({
              isTheOwner: true,
            });
        }
      );
    });
  }

  checkIfGameAlreadyStartedSQL(lobby_id) {
     return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT game_started FROM lobby WHERE lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error) return reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) {return reject({errorType: "lobbyNotFound"})}
          if (row[0].game_started)
            return resolve({
              gameStarted: true,
            });
          else return resolve({
              gameStarted: false,
           });
        }
      );
    });
  }

  checkIfGameAlreadyFinishedSQL(lobby_id) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT game_finished FROM lobby WHERE lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error) reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) return reject({errorType: "lobbyNotFound"})
          if (row[0].game_finished)
            return resolve({
              gameFinished: true,
            });
          else return resolve({
              gameFinished: false,
           });
        }
      );
    });
  }

  checkPlayerLimitSQL(gameName, lobby_id) {
    if (this.#game_names.includes(gameName) === false)
    return reject({errorType: "gameNameError"});
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT max_player_capacity FROM ${gameName} WHERE ${gameName}_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error)
            return reject({ errorType: "databaseError", error: error.message });
          if (row) resolve(row);
        }
      );
    });
  }

  ////////COMPARE/////////

  compareLobbyPasswordSQL(lobby_id, password) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT password FROM lobby WHERE lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error) return reject({ errorType: "databaseError", error: error.message })
          if(row.length === 0) return reject({errorType: "lobbyNotFound"})
          if (row[0].password === password) return resolve({passwordMatch: true});
          else return reject({errorType: "invalidPassword"})
        }
      );
    });
  }

  ///////UPDATE///////////

  markGameStartedSQL(lobby_id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE lobby  
         SET game_started = true  
         WHERE lobby_id = ?;`,
        [lobby_id],
        function (error) {
          if (error) return reject({ errorType: "databaseError"});
          else return resolve();  
        }
      );
    });
  }

  markGameFinishedSQL(lobby_id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE lobby  
         SET game_finished = true  
         WHERE lobby_id = ?;`,
        [lobby_id],
        function (error) {
          if (error) return reject({ errorType: "databaseError"});
          else return resolve();  
        }
      );
    });
  }
}

const database = new databaseClass();

module.exports = { database };