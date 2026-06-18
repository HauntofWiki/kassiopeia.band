import { useEffect, useState } from 'react'
import { getLinks } from '../api'

export default function SocialBar() {
  const [links, setLinks] = useState([])

  useEffect(() => {
    getLinks().then(setLinks).catch(() => {})
  }, [])

  if (!links.length) return null

  return (
    <div style={styles.bar}>
      {links.map(link => {
        if (link.icon === 'radio') {
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="listen-free-pill"
              aria-label="Listen free on fm.kass.fm"
            >
              <img src={`/${link.icon}.svg`} alt="" />
              <span>Listen Free</span>
            </a>
          )
        }
        return (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={styles.link} title={link.label}>
            <img src={`/${link.icon}.svg`} alt={link.label} style={styles.icon} />
          </a>
        )
      })}
    </div>
  )
}

const styles = {
  bar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  link: {
    display: 'flex',
    opacity: 0.75,
    transition: 'opacity 0.15s',
  },
  icon: {
    width: '26px',
    height: '26px',
  },
}
