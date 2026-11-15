function graphqlEndpoint() {
  const configured = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
  if (configured.endsWith('/graphql')) return configured
  const root = configured.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
  return `${root}/graphql`
}

export async function graphqlRequest(query, { variables, token } = {}) {
  let res
  try {
    res = await fetch(graphqlEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch {
    throw new Error('failed to reach the server')
  }

  const body = await res.json().catch(() => null)
  if (!body || body.errors?.length || !res.ok) {
    throw new Error(body?.errors?.[0]?.message || 'graphql request failed')
  }
  return body.data
}
