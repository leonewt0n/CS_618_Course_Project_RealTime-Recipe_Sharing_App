import PropTypes from 'prop-types'
import { useQuery } from '@tanstack/react-query'
import { jwtDecode } from 'jwt-decode'
import { getTopRecipes } from '../api/recipes.js'

export function TopRecipes({ token }) {
  const userId = token ? jwtDecode(token).sub : null
  const topQuery = useQuery({
    queryKey: ['topRecipes', userId],
    queryFn: () => getTopRecipes(5, token),
  })

  const recipes = topQuery.data ?? []

  return (
    <section className='top-recipes' aria-label='Top recipes'>
      <h2 className='section-title'>Top recipes</h2>
      <p className='section-lede'>Ranked by total likes.</p>
      {topQuery.isLoading ? (
        <div className='empty-state'>Loading top recipes…</div>
      ) : topQuery.isError ? (
        <div className='empty-state'>Could not load top recipes.</div>
      ) : recipes.length === 0 ? (
        <div className='empty-state'>
          No likes yet. Like a recipe to start the ranking.
        </div>
      ) : (
        <ol className='top-list'>
          {recipes.map((recipe, index) => (
            <li key={recipe.id}>
              <span>
                <strong>
                  {index + 1}. {recipe.title}
                </strong>
                {recipe.author?.username ? ` by ${recipe.author.username}` : ''}
              </span>
              <span className='like-count'>
                {recipe.likeCount} {recipe.likeCount === 1 ? 'like' : 'likes'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

TopRecipes.propTypes = {
  token: PropTypes.string,
}
