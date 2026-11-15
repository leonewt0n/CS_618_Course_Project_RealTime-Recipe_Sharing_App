import { graphqlRequest } from './graphql.js'

export const signup = async ({ username, password }) => {
  const data = await graphqlRequest(
    `mutation Signup($username: String!, $password: String!) {
      signup(username: $username, password: $password) { id username }
    }`,
    { variables: { username, password } },
  )
  return data.signup
}

export const login = async ({ username, password }) => {
  const data = await graphqlRequest(
    `mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) { token }
    }`,
    { variables: { username, password } },
  )
  return data.login
}

export const getUserInfo = async (id) => {
  const data = await graphqlRequest(
    `query User($id: ID!) { user(id: $id) { id username } }`,
    { variables: { id } },
  )
  return data.user ?? { username: id }
}
