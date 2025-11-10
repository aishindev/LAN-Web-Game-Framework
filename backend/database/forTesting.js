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
  if(passwordAlreadyHashed === false) {
    bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
      if(err) return console.log(err);
      db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function (error) {
        if (error) console.log(error);
        else console.log("new user created")
      }
    );
    });
  }
  else {
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, password],
      function (error) {
        if (error) return console.log(error);
        else console.log("new user created")
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
        return console.log({ errorType: "databaseError", error: error.message });
      else return console.log("exito insertando template");
    }
  );
}

/**
 * Clear all the data inside the table sended.
 * @param {string} tableName 
 */
function clearTable(tableName) {
  db.run(
    `DELETE from ${tableName}`,
    function (error) {
      if (error) console.log(error);
    }
  );
}