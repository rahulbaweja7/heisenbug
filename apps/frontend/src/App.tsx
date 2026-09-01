import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChallengeList from "./ChallengeList";
import ChallengePage from "./ChallengePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChallengeList />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
