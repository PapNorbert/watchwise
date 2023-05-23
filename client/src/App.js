import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.css'

import './App.css'
import './Buttons.css'
import WatchGroupsPage from './pages/WatchGroups/WatchGroupsPage'
import Home from './pages/Home'
import ErrorPage from './pages/ErrorPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import Navigationbar from './layouts/Navbar'
import LanguageContextProvider from './context/LanguageContextProvider'
import Register from './pages/Register'
import Login from './pages/Login'
import LoginExpired from './layouts/LoginExpired'
import MoviesPage from './pages/Movies/MoviesPage'
import SeriesPage from './pages/Series/SeriesPage'
import UsersPage from './pages/Users/UsersPage'
import OpinionThreadsPage from './pages/OpinionThreads/OpinionThreadsPage'
import ModeratorRequestCreatePage from './pages/ModeratorRequestCreatePage'
import RequireAuth from './components/RequireAuth'
import { adminRoleCode } from './config/UserRoleCodes'
import SocketContextProvider from './context/SocketContextProvider'
import SideBar from './components/SideBar'
import useAuth from './hooks/useAuth'
import ChatBoxComponent from './components/ChatBoxComponent'

function App() {
  const { auth } = useAuth();

  return (
    <div className='App'>
      <SocketContextProvider>
        <LanguageContextProvider>
          <Router>
            <Navigationbar />
            <LoginExpired />
            <SideBar>
              <div className='container container-fluid'>
                <Routes>
                  <Route path='/' element={<Home />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/login' element={<Login />} />
                  <Route path='/watch_groups/*' element={<WatchGroupsPage />} />
                  <Route path='/opinion_threads/*' element={<OpinionThreadsPage />} />
                  <Route path='/movies/*' element={<MoviesPage />} />
                  <Route path='/series/*' element={<SeriesPage />} />
                  <Route element={<RequireAuth allowedRoles={[adminRoleCode]} />}>
                    <Route path='/users/*' element={<UsersPage />} />
                  </Route>
                  <Route element={<RequireAuth />}>
                    <Route path='/moderator/requests' element={<ModeratorRequestCreatePage />} />
                  </Route>
                  <Route path='/unauthorized' element={<UnauthorizedPage />} />
                  <Route path='/error-page' element={<ErrorPage />} />
                  <Route path='*' element={<Navigate to="/error-page" />} />

                </Routes>
              </div>
              {auth.logged_in &&
                <ChatBoxComponent />
              }
            </SideBar>
          </Router>
        </LanguageContextProvider>
      </SocketContextProvider>
    </div>
  );
}

export default App;
