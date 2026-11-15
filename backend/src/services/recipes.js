import mongoose from 'mongoose'
import { Recipe } from '../db/models/recipe.js'
import { Like } from '../db/models/like.js'
import { User } from '../db/models/user.js'

const SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'likeCount'])

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return ingredients
  return ingredients.map((item) => String(item).trim()).filter(Boolean)
}

function sortSpec(sortBy, sortOrder) {
  const field = SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt'
  const direction = sortOrder === 'ascending' ? 1 : -1
  return { [field]: direction }
}

function viewerId(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return null
  return new mongoose.Types.ObjectId(String(userId))
}

async function listRecipes(
  query = {},
  { sortBy = 'createdAt', sortOrder = 'descending', minLikes = 0, userId } = {},
) {
  const viewer = viewerId(userId)
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'recipe',
        as: 'likeDocs',
      },
    },
    {
      $addFields: {
        likeCount: { $size: '$likeDocs' },
        likedByMe: viewer ? { $in: [viewer, '$likeDocs.user'] } : false,
      },
    },
  ]

  if (Number(minLikes) > 0) {
    pipeline.push({ $match: { likeCount: { $gte: Number(minLikes) } } })
  }

  pipeline.push(
    { $sort: sortSpec(sortBy, sortOrder) },
    { $project: { likeDocs: 0 } },
  )

  return await Recipe.aggregate(pipeline)
}

export async function listAllRecipes(options) {
  return await listRecipes({}, options)
}

export async function listRecipesByAuthor(authorUsername, options) {
  const user = await User.findOne({ username: authorUsername })
  if (!user) return []
  return await listRecipes({ author: user._id }, options)
}

export async function getRecipeById(recipeId) {
  return await Recipe.findById(recipeId)
}

export async function getRecipeView(recipeId, userId) {
  if (!mongoose.Types.ObjectId.isValid(String(recipeId))) return null
  const recipes = await listRecipes(
    { _id: new mongoose.Types.ObjectId(String(recipeId)) },
    { userId },
  )
  return recipes[0] ?? null
}

export async function createRecipe(userId, { title, ingredients, imageUrl }) {
  const recipe = new Recipe({
    title,
    ingredients: normalizeIngredients(ingredients),
    imageUrl,
    author: userId,
  })
  return await recipe.save()
}

export async function updateRecipe(
  userId,
  recipeId,
  { title, ingredients, imageUrl },
) {
  const updates = {}
  if (title !== undefined) updates.title = title
  if (imageUrl !== undefined) updates.imageUrl = imageUrl
  if (ingredients !== undefined) {
    updates.ingredients = normalizeIngredients(ingredients)
  }

  return await Recipe.findOneAndUpdate(
    { _id: recipeId, author: userId },
    { $set: updates },
    { new: true, runValidators: true },
  )
}

export async function deleteRecipe(userId, recipeId) {
  const result = await Recipe.deleteOne({ _id: recipeId, author: userId })
  if (result.deletedCount > 0) {
    await Like.deleteMany({ recipe: recipeId })
  }
  return result
}

async function requireExistingRecipe(recipeId) {
  if (!mongoose.Types.ObjectId.isValid(String(recipeId))) return null
  return await Recipe.exists({ _id: recipeId })
}

export async function likeRecipe(userId, recipeId) {
  const exists = await requireExistingRecipe(recipeId)
  if (!exists) return null
  try {
    await Like.create({ user: userId, recipe: recipeId })
  } catch (err) {
    if (err.code !== 11000) throw err
  }
  return await getRecipeView(recipeId, userId)
}

export async function unlikeRecipe(userId, recipeId) {
  const exists = await requireExistingRecipe(recipeId)
  if (!exists) return null
  await Like.deleteOne({ user: userId, recipe: recipeId })
  return await getRecipeView(recipeId, userId)
}

export async function getTopRecipes(limit = 5, userId) {
  const size = Math.min(Math.max(Number(limit) || 5, 1), 20)
  const ranked = await Like.aggregate([
    {
      $group: {
        _id: '$recipe',
        likeCount: { $sum: 1 },
        users: { $addToSet: '$user' },
      },
    },
    { $sort: { likeCount: -1, _id: 1 } },
    { $limit: size },
  ])
  if (!ranked.length) return []

  const recipes = await Recipe.find({
    _id: { $in: ranked.map((row) => row._id) },
  })
  const byId = new Map(recipes.map((recipe) => [String(recipe._id), recipe]))
  const viewer = userId ? String(userId) : null

  return ranked.flatMap((row) => {
    const recipe = byId.get(String(row._id))
    if (!recipe) return []
    return [
      {
        ...recipe.toObject(),
        likeCount: row.likeCount,
        likedByMe: viewer
          ? row.users.some((id) => String(id) === viewer)
          : false,
      },
    ]
  })
}
