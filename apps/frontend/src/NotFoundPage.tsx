import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="nf-screen">
      <div className="nf-card">
        <div className="nf-code">404</div>
        <div className="nf-title">Nothing here</div>
        <p className="nf-text">
          This page doesn't exist — maybe the link is wrong or the challenge
          was renamed.
        </p>
        <div className="nf-actions">
          <Link className="nf-primary" to="/challenges">
            Browse challenges
          </Link>
          <Link className="nf-secondary" to="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
