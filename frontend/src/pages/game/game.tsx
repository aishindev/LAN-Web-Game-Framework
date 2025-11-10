import { Socket } from "socket.io-client";
import Chat from "../../components/ui/chat/chat";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {connectToLobby} from "../../service/API/socketAPI/socketAPI";
import TicTacToe from "../../components/games/Tictaetoe/tictaetoe";

interface socketProps {
  socket: Socket
}

export default function Game(props: socketProps) {
  const { socket } = props;
  let [gameName, setgameName] = useState<string | undefined>(undefined)
  
  let {id} = useParams();
  
  useEffect(() => { 
      if(id === undefined) return console.log("falta la id en la URL");
  
      if(gameName === undefined) {
        connectToLobby(socket, id).then((response) => {
          if(response.operationSuccess) {
            return setgameName(response.gameName);
          }
          else return setgameName(undefined);
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
  }), [];

  switch(gameName) {
    case "tic_tae_toe": return (<><TicTacToe socket={socket} lobby_id={id}></TicTacToe> <Chat socket={socket} room={id}></Chat></>)
    case undefined: return <></>
    default: <></>
  }
}