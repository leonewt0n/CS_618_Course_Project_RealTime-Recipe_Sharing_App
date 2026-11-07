import { Recipe } from '../db/models/recipe.js'
import { User } from '../db/models/user.js'

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return ingredients
  return ingredients.map((item) => String(item).trim()).filter(Boolean)
}

export async function createRecipe(
  userId,
  { title, ingredients, imageUrl },
) {
  const recipe = new Recipe({
    title,
    ingredients: normalizeIngredients(ingredients),
    imageUrl,
    author: userId,
  })
  return await recipe.save()
}

async function listRecipes(
  query = {},
  { sortBy = 'createdAt', sortOrder = 'descending' } = {},
) {
  return await Recipe.find(query).sort({ [sortBy]: sortOrder })
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
  return await Recipe.deleteOne({ _id: recipeId, author: userId })
}
