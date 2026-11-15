import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/Header.jsx'
import { RecipeForm } from '../components/RecipeForm.jsx'
import { RecipeList } from '../components/RecipeList.jsx'
import { RecipeFilter } from '../components/RecipeFilter.jsx'
import { RecipeSorting } from '../components/RecipeSorting.jsx'
import { TopRecipes } from '../components/TopRecipes.jsx'
import { getRecipes } from '../api/recipes.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { getUserInfo } from '../api/users.js'
import { jwtDecode } from 'jwt-decode'

export function Home() {
  const [token] = useAuth()
  const [author, setAuthor] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('descending')
  const [popularOnly, setPopularOnly] = useState(false)
  const userId = token ? jwtDecode(token).sub : null

  const recipesQuery = useQuery({
    queryKey: ['recipes', { author, sortBy, sortOrder, popularOnly, userId }],
    queryFn: () =>
      getRecipes({ author, sortBy, sortOrder, popularOnly }, token),
  })

  const currentUsernameQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUserInfo(userId),
    enabled: Boolean(userId),
  })

  const recipes = recipesQuery.data ?? []

  return (
    <div className='app-shell'>
      <Header />

      <section className='hero' aria-label='Spoonful welcome'>
        <div className='hero-copy'>
          <h1 className='hero-brand'>
            Spoon<span>ful</span>
          </h1>
          <p>Collect the dishes you love, share them with friends, and keep every ingredient list in one place.</p>
        </div>
      </section>

      <RecipeForm />

      <div className='toolbar'>
        <RecipeFilter value={author} onChange={setAuthor} />
        <RecipeSorting
          fields={['createdAt', 'updatedAt', 'likeCount']}
          value={sortBy}
          onChange={setSortBy}
          orderValue={sortOrder}
          onOrderChange={setSortOrder}
        />
        <label className='check-field'>
          <input
            type='checkbox'
            checked={popularOnly}
            onChange={(e) => setPopularOnly(e.target.checked)}
          />
          Popular only
        </label>
        {token && currentUsernameQuery.data?.username ? (
          <button
            type='button'
            className='secondary'
            onClick={() => setAuthor(currentUsernameQuery.data.username)}
          >
            My recipes
          </button>
        ) : null}
        {author ? (
          <button type='button' className='secondary' onClick={() => setAuthor('')}>
            Clear filter
          </button>
        ) : null}
      </div>

      <TopRecipes token={token || undefined} />

      {recipesQuery.isLoading ? (
        <div className='empty-state'>Loading recipes…</div>
      ) : recipesQuery.isError ? (
        <div className='empty-state'>Could not load recipes. Is the API running?</div>
      ) : (
        <RecipeList recipes={recipes} />
      )}
    </div>
  )
}
