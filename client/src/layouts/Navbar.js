import React from 'react'
import { Link } from 'react-router-dom';


function Navbar() {

  return (
    <nav>
      <Link to="/">
        <button>Home</button>
      </Link>
      <Link to="/watch_groups">
        <button>Watch Groups</button>
      </Link>
    </nav>
  )
}

export default Navbar;