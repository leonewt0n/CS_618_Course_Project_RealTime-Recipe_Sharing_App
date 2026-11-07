import { createContext, useState, useContext, useEffect } from 'react'
import PropTypes from 'prop-types'

const TOKEN_KEY = 'spoonful_token'

export const AuthContext = createContext({
  token: null,
  setToken: () => {},
})

export const AuthContextProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY))

  const setToken = (nextToken) => {
    setTokenState(nextToken)
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  useEffect(() => {
    if (!token) return
    try {
      const [, payload] = token.split('.')
      const { exp } = JSON.parse(atob(payload))
      if (exp && exp * 1000 < Date.now()) {
        setToken(null)
      }
    } catch {
      setToken(null)
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useAuth() {
  const { token, setToken } = useContext(AuthContext)
  return [token, setToken]
}
