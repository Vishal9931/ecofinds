import { useEffect, useState } from "react";
import { getOrders } from "../api";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrders();
        setOrders(res.data);
      } catch (err) {
        console.error("Error fetching orders", err);
      }
    })();
  }, []);

  return (
    <section>
      <h2 className="section-title">My Orders</h2>

      {orders.length === 0 && <p className="muted">No orders yet.</p>}

      <div className="grid">
        {orders.map((o) => {
          const subtotal = o.items.reduce(
            (sum: number, it: any) => sum + (it.quantity * (it.price ?? it.priceAtPurchase ?? 0)),
            0
          );
          return (
            <article key={o.id} className="card">
              <h3>Order #{o.id}</h3>
              <p className="muted">{new Date(o.createdAt).toLocaleString()}</p>
              <div className="panel" style={{ marginTop: 10 }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {o.items.map((it: any) => (
                    <li key={it.id}>
                      {it.product.title} × {it.quantity} — {fmt.format(it.price ?? it.priceAtPurchase ?? 0)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="totals panel" style={{ marginTop: 10 }}>
                <strong>Subtotal</strong>
                <div>{fmt.format(subtotal)}</div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
