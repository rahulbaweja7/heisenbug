import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import ChallengesPage from "./ChallengesPage";
import ChallengePage from "./ChallengePage";
import MockAssessmentPage from "./MockAssessmentPage";
import { IdentityProvider } from './IdentityContext';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import NotFoundPage from "./NotFoundPage";

function App() {
  return (
    <IdentityProvider><BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
        <Route path="/mock" element={<MockAssessmentPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter></IdentityProvider>
  );
}

export default App;
