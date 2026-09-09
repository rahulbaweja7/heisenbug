import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import ChallengesPage from "./ChallengesPage";
import ChallengePage from "./ChallengePage";
import { IdentityProvider } from './IdentityContext';
import AdminAnalyticsPage from './AdminAnalyticsPage';

function App() {
  return (
    <IdentityProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
      </Routes>
    </BrowserRouter></IdentityProvider>
  );
}

export default App;
