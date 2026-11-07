import { Link } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { useAuth } from '../contexts/AuthContext.jsx'
import { User } from './User.jsx'

export function Header() {
  const [token, setToken] = useAuth()

  return (
    <header className='site-header'>
      <Link to='/' className='brand'>
        Spoon<span>ful</span>
      </Link>
      <div className='auth-cluster'>
        {token ? (
          <>
            <div className='user-chip'>
              Signed in as <User id={jwtDecode(token).sub} />
            </div>
            <button type='button' className='secondary' onClick={() => setToken(null)}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className='btn secondary' to='/login'>
              Log in
            </Link>
            <Link className='btn' to='/signup'>
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
