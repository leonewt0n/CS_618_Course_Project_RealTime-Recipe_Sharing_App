import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLError,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'
import { User } from '../db/models/user.js'
import { createUser, loginUser } from '../services/users.js'
import {
  createRecipe,
  deleteRecipe,
  getRecipeView,
  getTopRecipes,
  likeRecipe,
  listAllRecipes,
  listRecipesByAuthor,
  unlikeRecipe,
  updateRecipe,
} from '../services/recipes.js'

function badInput(message) {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } })
}

function notFound(message) {
  return new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } })
}

function requireUser(context) {
  if (!context?.userId) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
  return context.userId
}

function toRecipe(doc) {
  if (!doc) return null
  return {
    id: String(doc._id),
    title: doc.title,
    ingredients: doc.ingredients,
    imageUrl: doc.imageUrl,
    author: doc.author ? String(doc.author) : null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
    likeCount: doc.likeCount ?? 0,
    likedByMe: Boolean(doc.likedByMe),
  }
}

async function loadUser(id) {
  if (!id) return null
  try {
    const user = await User.findById(id).select('username')
    if (!user) return null
    return { id: String(user._id), username: user.username }
  } catch {
    return null
  }
}

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    username: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const RecipeType = new GraphQLObjectType({
  name: 'Recipe',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    ingredients: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString)),
      ),
    },
    imageUrl: { type: new GraphQLNonNull(GraphQLString) },
    author: {
      type: UserType,
      resolve: (recipe) => loadUser(recipe.author),
    },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: new GraphQLNonNull(GraphQLString) },
    likeCount: { type: new GraphQLNonNull(GraphQLInt) },
    likedByMe: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
})

const AuthPayloadType = new GraphQLObjectType({
  name: 'AuthPayload',
  fields: {
    token: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const RecipeSortField = new GraphQLEnumType({
  name: 'RecipeSortField',
  values: {
    CREATED_AT: { value: 'createdAt' },
    UPDATED_AT: { value: 'updatedAt' },
    LIKE_COUNT: { value: 'likeCount' },
  },
})

const SortOrder = new GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASCENDING: { value: 'ascending' },
    DESCENDING: { value: 'descending' },
  },
})

async function recipeList(args, context) {
  const options = {
    sortBy: args.sortBy,
    sortOrder: args.sortOrder,
    minLikes: args.popularOnly ? 1 : 0,
    userId: context.userId,
  }
  const docs = args.author
    ? await listRecipesByAuthor(args.author, options)
    : await listAllRecipes(options)
  return docs.map(toRecipe)
}

async function saveAndPresent(userId, recipeId) {
  const view = await getRecipeView(recipeId, userId)
  if (!view) throw notFound('Recipe not found.')
  return toRecipe(view)
}

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    recipes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RecipeType))),
      args: {
        author: { type: GraphQLString },
        sortBy: { type: RecipeSortField, defaultValue: 'createdAt' },
        sortOrder: { type: SortOrder, defaultValue: 'descending' },
        popularOnly: { type: GraphQLBoolean, defaultValue: false },
      },
      resolve: (_parent, args, context) => recipeList(args, context),
    },
    recipe: {
      type: RecipeType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_parent, { id }, context) =>
        toRecipe(await getRecipeView(id, context.userId)),
    },
    topRecipes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RecipeType))),
      args: { limit: { type: GraphQLInt, defaultValue: 5 } },
      resolve: async (_parent, { limit }, context) => {
        const docs = await getTopRecipes(limit, context.userId)
        return docs.map(toRecipe)
      },
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: (_parent, { id }) => loadUser(id),
    },
    me: {
      type: UserType,
      resolve: (_parent, _args, context) => loadUser(context.userId),
    },
  },
})

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    signup: {
      type: new GraphQLNonNull(UserType),
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_parent, { username, password }) => {
        try {
          const user = await createUser({ username, password })
          return { id: String(user._id), username: user.username }
        } catch {
          throw badInput(
            'failed to create the user, does the username already exist?',
          )
        }
      },
    },
    login: {
      type: new GraphQLNonNull(AuthPayloadType),
      args: {
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_parent, { username, password }) => {
        try {
          const token = await loginUser({ username, password })
          return { token }
        } catch {
          throw badInput(
            'login failed, did you enter the correct username/password?',
          )
        }
      },
    },
    createRecipe: {
      type: new GraphQLNonNull(RecipeType),
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        ingredients: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLString)),
          ),
        },
        imageUrl: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_parent, args, context) => {
        const userId = requireUser(context)
        try {
          const created = await createRecipe(userId, args)
          return await saveAndPresent(userId, created._id)
        } catch (err) {
          if (err instanceof GraphQLError) throw err
          if (err.name === 'ValidationError') throw badInput(err.message)
          throw err
        }
      },
    },
    updateRecipe: {
      type: new GraphQLNonNull(RecipeType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: GraphQLString },
        ingredients: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
        imageUrl: { type: GraphQLString },
      },
      resolve: async (_parent, { id, ...updates }, context) => {
        const userId = requireUser(context)
        try {
          const updated = await updateRecipe(userId, id, updates)
          if (!updated) throw notFound('Recipe not found.')
          return await saveAndPresent(userId, id)
        } catch (err) {
          if (err instanceof GraphQLError) throw err
          if (err.name === 'ValidationError') throw badInput(err.message)
          throw err
        }
      },
    },
    deleteRecipe: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_parent, { id }, context) => {
        const userId = requireUser(context)
        const { deletedCount } = await deleteRecipe(userId, id)
        if (!deletedCount) throw notFound('Recipe not found.')
        return true
      },
    },
    likeRecipe: {
      type: new GraphQLNonNull(RecipeType),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_parent, { id }, context) => {
        const userId = requireUser(context)
        const recipe = await likeRecipe(userId, id)
        if (!recipe) throw notFound('Recipe not found.')
        return toRecipe(recipe)
      },
    },
    unlikeRecipe: {
      type: new GraphQLNonNull(RecipeType),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_parent, { id }, context) => {
        const userId = requireUser(context)
        const recipe = await unlikeRecipe(userId, id)
        if (!recipe) throw notFound('Recipe not found.')
        return toRecipe(recipe)
      },
    },
  },
})

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})
