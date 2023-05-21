import React, { createContext, useEffect } from 'react'
import io from 'socket.io-client'

import { serverUrl } from '../axiosRequests/configuredAxios'
import useAuth from '../hooks/useAuth';

export const SocketContext = createContext(null);

const socket = io(serverUrl);

export default function SocketContextProvider({ children }) {
  const {auth} = useAuth();
  const roomKey = 'gdh-5dfg45dg-gdg3445a';

  useEffect(() => {
    if (auth.logged_in && roomKey) {
      socket.emit("join_room", roomKey);
    }
  }, [auth.logged_in])

  const value = {
    socket
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
