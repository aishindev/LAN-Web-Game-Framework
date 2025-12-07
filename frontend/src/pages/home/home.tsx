import { Socket } from "socket.io-client";
import Chat from "../../components/ui/chat/chat";
import { useEffect, useState } from "react";
import { connectToPublicRoom, enterToLobby } from "../../service/API/socketAPI";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

import styles from "./home.module.css"

export default function Home(props: {socket: Socket}) {
  const { socket } = props;
  const [roomConnected, setRoomconected] = useState(false)
  const [cookies] = useCookies(["token"]);

  const urlParameters = {
    host: import.meta.env.VITE_PRIVATE_IP,
    port: import.meta.env.VITE_PORT
  }
  
  const [lobbyName, setLobbyName] = useState("");
  const [lobby_id, setLobbyid] = useState("");
  const [lobbyPassword, setLobbyPassword] = useState("");
  const [lobbyGameName, setLobbyGameName] = useState("");
  
  const [optionSelected, setOptionSelected] = useState("") 
  const [error, setError] = useState<string>(""); 
 
  let navigate = useNavigate();

  const gameNames = ["tic_tae_toe"];

  function handleNewGame() {
    fetch(`http://${urlParameters.host}:${urlParameters.port}/api/createLobby`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      token: cookies.token,
      lobbyName,
      lobbyPassword,
      lobbyGameName
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      if (!data.operationSuccess) {
        switch(data.errorType) {
          case "gameNameError": setLobbyGameName(""); return setError("gameNameError");
          case "userNotFound": return console.log("The user that you are using rigth now dont exist, contact with support.");
          case "databaseError": return console.log("Database error, contact with support.");
          case "invalidToken": return alert("There is a problem with your credentials, please login again.")
          case "unexpectedError": return console.log("An unexpected error occurs, contact support.");
        }
      }
      else  {
        navigate(`/lobby/${data.lobby_id}`)
      }
    })
  }

  function handleJoinLobby() {

   interface connectToLobbyResponse {
    lobby_id?: number, 
    operationSuccess: boolean,
    lobbyGame?: string
   }

    enterToLobby(socket, lobby_id, lobbyPassword).then((response: connectToLobbyResponse) => {
       navigate(`/lobby/${response.lobby_id}`); 
    }).catch((error) => {       
      switch(error.errorType) {
        case "connectionAlreadyExist": return navigate(`/lobby/${lobby_id}`);
        case "lobbyNotFound": setLobbyid(""); return setError("lobbyNotFound")
        case "invalidPassword": setLobbyPassword(""); return setError("invalidPassword")
        case "databaseError": return console.log("Database error, contact with support.");
        case "unexpectedError": return console.log("An unexpected error occurs, contact support.");
        }
      }
    )
  }

  useEffect(() => {
    if(!roomConnected) {
    connectToPublicRoom(socket, "home").then((response) => {
      setRoomconected(response)
    })
  }
  }), [];

  function handleFrotend() {

    if(optionSelected === "") {
      return (
      <>
        <button className={styles.actionButtom} onClick={() => setOptionSelected("newGame")}>New Game</button>
        <button className={styles.actionButtom} onClick={() => setOptionSelected("joinGame")}>Join Game</button>
      </>)
    }

    if(optionSelected === "newGame") {
      return (<>
      <button className={styles.goBackButtom} onClick={() => setOptionSelected("")}>Go back</button>
       <div className={styles.input_group}>
            <label className={styles.label}>Lobby name</label>
            <input 
            className={styles.input} 
            type="usernameInput" 
            id="usernameInput" 
            value={lobbyName} 
            onChange={(e) => setLobbyName(e.target.value)} 
            placeholder="Write a name for the lobby..."></input>
        </div>
        <div className={styles.input_group}>
            <label className={styles.label}>Password</label>
            <input 
              className={styles.input} 
              type="passwordInput" 
              id="passwordInput" 
              value={lobbyPassword} 
              onChange={(e) => setLobbyPassword(e.target.value)} 
              placeholder="Write a password for the lobby...">
            </input>
        </div>
        <div className={styles.input_group}>
            <label className={styles.label}>Game name</label>
            <input 
              className={styles.input} 
              list="gameNames"
              value={lobbyGameName}
              onChange={(event) => {setLobbyGameName(event.target.value)}}
              placeholder="Write the name of the game..."
            />
            <datalist id="gameNames">
              {gameNames.map((gameName, index) => (
              <option key={index} value={gameName} />
            ))}
            </datalist>
        </div>
        <button className={styles.actionButtom} type="submit" onClick={handleNewGame}>Send data</button>
      </>)
    }

    if(optionSelected === "joinGame") {
      return (<>
      <button className={styles.goBackButtom} onClick={() => setOptionSelected("")}>Go back</button>
       <div className={styles.input_group}>
            <label className={styles.label}>LobbyID</label>
            <input className={error === "lobbyNotFound" ? styles.inputError : styles.input} 
            type="lobbyidInput" id="lobbyidInput" 
            value={lobby_id} onChange={(e) => setLobbyid(e.target.value)} 
            placeholder="Write the lobby id..."></input>
        </div>
        <div className={styles.input_group}>
            <label className={styles.label}>LobbyPassword</label>
            <input className={error === "invalidPassword" ? styles.inputError : styles.input} 
            type="passwordInput" id="passwordInput" value={lobbyPassword} 
            onChange={(e) => setLobbyPassword(e.target.value)} 
            placeholder="Write the lobby password..."></input>
        </div>
        <button className={styles.actionButtom} type="submit" onClick={handleJoinLobby}>Send data</button>
      </>)
    }

    return <></>
  }
  
  return (
    <>
      <div className={styles.body}>
          <div className={styles.home_container}>
            {handleFrotend()}
          </div>
      </div>
           <Chat socket={props.socket} room={'home'}></Chat>;
    </>
  );
}