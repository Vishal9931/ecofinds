import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { register as apiRegister, login as apiLogin } from "../api";

export default function RegisterPage(){
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const res = await apiRegister(email, password, username);
      // try auto-login if backend returns token; else call login
      const token = (res as any)?.data?.token;
      if(token){
        localStorage.setItem("token", token);
        nav("/products");
      }else{
        // fallback: login
        const lr = await apiLogin(email, password);
        localStorage.setItem("token", lr.data.token);
        nav("/products");
      }
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Registration failed. Try a different email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{maxWidth:540}}>
        <h2 style={{marginBottom:12}}>Create your account</h2>
        <form onSubmit={onSubmit} className="panel">
          <div className="form-row">
            <label>Email</label>
            <input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Username</label>
            <input className="input" required value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {err && <div className="muted" style={{color:"var(--danger)"}}>{err}</div>}
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>{busy ? "Creating..." : "Sign up"}</button>
            <span className="muted">Have an account? <Link to="/login">Login</Link></span>
          </div>
        </form>
      </div>
    </>
  );
}
