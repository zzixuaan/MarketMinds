//import React from 'react';
//import logo from './logo.svg';
import './App.css';
import HomePage from "./temp pages/HomePage";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AUTH } from './temp pages/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AUTH />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App; 

