import { graphqlRequest } from './graphql.js'

const RECIPE_FIELDS = `
  id
  title
  ingredients
  imageUrl
  likeCount
  likedByMe
  author { id username }
`

const SORT_FIELD = {
  createdAt: 'CREATED_AT',
  updatedAt: 'UPDATED_AT',
  likeCount: 'LIKE_COUNT',
}

const SORT_ORDER = {
  ascending: 'ASCENDING',
  descending: 'DESCENDING',
}

export const getRecipes = async (
  { author, sortBy, sortOrder, popularOnly } = {},
  token,
) => {
  const data = await graphqlRequest(
    `query Recipes(
      $author: String
      $sortBy: RecipeSortField
      $sortOrder: SortOrder
      $popularOnly: Boolean
    ) {
      recipes(
        author: $author
        sortBy: $sortBy
        sortOrder: $sortOrder
        popularOnly: $popularOnly
      ) { ${RECIPE_FIELDS} }
    }`,
    {
      token,
      variables: {
        author: author || null,
        sortBy: SORT_FIELD[sortBy] ?? 'CREATED_AT',
        sortOrder: SORT_ORDER[sortOrder] ?? 'DESCENDING',
        popularOnly: Boolean(popularOnly),
      },
    },
  )
  return data.recipes
}

export const getTopRecipes = async (limit = 5, token) => {
  const data = await graphqlRequest(
    `query TopRecipes($limit: Int) {
      topRecipes(limit: $limit) { ${RECIPE_FIELDS} }
    }`,
    { token, variables: { limit } },
  )
  return data.topRecipes
}

export const getRecipe = async (id, token) => {
  const data = await graphqlRequest(
    `query Recipe($id: ID!) { recipe(id: $id) { ${RECIPE_FIELDS} } }`,
    { token, variables: { id } },
  )
  if (!data.recipe) throw new Error('failed to load recipe')
  return data.recipe
}

export const createRecipe = async (token, recipe) => {
  const data = await graphqlRequest(
    `mutation CreateRecipe(
      $title: String!
      $ingredients: [String!]!
      $imageUrl: String!
    ) {
      createRecipe(title: $title, ingredients: $ingredients, imageUrl: $imageUrl) {
        ${RECIPE_FIELDS}
      }
    }`,
    { token, variables: recipe },
  )
  return data.createRecipe
}

export const updateRecipe = async (token, id, recipe) => {
  const data = await graphqlRequest(
    `mutation UpdateRecipe(
      $id: ID!
      $title: String
      $ingredients: [String!]
      $imageUrl: String
    ) {
      updateRecipe(
        id: $id
        title: $title
        ingredients: $ingredients
        imageUrl: $imageUrl
      ) { ${RECIPE_FIELDS} }
    }`,
    { token, variables: { id, ...recipe } },
  )
  return data.updateRecipe
}

export const deleteRecipe = async (token, id) => {
  await graphqlRequest(
    `mutation DeleteRecipe($id: ID!) { deleteRecipe(id: $id) }`,
    { token, variables: { id } },
  )
}

export const likeRecipe = async (token, id) => {
  const data = await graphqlRequest(
    `mutation LikeRecipe($id: ID!) {
      likeRecipe(id: $id) { id likeCount likedByMe }
    }`,
    { token, variables: { id } },
  )
  return data.likeRecipe
}

export const unlikeRecipe = async (token, id) => {
  const data = await graphqlRequest(
    `mutation UnlikeRecipe($id: ID!) {
      unlikeRecipe(id: $id) { id likeCount likedByMe }
    }`,
    { token, variables: { id } },
  )
  return data.unlikeRecipe
}
