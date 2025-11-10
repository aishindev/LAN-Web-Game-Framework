import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/home/home";
import Login from "./pages/auth/login";
import Game from "./pages/game/game";

import ProtectedRoute from "./components/security/protectedRoute";
import Lobby from "./pages/lobby/lobby";

import { getNormalCookie } from "./components/cookies/cookies";
import { io } from "socket.io-client";

import './App.css';

const socket = io("/", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax : 5000,
  reconnectionAttempts: 5,
  auth: {
    authToken:  getNormalCookie("token"),
  },
});

export default function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route index element={<Login socket={socket}/>}></Route>
            <Route path="/login" element={<Login socket={socket}/>}></Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home socket={socket}/>}></Route>
              <Route path="/lobby/:id" element={<Lobby socket={socket}/>}></Route>
              <Route path="/game/:id" element={<Game socket={socket}/>}></Route>
            </Route>
          </Routes>
        </BrowserRouter>
      ); 
    }