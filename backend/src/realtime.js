import { Server } from 'socket.io'

let io = null

export function attachRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true },
  })
  return io
}

export function emitRecipeCreated(recipe) {
  if (!io || !recipe?.id || !recipe?.title) return
  io.emit('recipe:created', {
    id: String(recipe.id),
    title: String(recipe.title),
  })
}
