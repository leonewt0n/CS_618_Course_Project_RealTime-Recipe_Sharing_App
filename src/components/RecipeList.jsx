import PropTypes from 'prop-types'
import { Recipe } from './Recipe.jsx'

export function RecipeList({ recipes = [] }) {
  if (!recipes.length) {
    return (
      <div className='empty-state'>
        No recipes yet. Be the first to share something delicious.
      </div>
    )
  }

  return (
    <div className='recipe-grid'>
      {recipes.map((recipe) => (
        <Recipe key={recipe._id} {...recipe} />
      ))}
    </div>
  )
}

RecipeList.propTypes = {
  recipes: PropTypes.arrayOf(PropTypes.shape(Recipe.propTypes)).isRequired,
}
