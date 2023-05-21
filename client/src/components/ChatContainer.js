import React, { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap'

import ChatMessage from './ChatMessage'
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';

export default function ChatContainer() {
  const [messageList, setMessageList] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const { auth } = useAuth();
  const roomKey = 'gdh-5dfg45dg-gdg3445a';
  const { socket } = useSocket();

  useEffect(() => {
    function onReceiveMessage(newMessage) {
      console.log('receive_msg', newMessage)
      setMessageList((list) => [...list, newMessage]);
    }
    function ont(newMessage) {
      console.log('test', newMessage)

    }

    socket.on('receive_message', onReceiveMessage);
    socket.on('test', ont);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('test', ont);
    };
  }, [socket]);

  const joinRoom = () => {
    if (auth.logged_in && roomKey) {
      socket.emit("join_room", roomKey);
    }
  };

  async function sendMessage() {
    if (currentMessage !== "") {
      const messageData = {
        roomKey: roomKey,
        author: auth.username,
        message: currentMessage,
        time: new Date(Date.now())
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  return (auth.logged_in &&
    <Container>
      <button onClick={joinRoom} >
        Join A Room
      </button>
      {
        messageList.map((currentMessage, index) => {
          return (
            <ChatMessage chatMessage={currentMessage} key={`chat_message_${index}`} />
          )
        })
      }
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyUp={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </Container>
  );

}
