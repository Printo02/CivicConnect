import React from 'react'
import { NavLink } from 'react-router-dom'

const ShareInfo = () => {
  const items = [
    {icon: '', title:'Branches', path: '/'},
    {icon: '', title:'Branches', path: '/'}
  ]
  return (
    { items.map((e)  => (
    <div>
      {e.title}
      <NavLink to={e.path}></NavLink>
      </div>
    ))}
  )
}

export default ShareInfo