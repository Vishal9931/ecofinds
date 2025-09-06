import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, getCategories, addToCart } from "../api";

const placeholder = "EF";

export default function ProductList(){
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<number|undefined>(undefined);

  useEffect(()=>{(async()=>{
    const res = await getCategories();
    setCategories(res.data);
  })()},[]);

  useEffect(()=>{(async()=>{
    const res = await getProducts({ q, categoryId });
    setProducts(res.data);
  })()},[q, categoryId]);

  const add = async (id:number) => {
    await addToCart(id,1);
    alert("Added to cart");
  };

  return (
    <>
      <Navbar />
      <div className="container stack">
        <div className="hstack" style={{justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
          <h2 style={{margin:0}}>Browse Products</h2>
          <div className="hstack" style={{gap:10}}>
            <input className="input" placeholder="Search products..." value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:240}}/>
            <select className="select" value={categoryId ?? ""} onChange={e=>setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">All categories</option>
              {categories.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid">
          {products.map((p:any)=>(
            <div key={p.id} className="card">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.title} className="card-media" style={{objectFit:"cover"}} />
              ) : (
                <div className="card-media">{placeholder}</div>
              )}
              <div className="card-body">
                <div className="hstack" style={{justifyContent:"space-between"}}>
                  <div className="card-title">{p.title}</div>
                  <div className="pill price">₹{p.price}</div>
                </div>
                <div className="card-meta">{p.category?.name ?? "Uncategorized"}</div>
                <div className="hstack" style={{marginTop:6}}>
                  <Link to={`/products/${p.id}`} className="btn">View</Link>
                  <button className="btn btn-primary" onClick={()=>add(p.id)}>Add to cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length===0 && <div className="muted">No products match your search.</div>}
      </div>
    </>
  );
}
