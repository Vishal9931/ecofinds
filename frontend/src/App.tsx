import { useState } from "react";
import { login, getMe } from "./api";

function App() {
  const [email, setEmail] = useState("v@test.com");
  const [password, setPassword] = useState("secret123");
  const [output, setOutput] = useState<any>(null);

  const handleLogin = async () => {
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.data.token);
      const me = await getMe();
      setOutput(me.data);
    } catch (err: any) {
      setOutput(err.response?.data || { error: "Login failed" });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>EcoFinds</h1>
      <nav>
        <a href="/products">Products</a> | <a href="/cart">Cart</a> | <a href="/orders">Orders</a>
      </nav>

      <div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>
      <button onClick={handleLogin}>Login</button>
      <pre>{JSON.stringify(output, null, 2)}</pre>
    </div>
  );
}

export default App;
