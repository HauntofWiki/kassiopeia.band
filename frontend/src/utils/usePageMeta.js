import { useEffect } from 'react'

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

export function usePageMeta(title, { description, image, type } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — kassiopeia` : 'kassiopeia'
    const desc = description || 'kassiopeia. music, shows, updates.'
    const img = image || '/kasslogo.png'

    document.title = fullTitle
    setMeta('og:title', fullTitle)
    setMeta('og:description', desc)
    setMeta('og:image', img)
    setMeta('og:url', window.location.href)
    setMeta('og:type', type || 'website')
    setMeta('og:site_name', 'kassiopeia')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)
  }, [title, description, image, type])
}
