import { useQuery } from '@tanstack/react-query'
import PropTypes from 'prop-types'
import { getUserInfo } from '../api/users.js'

export function User({ id, username }) {
  const userInfoQuery = useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserInfo(id),
    enabled: Boolean(id) && !username,
  })
  return <strong>{username ?? userInfoQuery.data?.username ?? id}</strong>
}

User.propTypes = {
  id: PropTypes.string,
  username: PropTypes.string,
}
