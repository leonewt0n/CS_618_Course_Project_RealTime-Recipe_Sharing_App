import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/users.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const [, setToken] = useAuth()

  const loginMutation = useMutation({
    mutationFn: () => login({ username, password }),
    onSuccess: (data) => {
      setToken(data.token)
      navigate('/')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    loginMutation.mutate()
  }

  return (
    <div className='auth-page'>
      <div className='panel'>
        <Link className='back-link' to='/'>
          ← Back to Spoonful
        </Link>
        <h1>Welcome back</h1>
        <p className='lede'>Log in to manage and share your recipes.</p>
        <form className='form-grid' onSubmit={handleSubmit}>
          <div>
            <label htmlFor='login-username'>Username</label>
            <input
              id='login-username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete='username'
              required
            />
          </div>
          <div>
            <label htmlFor='login-password'>Password</label>
            <input
              id='login-password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
              required
            />
          </div>
          <button
            type='submit'
            disabled={!username || !password || loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Logging in…' : 'Log in'}
          </button>
          {loginMutation.isError ? (
            <p className='form-error'>Login failed. Check your username and password.</p>
          ) : null}
        </form>
        <p className='lede' style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          New here? <Link to='/signup'>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
