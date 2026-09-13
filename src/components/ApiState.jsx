import Icon from './Icon'

export default function ApiState({ loading, error, onRetry, children }) {
  if (loading) return <div className="api-state"><span className="api-spinner"></span><b>Loading business data…</b><p>Connecting to the configured API.</p></div>
  if (error) return <div className="api-state api-state--error"><Icon name="alert" size={24}/><b>Could not load data</b><p>{error}</p><button onClick={onRetry}>Try again</button></div>
  return children
}
