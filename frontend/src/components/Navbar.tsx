import { NavLink, Link } from "react-router-dom";

export default function Navbar(){
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="logo" /> EcoFinds
        </Link>
        <nav className="nav-links hstack">
          <NavLink to="/products" className={({isActive})=> isActive ? "active" : ""}>Products</NavLink>
          <NavLink to="/cart" className={({isActive})=> isActive ? "active" : ""}>Cart</NavLink>
          <NavLink to="/orders" className={({isActive})=> isActive ? "active" : ""}>Orders</NavLink>
          <NavLink to="/login" className={({isActive})=> isActive ? "active" : ""}>Login</NavLink>
        </nav>
      </div>
    </header>
  );
}
