import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'
import { deleteRecipe } from '../api/recipes.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { User } from './User.jsx'
import { RecipeForm } from './RecipeForm.jsx'

export function Recipe({ _id, title, ingredients = [], imageUrl, author }) {
  const [token] = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const currentUserId = token ? jwtDecode(token).sub : null
  const isOwner = Boolean(currentUserId && author && String(author) === String(currentUserId))

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(token, _id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })

  if (isEditing) {
    return (
      <RecipeForm
        recipe={{ _id, title, ingredients, imageUrl }}
        submitLabel='Save changes'
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <article className='recipe-card'>
      <div className='recipe-card__media'>
        <img src={imageUrl} alt={title} loading='lazy' />
      </div>
      <div className='recipe-card__body'>
        <h3>{title}</h3>
        {author ? (
          <div className='recipe-card__meta'>
            by <User id={author} />
          </div>
        ) : null}
        <ul className='ingredient-list'>
          {ingredients.map((item, index) => (
            <li key={`${_id}-${index}`}>{item}</li>
          ))}
        </ul>
        {isOwner ? (
          <div className='recipe-actions'>
            <button type='button' className='secondary' onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button
              type='button'
              className='danger'
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm(`Delete “${title}”?`)) {
                  deleteMutation.mutate()
                }
              }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

Recipe.propTypes = {
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  ingredients: PropTypes.arrayOf(PropTypes.string),
  imageUrl: PropTypes.string.isRequired,
  author: PropTypes.string,
}
