import { graphql } from 'graphql'
import { schema } from './schema.js'
import { readUserId } from '../middleware/jwt.js'

export async function graphqlHandler(req, res) {
  const source = req.body?.query
  if (typeof source !== 'string' || !source.trim()) {
    return res.status(400).json({ errors: [{ message: 'Query is required.' }] })
  }

  try {
    const result = await graphql({
      schema,
      source,
      variableValues: req.body.variables,
      operationName: req.body.operationName,
      contextValue: { userId: readUserId(req) },
    })
    return res.status(200).json(result)
  } catch (err) {
    console.error('graphql failed', err)
    return res
      .status(500)
      .json({ errors: [{ message: 'GraphQL request failed.' }] })
  }
}
