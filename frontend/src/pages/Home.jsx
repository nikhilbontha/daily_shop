import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Home(){
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  useEffect(()=>{
    axios.get('/api/products')
      .then(r=>setProducts(r.data))
      .catch(err=>{
        if(err.response && err.response.status === 429){
          setError("Too many requests. Please wait a moment and try again.");
        } else {
          setError("Failed to load products. Please try again later.");
        }
      });
  },[]);
  return (
    <div className="container">
      <header className="header"><h1>My Shop</h1><Link to="/cart">Cart</Link></header>
      {error && <div style={{color:'red',marginBottom:16}}>{error}</div>}
      <div className="grid">
        {products.map(p=>(
          <div className="card" key={p._id}>
            <img src={p.image || ''} alt={p.name} style={{width:'100%',height:140,objectFit:'cover'}}/>
            <h3>{p.name}</h3>
            <p>₹{p.price}</p>
            <div style={{display:'flex',gap:8}}>
              <Link className="btn" to={`/product/${p._id}`}>View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
