import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { graphqlHandler } from './graphql/handler.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/graphql', graphqlHandler)

app.get('/', (req, res) => {
  res.send('Spoonful Recipe API. POST GraphQL queries to /graphql')
})

export { app }
