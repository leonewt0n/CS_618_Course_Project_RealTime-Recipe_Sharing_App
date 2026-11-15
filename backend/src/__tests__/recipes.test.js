import mongoose from 'mongoose'
import { graphql } from 'graphql'
import { describe, expect, test, beforeEach, beforeAll } from '@jest/globals'
import {
  createRecipe,
  listAllRecipes,
  listRecipesByAuthor,
  getRecipeById,
  getRecipeView,
  getTopRecipes,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  unlikeRecipe,
} from '../services/recipes.js'
import { Recipe } from '../db/models/recipe.js'
import { Like } from '../db/models/like.js'
import { createUser } from '../services/users.js'
import { schema } from '../graphql/schema.js'
import { readUserId } from '../middleware/jwt.js'

let testUser = null
let sampleRecipes = []

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
  testUser = await createUser({ username: 'chef', password: 'hunter2' })
  sampleRecipes = [
    {
      title: 'Tomato Basil Pasta',
      author: testUser._id,
      ingredients: ['pasta', 'tomatoes', 'basil'],
      imageUrl: 'https://example.com/pasta.jpg',
    },
    {
      title: 'Avocado Toast',
      author: testUser._id,
      ingredients: ['bread', 'avocado', 'salt'],
      imageUrl: 'https://example.com/toast.jpg',
    },
    {
      title: 'Berry Smoothie',
      author: testUser._id,
      ingredients: ['berries', 'yogurt', 'honey'],
      imageUrl: 'https://example.com/smoothie.jpg',
    },
  ]
})

describe('creating recipes', () => {
  test('with all parameters should succeed', async () => {
    const recipe = {
      title: 'Garlic Shrimp',
      ingredients: ['shrimp', 'garlic', 'butter'],
      imageUrl: 'https://example.com/shrimp.jpg',
    }

    const createdRecipe = await createRecipe(testUser._id, recipe)
    expect(createdRecipe._id).toBeInstanceOf(mongoose.Types.ObjectId)

    const foundRecipe = await Recipe.findById(createdRecipe._id)
    expect(foundRecipe).toEqual(expect.objectContaining(recipe))
    expect(foundRecipe.createdAt).toBeInstanceOf(Date)
    expect(foundRecipe.updatedAt).toBeInstanceOf(Date)
    expect(String(foundRecipe.author)).toMatch(String(testUser._id))
  })

  test('without title should fail', async () => {
    const recipe = {
      ingredients: ['eggs'],
      imageUrl: 'https://example.com/eggs.jpg',
    }
    await expect(createRecipe(testUser._id, recipe)).rejects.toBeInstanceOf(
      mongoose.Error.ValidationError,
    )
  })

  test('without ingredients should fail', async () => {
    const recipe = {
      title: 'Empty Bowl',
      ingredients: [],
      imageUrl: 'https://example.com/empty.jpg',
    }
    await expect(createRecipe(testUser._id, recipe)).rejects.toBeInstanceOf(
      mongoose.Error.ValidationError,
    )
  })
})

let createdSampleRecipes = []

beforeEach(async () => {
  await Like.deleteMany({})
  await Recipe.deleteMany({})
  createdSampleRecipes = []
  for (const recipe of sampleRecipes) {
    const createdRecipe = new Recipe(recipe)
    createdSampleRecipes.push(await createdRecipe.save())
  }
})

describe('listing recipes', () => {
  test('should return all recipes', async () => {
    const recipes = await listAllRecipes()
    expect(recipes.length).toEqual(createdSampleRecipes.length)
  })

  test('should return recipes sorted by creation date descending by default', async () => {
    const recipes = await listAllRecipes()
    const sortedSampleRecipes = [...createdSampleRecipes].sort(
      (a, b) => b.createdAt - a.createdAt,
    )
    expect(recipes.map((recipe) => recipe.createdAt)).toEqual(
      sortedSampleRecipes.map((recipe) => recipe.createdAt),
    )
  })

  test('should take into account provided sorting options', async () => {
    const recipes = await listAllRecipes({
      sortBy: 'updatedAt',
      sortOrder: 'ascending',
    })
    const sortedSampleRecipes = [...createdSampleRecipes].sort(
      (a, b) => a.updatedAt - b.updatedAt,
    )
    expect(recipes.map((recipe) => recipe.updatedAt)).toEqual(
      sortedSampleRecipes.map((recipe) => recipe.updatedAt),
    )
  })

  test('should be able to filter recipes by author', async () => {
    const recipes = await listRecipesByAuthor(testUser.username)
    expect(recipes.length).toBe(3)
  })
})

describe('getting a recipe', () => {
  test('should return the full recipe', async () => {
    const recipe = await getRecipeById(createdSampleRecipes[0]._id)
    expect(recipe.toObject()).toEqual(createdSampleRecipes[0].toObject())
  })

  test('should fail if the id does not exist', async () => {
    const recipe = await getRecipeById('000000000000000000000000')
    expect(recipe).toEqual(null)
  })
})

