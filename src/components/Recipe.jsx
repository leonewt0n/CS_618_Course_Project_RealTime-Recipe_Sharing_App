import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'
import { deleteRecipe, likeRecipe, unlikeRecipe } from '../api/recipes.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { User } from './User.jsx'
import { RecipeForm } from './RecipeForm.jsx'

export function Recipe({
  id,
  title,
  ingredients = [],
  imageUrl,
  author,
  likeCount = 0,
  likedByMe = false,
}) {
  const [token] = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const currentUserId = token ? jwtDecode(token).sub : null
  const authorId = author?.id ?? author
  const isOwner = Boolean(
    currentUserId && authorId && String(authorId) === String(currentUserId),
  )

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] })
    queryClient.invalidateQueries({ queryKey: ['topRecipes'] })
  }

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(token, id),
    onSuccess: refresh,
  })

  const likeMutation = useMutation({
    mutationFn: () =>
      likedByMe ? unlikeRecipe(token, id) : likeRecipe(token, id),
    onSuccess: refresh,
  })

  if (isEditing) {
    return (
      <RecipeForm
        recipe={{ id, title, ingredients, imageUrl }}
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
            by <User id={authorId} username={author?.username} />
          </div>
        ) : null}
        <div className='like-row'>
          <span className='like-count'>
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </span>
          {token ? (
            <button
              type='button'
              className={likedByMe ? 'liked' : 'secondary'}
              aria-pressed={likedByMe}
              disabled={likeMutation.isPending}
              onClick={() => likeMutation.mutate()}
            >
              {likeMutation.isPending
                ? 'Saving…'
                : likedByMe
                  ? 'Liked'
                  : 'Like'}
            </button>
          ) : (
            <Link className='btn secondary' to='/login'>
              Log in to like
            </Link>
          )}
        </div>
        {likeMutation.isError ? (
          <p className='form-error'>Could not update like.</p>
        ) : null}
        <ul className='ingredient-list'>
          {ingredients.map((item, index) => (
            <li key={`${id}-${index}`}>{item}</li>
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
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  ingredients: PropTypes.arrayOf(PropTypes.string),
  imageUrl: PropTypes.string.isRequired,
  author: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
  }),
  likeCount: PropTypes.number,
  likedByMe: PropTypes.bool,
}
