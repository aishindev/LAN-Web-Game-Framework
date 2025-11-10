import { useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";

import { getNormalCookie } from "../../components/cookies/cookies";

import styles from './login.module.css'

function Login(props: {socket: Socket}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); 
  const [error, setError] = useState<string>(""); // passwordError / usernameError
  const [, setCookie] = useCookies(['token']);
  const navigate = useNavigate();

  function handleSendLoginInfo() {    
    fetch("http://127.0.0.1:4000/api/login", {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      username,
      password,
      })
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.operationSuccess) {
          switch(data.errorType) {
            case "invalidUsername": setUsername(""); return setError("usernameError");
            case "invalidPassword": setPassword(""); return setError("passwordError");
            case "databaseError": return console.log("Database error, contact with support.");
            case "unexpectedError": return console.log("An unexpected error occurs, contact support.");
            case "tokenCreationError": return console.log("An error ocurrs while creating your session token, contact support.")
          }
        }
        else {
          setCookie("token", data.token);
          props.socket.auth = {authToken: getNormalCookie("token")};
          props.socket.disconnect().connect();
          return navigate(`/home`);
        }
      })
      .catch((error) => {
        console.log(error);
      })
  }

  return (
    <>
    <div className={styles.body}>
      <div className={styles.login_container}>
        <h1 className={styles.title}>Login</h1>
        <div className={styles.input_group}>
            <label className={styles.label}>Username</label>
            <input className={error === "usernameError" ? styles.inputError : styles.input} type="usernameInput" id="usernameInput" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username...."></input>
        </div>
        <div className={styles.input_group}>
            <label className={styles.label}>Password</label>
            <input className={error === "passwordError" ? styles.inputError : styles.input} type="passwordInput" id="passwordInput" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password...."></input>
        </div>
        <button className={styles.button} type="submit" onClick={handleSendLoginInfo}>SIGN IN</button>
      </div>
    </div>
    </>
  );
}

export default Login;
