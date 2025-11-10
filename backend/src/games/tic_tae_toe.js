class tictactoeClass {
  db;
  // turn;
  // board_marked_position;
  // player_x;
  // player_o;

  async createGame(db, lobby_id, player_x, player_o) {
    return new Promise((resolve, reject) => {
      db.run(
          `INSERT INTO tic_tae_toe (lobby_id, player_x, player_o) VALUES (?, ?, ?)`,
          [lobby_id, player_x, player_o, ],
          function (error) {
            if (error) {console.log(error); return reject({ errorType: "databaseError", error: error.message });}
            else return resolve();  
          }
        );
      });
  }
  
  async processChange(db, lobby_id, user_id, move) {
    let {turn, player_x, player_o, board_marked_position} = await this.getDataFromGameSQL(db, lobby_id);
    let board_marked_position_parsed = JSON.parse(board_marked_position);
    let player = undefined;

    // Check if it's your turn.
    if(user_id === player_x && turn === 1) player = 1;
    else if(user_id === player_o && turn === 2) player = 2;
    else throw { errorType: "invalidMove" } 
    
    // Check if you can make that move.
    if(!(board_marked_position_parsed[move] === 0)) throw { errorType: "invalidMove" } 

    // Save the movement and turn change in the database.
    if(player === 1) board_marked_position_parsed[move] = 1;
    else board_marked_position_parsed[move] = 2;

    let victory = this.checkVictory(board_marked_position_parsed, player)

    let board_marked_position_updated = JSON.stringify(board_marked_position_parsed)
    let newTurn = ((turn === 1) ? 2 : 1);
      
    this.updateMoveSQL(db, lobby_id, board_marked_position_updated, newTurn)
    
    if(victory) return {victory: true}
    else return ({victory: false})
  }

  checkVictory(boardMarkedPositions, actualPlayer){
  /*
    1. 
    O | O | O
      |   |
      |   | 
    ----------
    2. 
      |   |
    O | O | O
      |   |
    ----------
    3. 
      |   |
      |   |
    O | O | O
    ----------
    4. 
    O |   |
    O |   |
    O |   | 
    ----------
    5.
      | O |
      | O |
      | O | 
    ----------
    6.
      |   | O
      |   | O
      |   | O
    ----------
    7.
      |   | O
      | O | 
    O |   | 
    ----------
    8.
    O |   | 
      | O | 
      |   | O
    
  */

  // 1
  if (boardMarkedPositions[0] == actualPlayer && boardMarkedPositions[1] == actualPlayer && boardMarkedPositions[2] == actualPlayer) {
    return true;
  }

  // 2
  if (boardMarkedPositions[3] == actualPlayer && boardMarkedPositions[4] == actualPlayer && boardMarkedPositions[5] == actualPlayer) {
    return true;
  }    

  // 3
  if (boardMarkedPositions[6] == actualPlayer && boardMarkedPositions[7] == actualPlayer && boardMarkedPositions[8] == actualPlayer) {
    return true;
  }    

  // 4
  if (boardMarkedPositions[0] == actualPlayer && boardMarkedPositions[3] == actualPlayer && boardMarkedPositions[6] == actualPlayer) {
    return true;
  }

  // 5 
  if (boardMarkedPositions[1] == actualPlayer && boardMarkedPositions[4] == actualPlayer && boardMarkedPositions[7] == actualPlayer) {
    return true;
  }    

  // 6
  if (boardMarkedPositions[2] == actualPlayer && boardMarkedPositions[5] == actualPlayer && boardMarkedPositions[8] == actualPlayer) {
    return true;
  }

  // 7
  if (boardMarkedPositions[2] == actualPlayer && boardMarkedPositions[4] == actualPlayer && boardMarkedPositions[6] == actualPlayer) {
    return true;
  }

  // 8
  if (boardMarkedPositions[0] == actualPlayer && boardMarkedPositions[4] == actualPlayer && boardMarkedPositions[8] == actualPlayer) {
    return true;
  }

  return false;
  }

  
  /*/////////////////////
  /////////SQL///////////
  /////////////////////*/
  
  getDataFromGameSQL(db, lobby_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT turn, player_x, player_o, board_marked_position FROM tic_tae_toe WHERE lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error) return reject({ errorType: "databaseError", error});
          if(row.length === 0) return reject({errorType: "lobbyNotFound"})
          if (row) {resolve(row[0])}
        }
      )
    });
  }

  updateMoveSQL(db, lobby_id, updatedBoardMarkedPosition, newTurn) {
  return new Promise((resolve, reject) => {
    db.run(
        `UPDATE tic_tae_toe  
         SET board_marked_position = ?, turn = ? 
         WHERE lobby_id = ?;`,
        [updatedBoardMarkedPosition, newTurn, lobby_id],
        function (error) {
          if (error) return reject({ errorType: "databaseError", error: error.message });
          else return resolve(this.lastID);  
        }
      );
    })
  }

  checkIfGameIsAlreadyCreatedSQL(db, lobby_id) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT lobby_id FROM tic_tae_toe WHERE lobby_id = ?`,
        [lobby_id],
        (error, row) => {
          if (error)  {console.log("ERROR EN checkIfGameIsAlreadyCreatedSQL" + error); return reject({ errorType: "databaseError", error: error.message });}
          if(row.length === 0) return resolve(true)
          return resolve(false)
        }
      )
    });
  }
}

const tictactoe = new tictactoeClass();

module.exports = { tictactoe };