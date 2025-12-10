var sqlite3 = require("sqlite3");
var bcrypt = require("bcrypt");
const saltRounds = 10;

let db = new sqlite3.Database("database.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err && err.code == "SQLITE_CANTOPEN") throw "DATABASE NOT FOUND";
  console.log("- Database started with no problems.\n");
});

/* ALL THE DEFAULT USERS PASSWORDS IN THE DATABASE ARE 1234 */
/* IF YOU DON'T HASH YOUR PASSWORD, AN ERROR WILL APPEAR WHEN LOGIN */

/**
 * Clear all the data inside the table sended.
 * @param {string} username
 * @param {string} password
 * @param {string} passwordAlreadyHashed
 */
function insertUser(username, password, passwordAlreadyHashed) {
  if (passwordAlreadyHashed === false) {
    bcrypt.hash(password, saltRounds, function (err, hashedPassword) {
      if (err) return console.log(err);
      db.run(
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        [username, hashedPassword],
        function (error) {
          if (error) console.log(error);
          else console.log("new user created");
        }
      );
    });
  } else {
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, password],
      function (error) {
        if (error) return console.log(error);
        else console.log("new user created");
      }
    );
  }
}

// The check for max_player_capacity works with a empty template of the table of the game.
// If you clear all rows of the game table you are going to have an error message when trying to create a new game.
// You only need to run this comand one time and is going to work fine.
function createTicTaeToeTemplate() {
  db.run(
    `INSERT INTO tic_tae_toe (lobby_id, player_x, player_o) VALUES (?, ?, ?)`,
    [0, 0, 0],
    function (error) {
      if (error)
        return console.log({
          errorType: "databaseError",
          error: error.message,
        });
      else return console.log("exito insertando template");
    }
  );
}

// Clear all the rows inside a table of a game.
function clearGameTable(tableName) {
  db.run(
    `DELETE from ${tableName} WHERE ${tableName}_id > 1`,
    function (error) {
      if (error) console.log(error);
    }
  );
}

// This function is useful as a template for creating a new game table.
// You can modify the template however you want, except for the fields that are already filled in.
// Example createNewGame("test", 2)
function createNewGame(tableName, max_player_capacity) {
  // Create the table.
  db.exec(
    `
  create table ${tableName} (
      ${tableName}_id INTEGER PRIMARY KEY,
      lobby_id INTEGER not null,
      
      max_player_capacity number not null,

      FOREIGN KEY (lobby_id) REFERENCES lobby (lobby_id)
  );
      `,
    (error) => {
      if(error) return console.log(error);
      else console.log("table created successfully");
    }
  );

  // Insert a template of the game table.
  // You can modify this if necessary, for example...
  // if you add a value that cannot be null you have to add it to the insert.
  db.run(
    `INSERT INTO ${tableName} (${tableName}_id, lobby_id, max_player_capacity) VALUES (?, ?, ?)`,
    [1, 0, max_player_capacity],
    function (error) {
      if (error) return console.log(error);
      else console.log("Template of game inserted");
    }
  );

  // Insert the game name to the game_names table.
  // You dont need to do anything here.
  db.run(
    `INSERT INTO game_names (game_name) VALUES (?)`,
    [tableName],
    function (error) {
      if (error) return console.log(error);
      console.log("Game name inserted");
    }
  );
}