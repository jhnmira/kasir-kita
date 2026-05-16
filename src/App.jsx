import { useState, useEffect, useRef } from "react";

const INITIAL_PRODUCTS = [
  { id: 1, name: "Kopi Hitam", price: 8000, stock: 50, category: "Minuman" },
  { id: 2, name: "Teh Manis", price: 6000, stock: 45, category: "Minuman" },
  { id: 3, name: "Nasi Goreng", price: 18000, stock: 20, category: "Makanan" },
  { id: 4, name: "Mie Ayam", price: 15000, stock: 15, category: "Makanan" },
  { id: 5, name: "Roti Bakar", price: 12000, stock: 30, category: "Makanan" },
  { id: 6, name: "Es Jeruk", price: 10000, stock: 40, category: "Minuman" },
];

const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const now = () => new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });

const TABS = ["Kasir", "Produk", "Laporan"];

export default function App() {
  const [tab, setTab] = useState("Kasir");
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Semua");
  const [showStruk, setShowStruk] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [bayar, setBayar] = useState("");
  const [showProdForm, setShowProdForm] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [prodForm, setProdForm] = useState({ name: "", price: "", stock: "", category: "" });
  const [toast, setToast] = useState(null);
  const strutRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const categories = ["Semua", ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Semua" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const addToCart = (prod) => {
    if (prod.stock <= 0) return showToast("Stok habis!", "error");
    setCart(prev => {
      const exist = prev.find(c => c.id === prod.id);
      if (exist) {
        if (exist.qty >= prod.stock) { showToast("Stok tidak cukup!", "error"); return prev; }
        return prev.map(c => c.id === prod.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const kembalian = Number(bayar.replace(/\D/g, "")) - total;

  const bayarNum = Number(bayar.replace(/\D/g, ""));

  const checkout = () => {
    if (cart.length === 0) return showToast("Keranjang kosong!", "error");
    if (bayarNum < total) return showToast("Uang bayar kurang!", "error");
    const sale = {
      id: Date.now(),
      items: [...cart],
      total,
      bayar: bayarNum,
      kembalian: bayarNum - total,
      waktu: now(),
    };
    setSales(prev => [sale, ...prev]);
    setProducts(prev => prev.map(p => {
      const item = cart.find(c => c.id === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    }));
    setLastSale(sale);
    setCart([]);
    setBayar("");
    setShowStruk(true);
    showToast("Transaksi berhasil!");
  };

  const openAddProd = () => {
    setEditProd(null);
    setProdForm({ name: "", price: "", stock: "", category: "" });
    setShowProdForm(true);
  };

  const openEditProd = (p) => {
    setEditProd(p);
    setProdForm({ name: p.name, price: p.price, stock: p.stock, category: p.category });
    setShowProdForm(true);
  };

  const saveProd = () => {
    if (!prodForm.name || !prodForm.price || !prodForm.stock) return showToast("Lengkapi data produk!", "error");
    if (editProd) {
      setProducts(prev => prev.map(p => p.id === editProd.id ? { ...p, ...prodForm, price: Number(prodForm.price), stock: Number(prodForm.stock) } : p));
      showToast("Produk diperbarui!");
    } else {
      setProducts(prev => [...prev, { id: Date.now(), ...prodForm, price: Number(prodForm.price), stock: Number(prodForm.stock) }]);
      showToast("Produk ditambahkan!");
    }
    setShowProdForm(false);
  };

  const deleteProd = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast("Produk dihapus!");
  };

  const totalPenjualan = sales.reduce((s, x) => s + x.total, 0);
  const totalTransaksi = sales.length;
  const avgTransaksi = totalTransaksi > 0 ? Math.round(totalPenjualan / totalTransaksi) : 0;

  const produkTerlaris = sales.flatMap(s => s.items).reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.qty;
    return acc;
  }, {});
  const terlarisList = Object.entries(produkTerlaris).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const printStruk = () => window.print();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#0f0f13", color: "#f0efe8" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #1a1a22; } ::-webkit-scrollbar-thumb { background: #3a3a48; border-radius: 2px; }
        input, button, select, textarea { font-family: inherit; }
        .btn { border: none; cursor: pointer; font-family: inherit; font-weight: 500; transition: all .15s; }
        .btn:active { transform: scale(.97); }
        .card { background: #1a1a22; border: 1px solid #2a2a35; border-radius: 12px; }
        .prod-card { background: #1a1a22; border: 1px solid #2a2a35; border-radius: 10px; padding: 12px; cursor: pointer; transition: all .15s; }
        .prod-card:hover { border-color: #c8f04a; transform: translateY(-1px); }
        .prod-card.low { border-color: #f04a4a44; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .badge-green { background: #c8f04a22; color: #c8f04a; }
        .badge-red { background: #f04a4a22; color: #f04a4a; }
        .badge-gray { background: #ffffff11; color: #888; }
        .inp { background: #0f0f13; border: 1px solid #2a2a35; border-radius: 8px; padding: 8px 12px; color: #f0efe8; font-size: 14px; outline: none; transition: border .15s; }
        .inp:focus { border-color: #c8f04a; }
        .inp::placeholder { color: #444; }
        .modal-bg { position: fixed; inset: 0; background: #00000088; display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
        .modal { background: #1a1a22; border: 1px solid #2a2a35; border-radius: 16px; padding: 24px; width: 100%; max-width: 420px; }
        @media print { .no-print { display: none !important; } .struk-print { display: block !important; } }
        .struk-print { display: none; }
        @keyframes slideUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 999; animation: slideUp .2s ease; white-space: nowrap; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: toast.type === "error" ? "#f04a4a" : "#c8f04a", color: toast.type === "error" ? "#fff" : "#0f0f13" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="no-print" style={{ background: "#13131a", borderBottom: "1px solid #2a2a35", padding: "0 24px", display: "flex", alignItems: "center", gap: 24, height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#c8f04a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#0f0f13", fontSize: 14, fontWeight: 700 }}>K</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.02em" }}>KasirKu</span>
          <span style={{ fontSize: 11, color: "#555", marginLeft: 4 }}>by Hunar</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {TABS.map(t => (
            <button key={t} className="btn" onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 13, background: tab === t ? "#c8f04a" : "transparent", color: tab === t ? "#0f0f13" : "#888", fontWeight: tab === t ? 600 : 400 }}>{t}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>{now()}</div>
      </div>

      {/* KASIR TAB */}
      {tab === "Kasir" && (
        <div className="no-print" style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
          {/* Produk */}
          <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
              <select className="inp" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {filtered.map(p => (
                <div key={p.id} className={`prod-card ${p.stock <= 3 ? "low" : ""}`} onClick={() => addToCart(p)}>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>
                    <span className="tag badge-gray">{p.category}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ color: "#c8f04a", fontWeight: 700, fontSize: 15, fontFamily: "'DM Mono', monospace" }}>{formatRp(p.price)}</div>
                  <div style={{ marginTop: 6, fontSize: 11, color: p.stock <= 3 ? "#f04a4a" : "#555" }}>
                    Stok: {p.stock} {p.stock <= 3 && p.stock > 0 ? "⚠ hampir habis" : p.stock === 0 ? "— habis" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keranjang */}
          <div style={{ width: 320, background: "#13131a", borderLeft: "1px solid #2a2a35", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a35" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Keranjang</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{cart.length} item</div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {cart.length === 0 && (
                <div style={{ color: "#444", fontSize: 13, textAlign: "center", marginTop: 40 }}>Pilih produk untuk ditambahkan</div>
              )}
              {cart.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#1a1a22", borderRadius: 8, border: "1px solid #2a2a35" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#c8f04a", fontFamily: "'DM Mono', monospace" }}>{formatRp(c.price)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button className="btn" onClick={() => changeQty(c.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, background: "#2a2a35", color: "#f0efe8", fontSize: 14 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                    <button className="btn" onClick={() => changeQty(c.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, background: "#2a2a35", color: "#f0efe8", fontSize: 14 }}>+</button>
                  </div>
                  <div style={{ fontSize: 12, color: "#888", minWidth: 60, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{formatRp(c.price * c.qty)}</div>
                </div>
              ))}
            </div>

            {/* Total & bayar */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #2a2a35", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888" }}>
                <span>Subtotal ({cart.reduce((s, c) => s + c.qty, 0)} item)</span>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRp(total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
                <span>Total</span>
                <span style={{ color: "#c8f04a", fontFamily: "'DM Mono', monospace" }}>{formatRp(total)}</span>
              </div>
              <input className="inp" placeholder="Uang bayar (Rp)" value={bayar} onChange={e => setBayar(e.target.value)} style={{ width: "100%", textAlign: "right", fontFamily: "'DM Mono', monospace" }} />
              {bayarNum > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: kembalian >= 0 ? "#c8f04a" : "#f04a4a" }}>
                  <span>Kembalian</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRp(Math.max(0, kembalian))}</span>
                </div>
              )}
              <button className="btn" onClick={checkout} style={{ background: "#c8f04a", color: "#0f0f13", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 15, width: "100%" }}>
                Bayar Sekarang
              </button>
              {cart.length > 0 && (
                <button className="btn" onClick={() => setCart([])} style={{ background: "transparent", color: "#555", padding: "6px", fontSize: 12 }}>Kosongkan keranjang</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUK TAB */}
      {tab === "Produk" && (
        <div className="no-print" style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Daftar Produk</div>
              <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{products.length} produk terdaftar</div>
            </div>
            <button className="btn" onClick={openAddProd} style={{ background: "#c8f04a", color: "#0f0f13", padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>+ Tambah Produk</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {products.map(p => (
              <div key={p.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{p.category}</div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", color: "#c8f04a", fontWeight: 600, fontSize: 15 }}>{formatRp(p.price)}</div>
                <div style={{ minWidth: 80, textAlign: "center" }}>
                  <span className={`tag ${p.stock <= 0 ? "badge-red" : p.stock <= 5 ? "badge-red" : "badge-green"}`}>
                    Stok: {p.stock}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn" onClick={() => openEditProd(p)} style={{ background: "#2a2a35", color: "#f0efe8", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}>Edit</button>
                  <button className="btn" onClick={() => deleteProd(p.id)} style={{ background: "#f04a4a22", color: "#f04a4a", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LAPORAN TAB */}
      {tab === "Laporan" && (
        <div className="no-print" style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Laporan Penjualan</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Pendapatan", value: formatRp(totalPenjualan), accent: true },
              { label: "Jumlah Transaksi", value: totalTransaksi + " transaksi" },
              { label: "Rata-rata Transaksi", value: formatRp(avgTransaksi) },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: s.accent ? "#c8f04a" : "#f0efe8", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Produk Terlaris</div>
              {terlarisList.length === 0 ? <div style={{ color: "#444", fontSize: 13 }}>Belum ada transaksi</div> : terlarisList.map(([name, qty], i) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < terlarisList.length - 1 ? "1px solid #2a2a35" : "none" }}>
                  <div style={{ fontSize: 13 }}>{name}</div>
                  <span className="tag badge-green">{qty} terjual</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Riwayat Transaksi</div>
              <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {sales.length === 0 ? <div style={{ color: "#444", fontSize: 13 }}>Belum ada transaksi</div> : sales.map(s => (
                  <div key={s.id} style={{ padding: "10px 12px", background: "#0f0f13", borderRadius: 8, border: "1px solid #2a2a35" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>{s.waktu}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#c8f04a", fontFamily: "'DM Mono', monospace" }}>{formatRp(s.total)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>{s.items.map(i => `${i.name} x${i.qty}`).join(", ")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Produk */}
      {showProdForm && (
        <div className="modal-bg no-print" onClick={() => setShowProdForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>{editProd ? "Edit Produk" : "Tambah Produk"}</div>
            {[
              { label: "Nama Produk", key: "name", placeholder: "contoh: Nasi Goreng" },
              { label: "Harga (Rp)", key: "price", placeholder: "contoh: 15000", type: "number" },
              { label: "Stok", key: "stock", placeholder: "contoh: 50", type: "number" },
              { label: "Kategori", key: "category", placeholder: "contoh: Makanan" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{f.label}</div>
                <input className="inp" type={f.type || "text"} placeholder={f.placeholder} value={prodForm[f.key]} onChange={e => setProdForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn" onClick={() => setShowProdForm(false)} style={{ flex: 1, padding: 10, borderRadius: 8, background: "#2a2a35", color: "#888", fontSize: 14 }}>Batal</button>
              <button className="btn" onClick={saveProd} style={{ flex: 2, padding: 10, borderRadius: 8, background: "#c8f04a", color: "#0f0f13", fontWeight: 700, fontSize: 14 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Struk */}
      {showStruk && lastSale && (
        <div className="modal-bg no-print">
          <div className="modal" style={{ maxWidth: 340 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, background: "#c8f04a22", border: "2px solid #c8f04a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Transaksi Berhasil!</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{lastSale.waktu}</div>
            </div>
            <div style={{ background: "#0f0f13", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#888" }}>STRUK PEMBELIAN</div>
              {lastSale.items.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{i.name} x{i.qty}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRp(i.price * i.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed #2a2a35", marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}>
                  <span>Total</span>
                  <span style={{ color: "#c8f04a", fontFamily: "'DM Mono', monospace" }}>{formatRp(lastSale.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666" }}>
                  <span>Bayar</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRp(lastSale.bayar)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666" }}>
                  <span>Kembalian</span>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{formatRp(lastSale.kembalian)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={printStruk} style={{ flex: 1, padding: 10, borderRadius: 8, background: "#2a2a35", color: "#888", fontSize: 13 }}>Print Struk</button>
              <button className="btn" onClick={() => setShowStruk(false)} style={{ flex: 2, padding: 10, borderRadius: 8, background: "#c8f04a", color: "#0f0f13", fontWeight: 700, fontSize: 14 }}>Transaksi Baru</button>
            </div>
          </div>
        </div>
      )}

      {/* Stok Alert banner */}
      {products.filter(p => p.stock <= 3 && p.stock > 0).length > 0 && tab === "Kasir" && (
        <div className="no-print" style={{ position: "fixed", bottom: 16, left: 16, background: "#f04a4a", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, zIndex: 50 }}>
          ⚠ {products.filter(p => p.stock <= 3 && p.stock > 0).length} produk hampir habis stoknya
        </div>
      )}
    </div>
  );
}
