import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BitgetBTCPrice from './components/index';
import AnotherComponent from './components/AnotherComponent';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<BitgetBTCPrice />} />
                    <Route path="/table" element={<AnotherComponent />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