describe('updating recipes', () => {
  test('should update the specified property', async () => {
    await updateRecipe(testUser._id, createdSampleRecipes[0]._id, {
      title: 'Updated Pasta',
    })
    const updatedRecipe = await Recipe.findById(createdSampleRecipes[0]._id)
    expect(updatedRecipe.title).toEqual('Updated Pasta')
  })

  test('should not update other properties', async () => {
    await updateRecipe(testUser._id, createdSampleRecipes[0]._id, {
      title: 'Updated Pasta',
    })
    const updatedRecipe = await Recipe.findById(createdSampleRecipes[0]._id)
    expect(updatedRecipe.imageUrl).toEqual('https://example.com/pasta.jpg')
  })

  test('should update the updatedAt timestamp', async () => {
    await updateRecipe(testUser._id, createdSampleRecipes[0]._id, {
      title: 'Updated Pasta',
    })
    const updatedRecipe = await Recipe.findById(createdSampleRecipes[0]._id)
    expect(updatedRecipe.updatedAt.getTime()).toBeGreaterThan(
      createdSampleRecipes[0].updatedAt.getTime(),
    )
  })

  test('should fail if the id does not exist', async () => {
    const recipe = await updateRecipe(
      testUser._id,
      '000000000000000000000000',
      { title: 'Missing' },
    )
    expect(recipe).toEqual(null)
  })
})

describe('likes and popularity', () => {
  let fan = null

  beforeAll(async () => {
    fan = await createUser({ username: 'fan', password: 'hunter2' })
  })

  test('a user can like a recipe once', async () => {
    const id = createdSampleRecipes[0]._id
    await likeRecipe(testUser._id, id)
    const again = await likeRecipe(testUser._id, id)
    expect(again.likeCount).toBe(1)
    expect(again.likedByMe).toBe(true)

    const otherView = await getRecipeView(id, fan._id)
    expect(otherView.likeCount).toBe(1)
    expect(otherView.likedByMe).toBe(false)
  })

  test('unlike removes the like', async () => {
    const id = createdSampleRecipes[0]._id
    await likeRecipe(testUser._id, id)
    const after = await unlikeRecipe(testUser._id, id)
    expect(after.likeCount).toBe(0)
    expect(after.likedByMe).toBe(false)
  })

  test('sorts and filters recipes by like count', async () => {
    await likeRecipe(testUser._id, createdSampleRecipes[0]._id)
    await likeRecipe(fan._id, createdSampleRecipes[0]._id)
    await likeRecipe(fan._id, createdSampleRecipes[1]._id)

    const byPopularity = await listAllRecipes({
      sortBy: 'likeCount',
      sortOrder: 'descending',
    })
    expect(byPopularity.map((recipe) => recipe.likeCount)).toEqual([2, 1, 0])

    const popularOnly = await listAllRecipes({ minLikes: 1 })
    expect(popularOnly).toHaveLength(2)
    expect(popularOnly.every((recipe) => recipe.likeCount >= 1)).toBe(true)
  })

  test('aggregates top recipes with $group', async () => {
    await likeRecipe(testUser._id, createdSampleRecipes[0]._id)
    await likeRecipe(fan._id, createdSampleRecipes[0]._id)
    await likeRecipe(fan._id, createdSampleRecipes[1]._id)

    const top = await getTopRecipes(5, fan._id)
    expect(top.map((recipe) => recipe.title)).toEqual([
      'Tomato Basil Pasta',
      'Avocado Toast',
    ])
    expect(top.map((recipe) => recipe.likeCount)).toEqual([2, 1])
    expect(top[0].likedByMe).toBe(true)
    expect(top[1].likedByMe).toBe(true)
  })

  test('deleting a recipe drops its likes from the ranking', async () => {
    await likeRecipe(testUser._id, createdSampleRecipes[0]._id)
    await deleteRecipe(testUser._id, createdSampleRecipes[0]._id)
    const top = await getTopRecipes(5)
    expect(top.map((recipe) => recipe.title)).toEqual([])
  })
})

describe('graphql api', () => {
  test('login returns a token that identifies the user', async () => {
    const result = await graphql({
      schema,
      source: `mutation {
        login(username: "chef", password: "hunter2") { token }
      }`,
      contextValue: {},
    })
    expect(result.errors).toBeUndefined()
    const userId = readUserId({
      headers: { authorization: `Bearer ${result.data.login.token}` },
    })
    expect(userId).toBe(String(testUser._id))
  })

  test('logged-out like is rejected and a logged-in like updates the count', async () => {
    const id = String(createdSampleRecipes[0]._id)
    const source = `mutation Like($id: ID!) {
      likeRecipe(id: $id) { id likeCount likedByMe }
    }`
    const rejected = await graphql({
      schema,
      source,
      variableValues: { id },
      contextValue: {},
    })
    expect(rejected.errors?.[0].message).toMatch(/logged in/)

    const liked = await graphql({
      schema,
      source,
      variableValues: { id },
      contextValue: { userId: String(testUser._id) },
    })
    expect(liked.errors).toBeUndefined()
    expect(liked.data.likeRecipe).toEqual({
      id,
      likeCount: 1,
      likedByMe: true,
    })

    const top = await graphql({
      schema,
      source: `query { topRecipes(limit: 3) { title likeCount } }`,
      contextValue: {},
    })
    expect(top.data.topRecipes).toEqual([
      { title: 'Tomato Basil Pasta', likeCount: 1 },
    ])
  })
})

describe('deleting recipes', () => {
  test('should remove the recipe from the database', async () => {
    const result = await deleteRecipe(testUser._id, createdSampleRecipes[0]._id)
    expect(result.deletedCount).toEqual(1)
    const deletedRecipe = await Recipe.findById(createdSampleRecipes[0]._id)
    expect(deletedRecipe).toEqual(null)
  })

  test('should fail if the id does not exist', async () => {
    const result = await deleteRecipe(testUser._id, '000000000000000000000000')
    expect(result.deletedCount).toEqual(0)
  })
})
