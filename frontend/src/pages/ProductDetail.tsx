import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProduct, addToCart } from "../api";

export default function ProductDetail(){
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(()=>{(async()=>{
    const res = await getProduct(Number(id));
    setProduct(res.data);
  })()},[id]);

  if(!product) return (<><Navbar /><div className="container">Loading…</div></>);

  return (
    <>
      <Navbar />
      <div className="container" style={{display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:24}}>
        <div className="card">
          {product.imageUrl ? (
            <img src={product.imageUrl} className="card-media" style={{objectFit:"cover"}} />
          ) : (
            <div className="card-media">EF</div>
          )}
        </div>

        <div className="panel stack">
          <h2 style={{margin:"0 0 6px"}}>{product.title}</h2>
          <div className="muted">Category: {product.category?.name ?? "—"}</div>
          <div className="muted">Seller: {product.owner?.username ?? "—"}</div>
          <div className="pill price" style={{width:"fit-content", marginTop:8}}>₹{product.price}</div>
          <p style={{marginTop:8}}>{product.description}</p>
          <div className="hstack" style={{gap:10, marginTop:6}}>
            <button className="btn btn-primary" onClick={()=>addToCart(product.id,1)}>Add to cart</button>
          </div>
        </div>
      </div>
    </>
  );
}
