//import React from 'react';
//import logo from './logo.svg';
import './App.css';
import HomePage from "./Pages/HomePage";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SIGNUP } from './Pages/signup';
import { AUTH } from './Pages/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AUTH />} />
        <Route path="/signup" element={<SIGNUP />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App;

