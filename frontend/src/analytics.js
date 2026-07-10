const BASE = '/api'

function postSummary(post) {
  if (!post) return {}
  const props = {}
  if (post.id != null) props.id = post.id
  if (post.type) props.type = post.type
  if (post.title) props.title = post.title
  return props
}

function sendEvent(event, props) {
  try {
    fetch(`${BASE}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, props, path: window.location.pathname }),
      keepalive: true,
    }).catch((err) => console.debug('analytics event failed', err))
  } catch (err) {
    console.debug('analytics event failed', err)
  }
}

export const trackPlay = (post) => sendEvent('play', postSummary(post))
export const trackPause = (post) => sendEvent('pause', postSummary(post))
export const trackResume = (post) => sendEvent('resume', postSummary(post))
export const trackSkip = (direction, post) => sendEvent('skip', { ...postSummary(post), direction })
export const trackComplete = (post) => sendEvent('complete', postSummary(post))
