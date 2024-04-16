import { useContext } from 'react'

import { SocketContext } from '../context/SocketContextProvider'

export default function useSocket() {
  return useContext(SocketContext);
}