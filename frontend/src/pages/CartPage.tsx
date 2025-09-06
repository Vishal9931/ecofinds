import { useEffect, useState } from "react";
import { getCart, removeFromCart, checkout } from "../api";
import { useNavigate } from "react-router-dom";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const res = await getCart();
      setCart(res.data);
    } catch (err) {
      console.error("Error loading cart", err);
    }
  };

  useEffect(() => { loadCart(); }, []);

  const handleRemove = async (id: number) => {
    try {
      await removeFromCart(id);
      await loadCart();
    } catch {}
  };

  const handleCheckout = async () => {
    try {
      await checkout();
      alert("Checkout successful!");
      navigate("/orders");
    } catch {
      alert("Checkout failed");
    }
  };

  const total = cart.reduce((sum, ci) => sum + ci.quantity * ci.product.price, 0);

  return (
    <section>
      <h2 className="section-title">Your Cart</h2>

      {cart.length === 0 && <p className="muted">Cart is empty.</p>}

      <div className="grid">
        {cart.map((ci) => (
          <article key={ci.id} className="card">
            <h3>{ci.product.title}</h3>
            <p className="muted">
              {ci.quantity} × {fmt.format(ci.product.price)}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn danger" onClick={() => handleRemove(ci.id)}>Remove</button>
            </div>
          </article>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="totals panel" style={{ marginTop: 18 }}>
          <div>
            <strong>Total</strong>
            <div className="muted">{fmt.format(total)}</div>
          </div>
          <button className="btn primary" onClick={handleCheckout}>Checkout</button>
        </div>
      )}
    </section>
  );
}
