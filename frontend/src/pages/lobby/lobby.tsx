import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Socket } from "socket.io-client";

import { startGame, connectToLobby, checkIfGameAlreadyStart } from "../../service/API/socketAPI/socketAPI";
import Chat from "../../components/ui/chat/chat";
import styles from "./lobby.module.css"

export default function Lobby(props: {socket: Socket}) {
  const { socket } = props;
  let {id} = useParams();
  let navigate = useNavigate();

  let [lobbyConfigValues, setlobbyConfigValues] = useState<{gameName: string | undefined, isTheOwnerOfTheLobby: boolean | null}>({
    gameName: undefined,
    isTheOwnerOfTheLobby: null})

  useEffect(() => { 

    if(id === undefined) return alert("falta la id en la URL");

    socket.on("lobbyConfigChange", (response) => {
      let {change} = response;
      switch(change) {
        case "startGame": return navigate(`/game/${id}`);
        default: return console.log("An unexpected change occurs, contact support.");
      }
    });
    
    if(lobbyConfigValues.isTheOwnerOfTheLobby === null) {
      
      checkIfGameAlreadyStart(socket, id).then((response) => {
        if(response) return navigate(`/game/${id}`);   
      })
      .catch((error) => {
      switch(error.errorType) {
        case "databaseError": return alert("Database error, contact with support.");
        case "lobbyNotFound": return alert("The lobby ID in the URL is invalid or the lobby dont exist.");
        }
      })
      
      connectToLobby(socket, id).then((response) => {
        console.log(response)
        if(response.operationSuccess && response.isTheOwner) {
          return setlobbyConfigValues({
            gameName: response.gameName,
            isTheOwnerOfTheLobby: true
          })
        } 
        else {
          return setlobbyConfigValues({
            gameName: response.gameName,
            isTheOwnerOfTheLobby: false
          })
        }
      })
      .catch((error) => {
      switch(error.errorType) {
        case "connectionDontExist": return alert("Go back to /home and join again the lobby.")
        case "databaseError": return alert("Database error, contact with support.");
        case "gameNameNotFound": return alert("There is a problem with the name of the game selected, please refresh the page.");
        case "unexpectedError": return console.log("Unexpected error.")
      }
      })
    }
  })

  function handleStartGame() {
    startGame(lobbyConfigValues.gameName, socket, id, "normal").then((response: {operationSuccess: boolean, errorType: string}) => {
      if(response.operationSuccess) {
        socket.emit("lobbyConfigChange", {lobby_id: id, change: "startGame"})
        navigate(`/game/${id}`);
      }
    })
    .catch((error: {errorType: string, operationSuccess: boolean}) => {
      switch(error.errorType){
        case "noPurpose": return console.log("The message dont have purpose, contact with support.");
        case "notTheOwner": return console.log("You are not the owner of the lobby");
        case "databaseError": return console.log("Database error, contact with support.");
        case "nobodyInsideTheLobby": return console.log("Nobody is inside the lobby you are now, contact with support.");
        case "gameModeDontExist": return console.log("The game mode that you send is incorrect o dont exist, contact with support.");
        case "gameAlreadyExist": console.log("The game you're creating already exists."); return navigate(`/game/${id}`);
        case "playerLimitSurpassed": return alert("The lobby has exceeded the maximum number of players. Please create a new lobby and try creating a game again.")
        default: return console.log("An unexpected error occurs, contact support.");
      }
    })
  }
  
  function handleFrotend() {
    if (lobbyConfigValues.isTheOwnerOfTheLobby) {
      return (
      <>
        <button onClick={handleStartGame} className={styles.button}>INICIAR PARTIDA</button>
      </>)
    }

    if(lobbyConfigValues.isTheOwnerOfTheLobby === false) {
      return (<>
        <h1 className={styles.title}>Waiting for the owner to configure the game...</h1>
      </>)
    }

    return (<></>)
  }
 
  return (
    <>
      <div className={styles.body}>
            <div className={styles.lobby_container}>
              {handleFrotend()}
            </div>
      </div>
      <Chat socket={socket} room={id}></Chat>
    </>
  );
}