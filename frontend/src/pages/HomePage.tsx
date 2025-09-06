import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function HomePage(){
  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container">
          <div className="stack">
            <h1>Buy & sell pre-loved goods—<span style={{color:"var(--primary)"}}>sustainably</span>.</h1>
            <p>Discover unique finds, extend product lifecycles, and join a community that values reuse.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary">Create an account</Link>
              <Link to="/login" className="btn btn-ghost">I already have an account</Link>
              <Link to="/products" className="btn">Browse products</Link>
            </div>
          </div>
        </div>
      </section>
      <div className="container muted">Tip: filter by category or search keywords on the Products page.</div>
    </>
  );
}
