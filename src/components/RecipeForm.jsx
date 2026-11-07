import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRecipe, updateRecipe } from '../api/recipes.js'
import { useAuth } from '../contexts/AuthContext.jsx'

const emptyForm = {
  title: '',
  ingredients: [''],
  imageUrl: '',
}

export function RecipeForm({
  recipe = null,
  onCancel = null,
  submitLabel = 'Share recipe',
}) {
  const [token] = useAuth()
  const queryClient = useQueryClient()
  const isEditing = Boolean(recipe)

  const [title, setTitle] = useState(recipe?.title ?? emptyForm.title)
  const [ingredients, setIngredients] = useState(
    recipe?.ingredients?.length ? recipe.ingredients : [...emptyForm.ingredients],
  )
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? emptyForm.imageUrl)

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        ingredients: ingredients.map((item) => item.trim()).filter(Boolean),
        imageUrl: imageUrl.trim(),
      }
      return isEditing
        ? updateRecipe(token, recipe._id, payload)
        : createRecipe(token, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      if (!isEditing) {
        setTitle('')
        setIngredients([''])
        setImageUrl('')
      }
      onCancel?.()
    },
  })

  if (!token) {
    return (
      <div className='panel'>
        <h2>Share a recipe</h2>
        <p className='lede'>Log in to post your favorite dishes with the community.</p>
      </div>
    )
  }

  const updateIngredient = (index, value) => {
    setIngredients((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
  }

  const addIngredient = () => setIngredients((current) => [...current, ''])

  const removeIngredient = (index) => {
    setIngredients((current) =>
      current.length === 1 ? [''] : current.filter((_, i) => i !== index),
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate()
  }

  const canSubmit =
    title.trim() &&
    imageUrl.trim() &&
    ingredients.some((item) => item.trim()) &&
    !mutation.isPending

  return (
    <div className='panel'>
      <h2>{isEditing ? 'Edit recipe' : 'Share a recipe'}</h2>
      <p className='lede'>
        {isEditing
          ? 'Update the details for your dish.'
          : 'Add a title, ingredients, and an image URL.'}
      </p>
      <form className='form-grid' onSubmit={handleSubmit}>
        <div>
          <label htmlFor='recipe-title'>Title</label>
          <input
            id='recipe-title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Herb roasted chicken'
            required
          />
        </div>

        <div>
          <label htmlFor='recipe-image'>Image URL</label>
          <input
            id='recipe-image'
            type='url'
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder='https://…'
            required
          />
          {imageUrl.trim() ? (
            <div className='recipe-card__media' style={{ marginTop: '0.75rem', borderRadius: 14 }}>
              <img src={imageUrl} alt='Recipe preview' />
            </div>
          ) : null}
        </div>

        <div>
          <label>Ingredients</label>
          <div className='ingredient-editor'>
            {ingredients.map((item, index) => (
              <div className='ingredient-row' key={`ingredient-${index}`}>
                <input
                  value={item}
                  onChange={(e) => updateIngredient(index, e.target.value)}
                  placeholder={`Ingredient ${index + 1}`}
                  aria-label={`Ingredient ${index + 1}`}
                />
                <button
                  type='button'
                  className='secondary'
                  onClick={() => removeIngredient(index)}
                  aria-label={`Remove ingredient ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type='button' className='secondary' onClick={addIngredient}>
              Add ingredient
            </button>
          </div>
        </div>

        <div className='recipe-actions'>
          <button type='submit' disabled={!canSubmit}>
            {mutation.isPending ? 'Saving…' : submitLabel}
          </button>
          {onCancel ? (
            <button type='button' className='secondary' onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>

        {mutation.isError ? (
          <p className='form-error'>Could not save this recipe. Check your fields and try again.</p>
        ) : null}
        {mutation.isSuccess && !isEditing ? (
          <p className='form-success'>Recipe shared successfully.</p>
        ) : null}
      </form>
    </div>
  )
}

RecipeForm.propTypes = {
  recipe: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    ingredients: PropTypes.arrayOf(PropTypes.string).isRequired,
    imageUrl: PropTypes.string.isRequired,
  }),
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string,
}
