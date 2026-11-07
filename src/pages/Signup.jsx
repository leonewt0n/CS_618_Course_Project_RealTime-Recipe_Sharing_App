import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/users.js'

export function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const signupMutation = useMutation({
    mutationFn: () => signup({ username, password }),
    onSuccess: () => navigate('/login'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    signupMutation.mutate()
  }

  return (
    <div className='auth-page'>
      <div className='panel'>
        <Link className='back-link' to='/'>
          ← Back to Spoonful
        </Link>
        <h1>Join Spoonful</h1>
        <p className='lede'>Create an account to start posting recipes.</p>
        <form className='form-grid' onSubmit={handleSubmit}>
          <div>
            <label htmlFor='signup-username'>Username</label>
            <input
              id='signup-username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete='username'
              required
            />
          </div>
          <div>
            <label htmlFor='signup-password'>Password</label>
            <input
              id='signup-password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='new-password'
              required
            />
          </div>
          <button
            type='submit'
            disabled={!username || !password || signupMutation.isPending}
          >
            {signupMutation.isPending ? 'Creating account…' : 'Sign up'}
          </button>
          {signupMutation.isError ? (
            <p className='form-error'>
              Could not create that account. The username may already be taken.
            </p>
          ) : null}
        </form>
        <p className='lede' style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          Already have an account? <Link to='/login'>Log in</Link>
        </p>
      </div>
    </div>
  )
}
