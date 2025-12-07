import { Socket } from "socket.io-client";

export function connectToPublicRoom(socket: Socket, room: String) : Promise<boolean> {
    return new Promise((resolve) => {
      socket.emit("connectToPublicRoom", { room }, (response: boolean) => {
          if (response) return resolve (response);
          else return resolve(false);
        }
      );
    })
}

interface enterToLobby {
    operationSuccess: boolean,
    lobby_id?: number, 
    errorType?: string,
}

// To login into a lobby.
export function enterToLobby(socket: Socket, lobby_id: String, password: String) : Promise<enterToLobby> {
  return new Promise((resolve, reject) => {
    socket.emit("enterToLobby", {lobby_id, password}, (response: connectToLobbyResponse) => {
      if(!response.operationSuccess) {return reject({errorType: response.errorType, operationSuccess: false});}
      else return resolve({lobby_id: response.lobby_id, operationSuccess: true});;
    });
  })
} 

interface connectToLobbyResponse {
    lobby_id?: number, 
    operationSuccess: boolean,
    errorType?: string,
    gameName?: string,
    isTheOwner: string
}

// To connect to the room of t  he lobby when you lost your connection or refresh page.
export function connectToLobby(socket: Socket, lobby_id: String | undefined) : Promise<connectToLobbyResponse> {
  return new Promise((resolve, reject) => {
    socket.emit("connectToLobby", {lobby_id}, (response: connectToLobbyResponse) => {
      if(response.errorType) return reject({errorType: response.errorType, operationSuccess: false});
      if(response.operationSuccess) return resolve(response);
      else return resolve(response);
    });
  })
}

export function checkIfGameAlreadyStart(socket: Socket, lobby_id: String | undefined) : Promise<boolean> {
  return new Promise((resolve, reject) => {
    socket.emit("checkIfGameAlreadyStart", {lobby_id}, (response: any) => {
      if(response.errorType) return reject({errorType: response.errorType, operationSuccess: false});
      if(response.operationSuccess) return resolve(true);
      else return resolve(false);
    });
  })
}

// To get the inicial data for run the game.
export function startGame(gameName: string | undefined, socket: Socket, lobby_id: String | undefined, gameMode: string) : any {
  return new Promise((resolve, reject) => {
    switch(gameName) {
      case "tic_tae_toe": 
      socket.emit("tic_tae_toe", {lobby_id, purpose: "createGame", gameMode}, (response: enterToLobby) => {
        if(!response.operationSuccess) return reject({errorType: response.errorType, operationSuccess: false});
        else return resolve(response);
      });
      break;
      default: console.log("Game name error.")
    }
  })
}