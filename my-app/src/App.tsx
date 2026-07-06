//import React from 'react';
//import logo from './logo.svg';
import './App.css';
import HomePage from "./temp pages/HomePage";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AUTH } from './temp pages/auth';
import Journal from './temp pages/journal';
import { Profile } from "./temp pages/profile";
import { ForgotPassword }  from "./temp pages/forgotpassword";
import JournalEntry from "./temp pages/journalentry";
import { Onboarding } from "./temp pages/onboarding"
import { Trade } from "./temp pages/trade"
import { Portfolio } from "./temp pages/portfolio"
import JournalViewAll from "./temp pages/journalviewallpage";
import EditJournalEntryPage from "./temp pages/EditJournalEntryPage";
import RecentTradesPage from "./temp pages/RecentTrades";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element = {<AUTH />} />
        <Route path="/home" element = {<HomePage />} />
        <Route path="/journal" element = {<Journal />} />
        <Route path="/profile" element = {<Profile />} />
        <Route path ="/forgot-password" element = {<ForgotPassword />} />
        <Route path ="/onboarding" element = {<Onboarding />} />
        <Route path ="/trade" element = {<Trade />} />
        <Route path ="/journalentry" element = {<JournalEntry />} />
        <Route path ="/portfolio" element = {<Portfolio />} />
        <Route path ="/journalviewallpage" element = {<JournalViewAll />} />
        <Route path ="/journal/:entryId/edit" element = {<EditJournalEntryPage />} />
        <Route path ="/recent-trades" element = {<RecentTradesPage />} />
      </Routes>
    </BrowserRouter>
  );

}

export default App; 

