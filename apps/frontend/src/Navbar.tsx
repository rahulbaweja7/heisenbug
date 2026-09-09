import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="nb-nav">
      <Link to="/" className="nb-brand">
        Heisenbug
      </Link>
      <div className="nb-links">
        <Link
          to="/challenges"
          className={pathname.startsWith("/challenge") ? "nb-link active" : "nb-link"}
        >
          Challenges
        </Link>
        <a
          href="https://github.com/rahulbaweja7/heisenbug"
          target="_blank"
          rel="noreferrer"
          className="nb-link"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
