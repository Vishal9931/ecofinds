import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="nav">
        <div className="container nav__inner">
          <NavLink to="/" className="brand">EcoFinds</NavLink>
          <nav className="nav__links">
            <NavLink
              to="/products"
              className={({ isActive }) => isActive ? "nav__link active" : "nav__link"}
            >
              Products
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) => isActive ? "nav__link active" : "nav__link"}
            >
              Cart
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) => isActive ? "nav__link active" : "nav__link"}
            >
              Orders
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <span className="muted">© {new Date().getFullYear()} EcoFinds</span>
        </div>
      </footer>
    </div>
  );
}
