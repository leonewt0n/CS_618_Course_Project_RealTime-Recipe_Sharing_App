import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../realtime/socket.js'

const TOAST_LIMIT = 4
const TOAST_MS = 12000

export function RecipeNotifications() {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState([])

  const dismiss = (key) => {
    setNotes((current) => current.filter((note) => note.key !== key))
  }

  useEffect(() => {
    const socket = getSocket()
    const timers = new Set()

    const onCreated = (recipe) => {
      if (!recipe?.id || !recipe?.title) return
      const key = `${recipe.id}-${Date.now()}`
      setNotes((current) =>
        [{ key, id: String(recipe.id), title: String(recipe.title) }, ...current].slice(
          0,
          TOAST_LIMIT,
        ),
      )
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['topRecipes'] })
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        setNotes((current) => current.filter((note) => note.key !== key))
      }, TOAST_MS)
      timers.add(timer)
    }

    socket.on('recipe:created', onCreated)
    return () => {
      socket.off('recipe:created', onCreated)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [queryClient])

  return (
    <div className='toast-stack' aria-live='polite' aria-relevant='additions'>
      {notes.map((note) => (
        <article className='toast' key={note.key} role='status'>
          <p className='toast__kicker'>New recipe</p>
          <p className='toast__title'>{note.title}</p>
          <div className='toast__actions'>
            <Link className='btn' to={`/recipes/${note.id}`} onClick={() => dismiss(note.key)}>
              View recipe
            </Link>
            <button type='button' className='secondary' onClick={() => dismiss(note.key)}>
              Dismiss
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
