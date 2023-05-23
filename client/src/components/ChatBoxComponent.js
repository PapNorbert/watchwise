import React, { useState, useEffect } from 'react'

import Chatbox from 'react-group-chatup'

import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import useLanguage from '../hooks/useLanguage'
import useAuth from '../hooks/useAuth'
import useSocket from '../hooks/useSocket'

export default function ChatBoxComponent() {
  const [messageList, setMessageList] = useState([]);
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const { socket, selectedGroupChat, displayChatWindow, setDisplayChatWindow } = useSocket();

  async function handleMessageSend(newMessage) {
    if (newMessage !== '') {
      const messageData = {
        watch_group_id: selectedGroupChat.wg_id,
        auther_name: auth.username,
        data: newMessage,
        created_at: (new Date(Date.now())).toDateString()
      };
      await socket.emit('send_message', messageData);
      messageData.auther = 'me'
      setMessageList((list) => [...list, messageData]);
    }
  }


  useEffect(() => {
    function onReceiveMessage(newMessage) {
      newMessage.auther = 'other';
      setMessageList((list) => [...list, newMessage]);
    }
    function onMessageHistory(messages) {
      messages.map(message => {
        if (message.auther_name === auth.username) {
          message.auther = 'me';
        } else {
          message.auther = 'other'
        }
        return message
      });
      setMessageList(messages);
    }

    socket.on('receive_message', onReceiveMessage);
    socket.on('message_history', onMessageHistory);

    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('message_history', onMessageHistory);
    };
  }, [auth.username, socket]);


  return (auth.logged_in &&
    <Chatbox _onSendMessage={handleMessageSend}
      displayChatWindow={displayChatWindow} setDisplayChatWindow={setDisplayChatWindow}
      messages={messageList} avatar={false} theme='#e99000fa' sound={false}
      noMessagesText={
        selectedGroupChat !== null ?
          convertKeyToSelectedLanguage('no_messages', i18nData)
          :
          convertKeyToSelectedLanguage('select_chat', i18nData)
      }
      brandName={
        selectedGroupChat !== null ?
          selectedGroupChat.name
          :
          'WatchWise'
      }
    />
  );

}
