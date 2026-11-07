const API_BASE = import.meta.env.VITE_BACKEND_URL

export const getRecipes = async (queryParams) => {
  const res = await fetch(
    `${API_BASE}/recipes?` + new URLSearchParams(queryParams),
  )
  if (!res.ok) throw new Error('failed to load recipes')
  return await res.json()
}

export const getRecipe = async (id) => {
  const res = await fetch(`${API_BASE}/recipes/${id}`)
  if (!res.ok) throw new Error('failed to load recipe')
  return await res.json()
}

export const createRecipe = async (token, recipe) => {
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(recipe),
  })
  if (!res.ok) throw new Error('failed to create recipe')
  return await res.json()
}

export const updateRecipe = async (token, id, recipe) => {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(recipe),
  })
  if (!res.ok) throw new Error('failed to update recipe')
  return await res.json()
}

export const deleteRecipe = async (token, id) => {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('failed to delete recipe')
}
