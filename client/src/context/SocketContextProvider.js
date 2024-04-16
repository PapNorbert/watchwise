import React, { createContext, useState } from 'react'
import io from 'socket.io-client'

import { serverUrl } from '../axiosRequests/configuredAxios'

export const SocketContext = createContext(null);

const socket = io(serverUrl);

export default function SocketContextProvider({ children }) {
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);
  const [displayChatWindow, setDisplayChatWindow] = useState(false);

  const value = {
    socket,
    selectedGroupChat, 
    setSelectedGroupChat,
    displayChatWindow, 
    setDisplayChatWindow
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
