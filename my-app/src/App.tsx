//import React from 'react';
//import logo from './logo.svg';
import './App.css';
import HomePage from "./temp pages/HomePage";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SIGNUP } from './temp pages/signup';
import { AUTH } from './temp pages/auth';

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

