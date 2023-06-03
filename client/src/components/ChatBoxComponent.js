import React, { useState, useEffect } from 'react'

import Chatbox from 'react-group-chatup'

import { convertDateAndTimeToLocale, convertKeyToSelectedLanguage } from '../i18n/conversion'
import useLanguage from '../hooks/useLanguage'
import useAuth from '../hooks/useAuth'
import useSocket from '../hooks/useSocket'

export default function ChatBoxComponent() {
  const [messageList, setMessageList] = useState([]);
  const { auth } = useAuth();
  const { i18nData, language } = useLanguage();
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const { socket, selectedGroupChat, displayChatWindow, setDisplayChatWindow } = useSocket();

  async function handleMessageSend(newMessage) {
    if (newMessage !== '' && selectedGroupChat !== null) {
      const messageData = {
        watch_group_id: selectedGroupChat.wg_id,
        auther_name: auth.username,
        data: newMessage,
        created_at: new Date(Date.now())
      };
      await socket.emit('send_message', messageData);
      await socket.emit('updateOpenedTime', { roomKey: selectedGroupChat?.wg_id, userId: auth.userID, userName: auth.username });

      messageData.auther = 'me'
      messageData.created_at = convertDateAndTimeToLocale(messageData.created_at, language);
      setMessageList((list) => [...list, messageData]);
    }
  }

  useEffect(() => {
    if (language !== currentLanguage) {
      // update chat date format on language change
      const newMessageList = [...messageList];
      newMessageList.map(message => {
        message.created_at = convertDateAndTimeToLocale(Date(message.created_at), language);
        return message;
      })
      setMessageList(newMessageList);
      setCurrentLanguage(language);
    }
  }, [currentLanguage, language, messageList])

  useEffect(() => {
    function onReceiveMessage(newMessage) {
      socket.emit('updateOpenedTime', { roomKey: selectedGroupChat?.wg_id, userId: auth.userID, userName: auth.username });
      newMessage.auther = 'other';
      newMessage.created_at = convertDateAndTimeToLocale(newMessage.created_at, language);
      setMessageList((list) => [...list, newMessage]);
    }

    function onMessageHistory(messages) {
      messages.map(message => {
        if (message.auther_name === auth.username) {
          message.auther = 'me';
        } else {
          message.auther = 'other'
        }
        message.created_at = convertDateAndTimeToLocale(message.created_at, language);
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
  }, [auth.userID, auth.username, language, selectedGroupChat?.wg_id, socket]);


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
