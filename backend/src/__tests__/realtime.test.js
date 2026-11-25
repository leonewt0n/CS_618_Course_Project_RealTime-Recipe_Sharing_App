import { createServer } from 'node:http'
import { graphql } from 'graphql'
import { io as ioClient } from 'socket.io-client'
import { afterEach, describe, expect, test } from '@jest/globals'
import { attachRealtime, emitRecipeCreated } from '../realtime.js'
import { schema } from '../graphql/schema.js'
import { createUser } from '../services/users.js'

describe('recipe realtime', () => {
  let server
  let realtime
  let client

  afterEach(async () => {
    client?.disconnect()
    realtime?.close()
    realtime = null
    if (!server?.listening) {
      server = null
      return
    }
    await new Promise((resolve) => server.close(resolve))
    server = null
  })

  test('broadcasts a new recipe title and id to connected clients', async () => {
    server = createServer()
    realtime = attachRealtime(server)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address()

    client = ioClient(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
    })

    const received = new Promise((resolve) => {
      client.on('recipe:created', resolve)
    })
    await new Promise((resolve, reject) => {
      client.on('connect', resolve)
      client.on('connect_error', reject)
    })

    emitRecipeCreated({ id: 'abc123', title: 'Garlic Shrimp' })

    await expect(received).resolves.toEqual({
      id: 'abc123',
      title: 'Garlic Shrimp',
    })
  })

  test('createRecipe mutation notifies connected clients', async () => {
    const user = await createUser({
      username: `notifier-${Date.now()}`,
      password: 'hunter2',
    })
    server = createServer()
    realtime = attachRealtime(server)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address()

    client = ioClient(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
    })
    const received = new Promise((resolve) => {
      client.on('recipe:created', resolve)
    })
    await new Promise((resolve, reject) => {
      client.on('connect', resolve)
      client.on('connect_error', reject)
    })

    const result = await graphql({
      schema,
      source: `mutation {
        createRecipe(
          title: "Midnight Ramen"
          ingredients: ["noodles", "broth"]
          imageUrl: "https://example.com/ramen.jpg"
        ) { id title }
      }`,
      contextValue: { userId: String(user._id) },
    })

    expect(result.errors).toBeUndefined()
    await expect(received).resolves.toEqual({
      id: result.data.createRecipe.id,
      title: 'Midnight Ramen',
    })
  })
})
