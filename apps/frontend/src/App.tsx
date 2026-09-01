import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import ChallengesPage from "./ChallengesPage";
import ChallengePage from "./ChallengePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
