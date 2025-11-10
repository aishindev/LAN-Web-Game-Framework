import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getDataFromGame, sendPlayerAction } from "../../../service/API/gamesAPI/tictaetoeAPI";

import styles from "./tictaetoe.module.css"

interface socketProps {
  socket: Socket,
  lobby_id: string | undefined
}

export default function TicTacToe(props: socketProps) {
  let { lobby_id, socket } = props;
  var initialDataGathered = useRef(false)

  const [boardInfo, SetboardInfo] = useState<{player: number, turn: number, boardMarkedPositions: number[], error: null | number | string}>({
    player: 0,
    turn: 0,
    boardMarkedPositions: [0,0,0,0,0,0,0,0,0],
    error: null,
  });
  
  useEffect( () => {  
    if(!initialDataGathered.current)
    socket.on("tic_tae_toe", (message: {enemyMove: number, enemyVictory: boolean}) => {
        let { enemyMove, enemyVictory } = message;   

        if(enemyVictory) {
          return SetboardInfo(prevState => {
          const copy = structuredClone(prevState);
          copy.error = "gameAlreadyFinished";
          copy.boardMarkedPositions[enemyMove] = (prevState.player === 1 ? 2 : 1 )
          let pathOfWinPosition = checkVictory(copy.turn, copy.boardMarkedPositions)

          for (let index = 0; index < 3; index++) {
            copy.boardMarkedPositions[pathOfWinPosition[index]] = (copy.player === 1 ? 4 : 3 )
          }
          return copy;
        })
        }
        
        return SetboardInfo(prevState => {
          const copy = structuredClone(prevState);
          copy.error = null;
          copy.boardMarkedPositions[enemyMove] = (prevState.player === 1 ? 2 : 1 )
          copy.turn = ((prevState.turn) === 1 ? 2 : 1);
          return copy;
        })
    })
    
    if(!initialDataGathered.current) {
      getDataFromGame(socket, lobby_id).then((response: {player: number, turn: number, board_marked_position: string, gameFinished: boolean}) => {
        let { player, turn, gameFinished} = response;
        let error: string | number = -1; 
        if(gameFinished) error = "gameAlreadyFinished";
        initialDataGathered.current = true;
        let boardMarkedPositions = JSON.parse(response.board_marked_position);
        SetboardInfo(
          {
            player, 
            turn, 
            boardMarkedPositions,
            error
          })
        })
    } 
      
  }), [boardInfo];

  function buttomComponent() {
    const buttoms = [];
  
    for (let i = 0; i < 9; i++) {
      // 0 Null, 1 X, 2 O, 3 X WIN, 4 O WIN.
      if(boardInfo.error === i) {
      boardInfo.error = null;
      switch(boardInfo.boardMarkedPositions[i]) {
        case 1: buttoms.push(<button className={styles.buttonERROR} key={`buttom${i}`} onClick={() => processMove(i, socket)}>X</button>);
        break;
        case 2: buttoms.push(<button className={styles.buttonERROR} key={`buttom${i}`} onClick={() => processMove(i, socket)}>O</button>);
        break;
        default: buttoms.push(<button className={styles.buttonERROR} key={`buttom${i}`} onClick={() => processMove(i, socket)}></button>);
        }
      }
      else {
        switch(boardInfo.boardMarkedPositions[i]) {
          case 1: buttoms.push(<button className={styles.button} key={`buttom${i}`} onClick={() => processMove(i, socket)}>X</button>);
          break;
          case 2: buttoms.push(<button className={styles.button} key={`buttom${i}`} onClick={() => processMove(i, socket)}>O</button>);
          break;
          case 3: buttoms.push(<button className={styles.buttonWIN} key={`buttom${i}`} onClick={() => processMove(i, socket)}>X</button>);
          break;
          case 4: buttoms.push(<button className={styles.buttonWIN} key={`buttom${i}`} onClick={() => processMove(i, socket)}>O</button>);
          break;
          default: buttoms.push(<button className={styles.button} key={`buttom${i}`} onClick={() => processMove(i, socket)}></button>);
        }
      }

    }
    return buttoms;
  }

  function handleErrorTitle() {
    switch(boardInfo.error) {
      case "notYourTurn": return <h1 className={styles.title}>{"Error, not your turn."}</h1>
      case "gameAlreadyFinished": return <h1 className={styles.title}>{"The game already have a winner"}</h1>
    }
  }

  return (
    <>
      <div className={styles.body}>
            <h1 className={styles.title}>{boardInfo.turn === 1 ? "Turno de: X" : "Turno de: O"}</h1>
            {handleErrorTitle()}
            <div className={styles.game_container}>
              {buttomComponent()}
            </div>
      </div>
    </>
  );
  
 async function processMove (position: number, socket: Socket) {

  if(boardInfo.error === "gameAlreadyFinished") return;

  // Check that the marked position is valid.
  if(boardInfo.boardMarkedPositions[position] != 0) {
    console.log("posicion no valida");
    return SetboardInfo({...boardInfo, error: position})
  };
  
  // Check if it's your turn.
  if(boardInfo.turn != boardInfo.player) {
    console.log("turno no valido"); 
    return SetboardInfo({...boardInfo, error: "notYourTurn"})
  }
 
  boardInfo.boardMarkedPositions[position] = boardInfo.player;
  boardInfo.turn = (boardInfo.turn === 1 ? 2 : 1);
  
  await sendPlayerAction(socket, lobby_id, position).then(() => {

    let pathOfWinPosition = checkVictory(boardInfo.player, boardInfo.boardMarkedPositions)

    if(pathOfWinPosition[2] != 0) {
      return SetboardInfo(prevState => {
          const copy = structuredClone(prevState);
          for (let index = 0; index < 3; index++) {
            copy.boardMarkedPositions[pathOfWinPosition[index]] = (copy.player === 1 ? 3 : 4 )
          }
          copy.error = "gameAlreadyFinished"
          return copy;
      })
    }
    else {
      SetboardInfo({...boardInfo})
    }
  }).catch((error: any) => {
    switch(error.errorType) {
        case "invalidMove": return console.log("Invalid move");
        case "databaseError": return console.log("Database error, contact with support.");
        case "lobbyNotFound": return console.log("Lobby not found, contact with support.");
        case "gameAlreadyFinished": return SetboardInfo({...boardInfo, error: "gameAlreadyFinished", turn: 3})
    }
  })
 }

 function checkVictory(actualPlayer: number, board: number[]){
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
  if (board[0] == actualPlayer && board[1] == actualPlayer && board[2] == actualPlayer) {
    return [0, 1, 2];
  }

  // 2
  if (board[3] == actualPlayer && board[4] == actualPlayer && board[5] == actualPlayer) {
    return  [3, 4, 5];
  }    

  // 3
  if (board[6] == actualPlayer && board[7] == actualPlayer && board[8] == actualPlayer) {
    return  [6, 7, 8];
  }    

  // 4
  if (board[0] == actualPlayer && board[3] == actualPlayer && board[6] == actualPlayer) {
    return  [0, 3, 6];
  }

  // 5 
  if (board[1] == actualPlayer && board[4] == actualPlayer && board[7] == actualPlayer) {
    return [1, 4, 7];
  }    

  // 6
  if (board[2] == actualPlayer && board[5] == actualPlayer && board[8] == actualPlayer) {
    return  [2, 5, 8];
  }

  // 7
  if (board[2] == actualPlayer && board[4] == actualPlayer && board[6] == actualPlayer) {
    return  [2, 4, 6];
  }

  // 8
  if (board[0] == actualPlayer && board[4] == actualPlayer && board[8] == actualPlayer) {
    return [0, 4, 8];
  }

  return [0,0,0];
 }
}