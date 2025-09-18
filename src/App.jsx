


import React, { useMemo, useRef, useState } from "react";
import "./App.css";
import { onePieceCards, findOnePieceByCodeOrName, guessOnePieceFromFilename } from "./data/onepiece";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [csvUrl, setCsvUrl] = useState(null);
  const fileInputRef = useRef();

  const languages = [
    { id: 1, name: "English" },
    { id: 3, name: "Japanese" },
    { id: 2, name: "German" },
    { id: 5, name: "French" },
    { id: 6, name: "Italian" },
    { id: 7, name: "Spanish" },
  ];
  const conditions = [
    "Mint",
    "Near Mint",
    "Excellent",
    "Good",
    "Light Played",
    "Played",
    "Poor",
  ];

  const sampleCards = [
    {
      name: "Monkey.D.Luffy",
      card_code: "OP01-001",
      cm_expansion: "ROMANCE DAWN",
      cm_idProduct: 123456,
      cm_idExpansion: 111,
      confidence: 0.97,
      raw_text: "MONKEY.D.LUFFY OP01-001 Leader",
    },
    {
      name: "Roronoa Zoro",
      card_code: "OP01-025",
      cm_expansion: "ROMANCE DAWN",
      cm_idProduct: 234567,
      cm_idExpansion: 111,
      confidence: 0.93,
      raw_text: "Roronoa Zoro OP01-025 Character",
    },
    {
      name: "Trafalgar Law",
      card_code: "OP02-001",
      cm_expansion: "PARAMOUNT WAR",
      cm_idProduct: 345678,
      cm_idExpansion: 222,
      confidence: 0.9,
      raw_text: "Trafalgar Law OP02-001 Leader",
    },
  ];

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  }

  async function handleIdentify() {
    if (!selectedFile) return;
    setResult({ loading: true });
    const quickGuess = guessOnePieceFromFilename(selectedFile.name);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/identify", { method: "POST", body: formData });
      const data = await res.json();
      const best = data && data.cm_idProduct ? data : quickGuess || data;
      setResult({ ...best, language: 1, condition: "Near Mint", notes: "" });
    } catch (e) {
      const fallback = quickGuess || { error: e.message };
      setResult({ ...fallback, language: 1, condition: "Near Mint", notes: "" });
    }
  }

  function handleLoadSample(i) {
    const idx = typeof i === "number" ? i % sampleCards.length : 0;
    const data = sampleCards[idx];
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult({ ...data, language: 1, condition: "Near Mint", notes: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFieldChange(field, value) {
    setResult((r) => ({ ...r, [field]: value }));
  }

  function handleSave() {
    if (!result || !result.cm_idProduct) return;
    setSaving(true);
    const entry = {
      id: Date.now(),
      game: "One Piece",
      set_code: result.cm_expansion || "",
      card_code: result.card_code || "",
      name: result.name || "",
      rarity: "",
      language:
        languages.find((l) => l.id === Number(result.language))?.name || "",
      cm_idProduct: result.cm_idProduct,
      cm_idExpansion: result.cm_idExpansion || "",
      condition: result.condition,
      notes: result.notes || "",
      image_path: previewUrl || "",
      matched_confidence: result.confidence,
      timestamp: new Date().toISOString(),
    };
    setInventory((inv) => [...inv, entry]);
    setSaving(false);
    setResult(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleExportCSV() {
    const headers = [
      "id",
      "game",
      "set_code",
      "card_code",
      "name",
      "rarity",
      "language",
      "cm_idProduct",
      "cm_idExpansion",
      "condition",
      "notes",
      "image_path",
      "matched_confidence",
      "timestamp",
    ];
    const rows = inventory.map((e) =>
      headers
        .map((h) => `"${(e[h] ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    setCsvUrl(URL.createObjectURL(blob));
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adv, setAdv] = useState({ name: "", code: "", set: "", rarity: "", limit: 50, offset: 0 });
  const searchResults = useMemo(() => {
    if (remoteResults.length > 0) return remoteResults;
    return findOnePieceByCodeOrName(searchQuery).slice(0, 20);
  }, [remoteResults, searchQuery]);

  async function fetchSearch(q) {
    const qs = encodeURIComponent(q);
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (adv.name) params.set('name', adv.name);
      if (adv.code) params.set('code', adv.code);
      if (adv.set) params.set('set', adv.set);
      if (adv.rarity) params.set('rarity', adv.rarity);
      if (adv.limit) params.set('limit', String(adv.limit));
      if (adv.offset) params.set('offset', String(adv.offset));
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setRemoteResults(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      setRemoteResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handlePickCard(card) {
    setResult({ ...card, language: 1, condition: "Near Mint", notes: "", confidence: 0.99, raw_text: "manual" });
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Admin panel
  const [stats, setStats] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  async function loadStats() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  }
  async function triggerRefresh() {
    await fetch('/api/refresh-onepiece', { method: 'POST' });
    await loadStats();
  }
  async function importJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await fetch('/api/import-onepiece', { method: 'POST', body: fd });
      await loadStats();
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }
  async function importFromUrl() {
    if (!importUrl) return;
    setImporting(true);
    try {
      await fetch('/api/import-onepiece-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl }) });
      await loadStats();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Card Inventory App</h2>
      <div style={{ marginBottom: 12, padding: 12, border: '1px solid #eee' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Admin</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={loadStats}>Load Stats</button>
          <button onClick={triggerRefresh}>Refresh One Piece (Cardmarket)</button>
          <label style={{ display: 'inline-block' }}>
            Import JSON
            <input type="file" accept="application/json" onChange={importJson} style={{ marginLeft: 8 }} />
          </label>
          <span>
            Import from URL
            <input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://.../onepiece.json" style={{ marginLeft: 8, width: 260 }} />
            <button onClick={importFromUrl} disabled={importing || !importUrl}>Go</button>
          </span>
          {stats && (
            <span style={{ color: '#555' }}>
              Count: {stats.count} · Sum of searchable chars: {stats.sumSearchableChars}
            </span>
          )}
          {importing && <span>Importing...</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => handleLoadSample(0)}>Load sample 1</button>
        <button onClick={() => handleLoadSample(1)}>Load sample 2</button>
        <button onClick={() => handleLoadSample(2)}>Load sample 3</button>
      </div>
      <div style={{ border: "1px solid #eee", padding: 12, marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>Search One Piece cards</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code (e.g., OP01-025) or name (e.g., Zoro)"
            style={{ width: 360 }}
          />
          <button disabled={!searchQuery || searchLoading} onClick={() => fetchSearch(searchQuery)}>
            {searchLoading ? 'Searching...' : 'Search All'}
          </button>
        </div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <input value={adv.name} onChange={e => setAdv({ ...adv, name: e.target.value })} placeholder="Name" />
          <input value={adv.code} onChange={e => setAdv({ ...adv, code: e.target.value })} placeholder="Card code" />
          <input value={adv.set} onChange={e => setAdv({ ...adv, set: e.target.value })} placeholder="Set/Expansion" />
          <input value={adv.rarity} onChange={e => setAdv({ ...adv, rarity: e.target.value })} placeholder="Rarity (e.g., SR, LDR)" />
          <input type="number" min={1} max={100} value={adv.limit} onChange={e => setAdv({ ...adv, limit: Number(e.target.value) })} placeholder="Limit" />
          <input type="number" min={0} value={adv.offset} onChange={e => setAdv({ ...adv, offset: Number(e.target.value) })} placeholder="Offset" />
          <button onClick={() => fetchSearch("")}>Advanced Search</button>
        </div>
        {searchQuery && (
          <div style={{ marginTop: 8, maxHeight: 200, overflow: "auto", borderTop: "1px solid #f0f0f0" }}>
            {searchResults.length === 0 ? (
              <div style={{ color: "#888", paddingTop: 6 }}>No results.</div>
            ) : (
              searchResults.map((c) => (
                <div key={c.card_code + String(c.cm_idProduct)} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{c.card_code} · {c.cm_expansion} · {c.rarity}</div>
                  </div>
                  <button onClick={() => handlePickCard(c)}>Select</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div style={{ border: "1px dashed #aaa", padding: 20, marginBottom: 20 }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        {previewUrl && (
          <div style={{ margin: "1rem 0" }}>
            <img
              src={previewUrl}
              alt="preview"
              style={{ maxWidth: 300, maxHeight: 200 }}
            />
          </div>
        )}
        <button onClick={handleIdentify} disabled={!selectedFile || (result && result.loading)}>
          {result && result.loading ? "Identifying..." : "Identify Card"}
        </button>
      </div>

      {result && !result.loading && (
        <div style={{ border: "1px solid #ddd", padding: 16, marginBottom: 20 }}>
          {result.error ? (
            <div style={{ color: "red" }}>Error: {result.error}</div>
          ) : (
            <>
              <h4>Detected Card</h4>
              <div>
                <label>
                  Name:{" "}
                  <input
                    value={result.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    style={{ width: 240 }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Code:{" "}
                  <input
                    value={result.card_code || ""}
                    onChange={(e) => handleFieldChange("card_code", e.target.value)}
                    style={{ width: 140 }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Set:{" "}
                  <input
                    value={result.cm_expansion || ""}
                    onChange={(e) => handleFieldChange("cm_expansion", e.target.value)}
                    style={{ width: 200 }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Cardmarket ID:{" "}
                  <input value={result.cm_idProduct || ""} readOnly style={{ width: 120, background: "#eee" }} />
                </label>
              </div>
              <div>
                <label>
                  Language:{" "}
                  <select
                    value={result.language}
                    onChange={(e) => handleFieldChange("language", e.target.value)}
                  >
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ marginLeft: 16 }}>
                  Condition:{" "}
                  <select
                    value={result.condition}
                    onChange={(e) => handleFieldChange("condition", e.target.value)}
                  >
                    {conditions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Notes:{" "}
                  <input
                    value={result.notes || ""}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    style={{ width: 260 }}
                  />
                </label>
              </div>
              <div>
                <label>
                  Confidence:{" "}
                  <input value={result.confidence} readOnly style={{ width: 80, background: "#eee" }} />
                </label>
              </div>
              <div>
                <label>
                  Raw OCR:{" "}
                  <textarea
                    value={result.raw_text || ""}
                    readOnly
                    rows={3}
                    style={{ width: 340, background: "#f9f9f9" }}
                  />
                </label>
              </div>
              <button onClick={handleSave} disabled={saving || !result.cm_idProduct} style={{ marginTop: 10 }}>
                Save to Inventory
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h4>Inventory ({inventory.length})</h4>
        {inventory.length === 0 ? (
          <div>No cards saved yet.</div>
        ) : (
          <table border="1" cellPadding={4} style={{ fontSize: 14, width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Set</th>
                <th>Language</th>
                <th>Condition</th>
                <th>Cardmarket ID</th>
                <th>Notes</th>
                <th>Confidence</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.card_code}</td>
                  <td>{e.set_code}</td>
                  <td>{e.language}</td>
                  <td>{e.condition}</td>
                  <td>{e.cm_idProduct}</td>
                  <td>{e.notes}</td>
                  <td>{e.matched_confidence}</td>
                  <td>{e.timestamp.slice(0, 19).replace("T", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={handleExportCSV} disabled={inventory.length === 0} style={{ marginTop: 10 }}>
          Export CSV
        </button>
        {csvUrl && (
          <a
            href={csvUrl}
            download={`card_inventory_${Date.now()}.csv`}
            style={{ marginLeft: 16 }}
          >
            Download CSV
          </a>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#888" }}>
        <p>
          <b>Tip:</b> This is a local demo. Use clear, deskewed photos for best results.
        </p>
      </div>
    </div>
  );
}

export default App;
