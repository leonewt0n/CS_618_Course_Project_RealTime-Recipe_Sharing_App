import { io } from 'socket.io-client'
import { backendOrigin } from '../api/graphql.js'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(backendOrigin(), { autoConnect: true })
  }
  return socket
}
