import { Routes, Route } from 'react-router-dom';
import { Privacy } from './pages/privacy';
import { Home } from './pages/Home';
import { Error } from './pages/Error';
import { TrainDetails } from './pages/TrainDetails'
import { TrainBetweenStations } from './pages/TrainBetweenStations';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <ThemeProvider>
    <ThemeToggle />
    <div className="App">
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/trains/:trainNo' element={<TrainDetails/>} />
          <Route path='/trains-between/:stationNames' element={<TrainBetweenStations/>} />
          <Route path='/error' element={<Error/>} />
          <Route path='/privacy-policy' element={<Privacy/>} />
          <Route path='*' element={<Error/>} />
        </Routes>
    </div>
    </ThemeProvider>
  );
}

export default App;
