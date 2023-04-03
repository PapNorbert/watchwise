import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'bootstrap/dist/css/bootstrap.css'

import './App.css'
import WatchGroupsPage from './pages/WatchGroups/WatchGroupsPage'
import Home from './pages/Home'
import ErrorPage from './pages/ErrorPage'
import Navigationbar from './layouts/Navbar'
import LanguageContextProvider from './context/LanguageContextProvider'
import Register from './pages/Register'
import Login from './pages/Login'
import AuthContextProvider from './context/AuthContextProvider'
import LoginExpired from './layouts/LoginExpired'


function App() {
  const client = new QueryClient();

  return (
    <div className='App'>
      <AuthContextProvider>
      <QueryClientProvider client={client}>
      <LanguageContextProvider>
        <Router>
          <Navigationbar />
          <LoginExpired />
          <div className='container container-fluid'>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/register' element={<Register />} />
              <Route path='/login' element={<Login />} />
              <Route path='/watch_groups/*' element={<WatchGroupsPage />} />
              <Route path='/error-page' element={<ErrorPage />} />
              <Route path='*' element={ <Navigate to="/error-page" /> } />
              
            </Routes>
          </div>
        </Router>
      </LanguageContextProvider>
      </QueryClientProvider>
      </AuthContextProvider>
    </div>
  );
}

export default App;
