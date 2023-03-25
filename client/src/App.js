import { BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './App.css'
import WatchGroups from './pages/WatchGroups'
import Home from './pages/Home'
import ErrorPage from './pages/ErrorPage'
import Navbar from './layouts/Navbar'


function App() {
  const client = new QueryClient();

  return (
    <div className="App">
      <QueryClientProvider client={client}>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch_groups" element={<WatchGroups />} />
            <Route path="*" element={<ErrorPage />} />
            
          </Routes>
        </Router>
      </QueryClientProvider>
    </div>
  );
}

export default App;
