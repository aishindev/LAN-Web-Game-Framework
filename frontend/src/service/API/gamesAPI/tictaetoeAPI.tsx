import { Socket } from "socket.io-client";

export function getDataFromGame(socket: Socket, lobby_id: String | undefined) : any {
  return new Promise((resolve, reject) => {
    socket.emit("tic_tae_toe", {lobby_id, purpose: "getDataFromGame"}, (response: any) => {
      if(response.error) return reject({error: response.error});
      else return resolve(response);
    });
  })
}

export function sendPlayerAction(socket: Socket, lobby_id: String | undefined, move: {}) : any {
  return new Promise<void>((resolve, reject) => {
    socket.emit("tic_tae_toe", {lobby_id, purpose: "playerAction", move }, (response: any) => {
      if(response.error) return reject({error: response.error});
      if(response.operationSuccess) return resolve();
    });
  })
}

