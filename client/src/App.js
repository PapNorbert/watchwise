import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'bootstrap/dist/css/bootstrap.css'

import './App.css'
import WatchGroupsPage from './pages/WatchGroups/WatchGroupsPage'
import Home from './pages/Home'
import ErrorPage from './pages/ErrorPage'
import Navigationbar from './layouts/Navbar'


function App() {
  const client = new QueryClient();

  return (
    <div className='App'>
      <QueryClientProvider client={client}>
        <Router>
          <Navigationbar />
          <div className='container container-fluid'>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/watch_groups/*' element={<WatchGroupsPage />} />
              <Route path='/error-page' element={<ErrorPage />} />
              <Route path='*' element={ <Navigate to="/error-page" /> } />
              
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </div>
  );
}

export default App;
