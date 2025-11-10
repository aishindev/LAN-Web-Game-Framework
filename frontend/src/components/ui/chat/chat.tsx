import { Socket } from "socket.io-client";
import { FormEvent, useEffect, useState } from "react";
import styles from "./chat.module.css";

interface chatProps {
  socket: Socket,
  room: string | undefined,
}

interface Message {
  username: string;
  message: string;
}

function Chat(props: chatProps) {
  const {socket, room} = props;
  const [message, setMessage] = useState("");
  const [listOfMessages, setListOfMessages] = useState<Message[]>([]);

  function handleSubmite(e: FormEvent) {
    const newMessage = {
      username: "Me",
      message: message,
    };
    e.preventDefault();
    socket.emit("chatModuleMessage", {message, room});
    addItem(newMessage);
    setMessage("");
  }

  useEffect(() => {
    socket.on("chatModuleMessage", (incomingMessage) => {
      let message = JSON.parse(incomingMessage);
      if(message.room === room) addItem(message);
    });
  }, []);

  const addItem = (message: Message) => {
    setListOfMessages((prevItems) => [
      ...prevItems,
      message,
    ]);
  };

  return (
    <div className={styles.chat} id="chat">
      <div className={styles.chatMessagesContainer} id="chatMessagesContainer">
        <>
          {listOfMessages.map((element, i) => (
            <p className={styles.chatMessagesText} key={i + "message"}>
              {element.username + ": "+ element.message}
            </p>
          ))}
        </>
      </div>
      <form className={styles.form} onSubmit={handleSubmite}>
        <input
          className={styles.chatInputMessage}
          id="chatInputMessage"
          type="text"
          placeholder="Write text here.."
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className={styles.sendButtom} id="chatSendMessage">Send</button>
      </form>
    </div>
  );
}

export default Chat;
