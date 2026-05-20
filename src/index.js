import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

import { TrainAndStationProvider, useTrainAndStation } from './context/TrainAndStationContext';

export { useTrainAndStation };

const root = ReactDOM.createRoot(document.getElementById('root'));
console.log("%c \uD83E\uDD19 Developed by crysosancher- https://bit.ly/crysosancher", "font-size: 12px;font-family: monospace;background: black;display: inline-block;color: white;padding: 15px;border: 2px solid white;")
root.render(
    <BrowserRouter>
    <TrainAndStationProvider>
    <App />
    </TrainAndStationProvider>
    </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
