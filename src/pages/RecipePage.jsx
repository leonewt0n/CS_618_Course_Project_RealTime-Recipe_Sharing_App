import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/Header.jsx'
import { Recipe } from '../components/Recipe.jsx'
import { getRecipe } from '../api/recipes.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export function RecipePage() {
  const { recipeId } = useParams()
  const [token] = useAuth()

  const recipeQuery = useQuery({
    queryKey: ['recipe', recipeId, token],
    queryFn: () => getRecipe(recipeId, token),
  })

  return (
    <div className='app-shell'>
      <Header />
      <p className='recipe-detail__back'>
        <Link className='back-link' to='/'>
          ← All recipes
        </Link>
      </p>
      {recipeQuery.isLoading ? (
        <div className='empty-state'>Loading recipe…</div>
      ) : recipeQuery.isError || !recipeQuery.data ? (
        <div className='empty-state'>This recipe is not available.</div>
      ) : (
        <div className='recipe-detail'>
          <Recipe {...recipeQuery.data} />
        </div>
      )}
    </div>
  )
}
