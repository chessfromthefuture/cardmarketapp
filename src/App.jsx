


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

  // Get API base URL from environment or use relative path
  const API_BASE = import.meta.env.VITE_API_URL || '';

  async function handleIdentify() {
    if (!selectedFile) return;
    setResult({ loading: true });
    const quickGuess = guessOnePieceFromFilename(selectedFile.name);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(`${API_BASE}/api/identify`, { method: "POST", body: formData });
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
      const res = await fetch(`${API_BASE}/api/search?${params.toString()}`);
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
  const [activeTab, setActiveTab] = useState("search");
  async function loadStats() {
    const res = await fetch(`${API_BASE}/api/stats`);
    const data = await res.json();
    setStats(data);
  }
  async function triggerRefresh() {
    await fetch(`${API_BASE}/api/refresh-onepiece`, { method: 'POST' });
    await loadStats();
  }
  async function importJson(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await fetch(`${API_BASE}/api/import-onepiece`, { method: 'POST', body: fd });
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
      await fetch(`${API_BASE}/api/import-onepiece-url`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl }) });
      await loadStats();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">🏴‍☠️ One Piece Card Market</h1>
        <p className="app-subtitle">Discover, Identify, and Manage Your One Piece Trading Card Collection</p>
        <div className="pirate-ship">
          <p style={{ fontSize: '0.9rem', color: 'var(--dark-navy)', marginTop: '1rem' }}>
            ⚓ Set sail on your card collecting adventure! ⚓
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tool-navigation">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            🔍 Search Cards
          </button>
          <button
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📸 Upload & Identify
          </button>
          <button
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📚 My Collection
          </button>
          <button
            className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ Admin
          </button>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="tool-section">
          <div className="search-section nami-navigation">
            <h3>🔍 Search One Piece Cards</h3>
            <div className="search-controls">
              <input
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by code (e.g., OP01-025) or name (e.g., Zoro)"
              />
              <button
                className="btn-primary"
                disabled={!searchQuery || searchLoading}
                onClick={() => fetchSearch(searchQuery)}
              >
                {searchLoading ? <span className="loading-spinner">Searching...</span> : '🔍 Search All'}
              </button>
            </div>
            <div className="advanced-search">
              <input
                value={adv.name}
                onChange={e => setAdv({ ...adv, name: e.target.value })}
                placeholder="Character Name"
              />
              <input
                value={adv.code}
                onChange={e => setAdv({ ...adv, code: e.target.value })}
                placeholder="Card Code"
              />
              <input
                value={adv.set}
                onChange={e => setAdv({ ...adv, set: e.target.value })}
                placeholder="Set/Expansion"
              />
              <input
                value={adv.rarity}
                onChange={e => setAdv({ ...adv, rarity: e.target.value })}
                placeholder="Rarity (SR, LDR, etc.)"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={adv.limit}
                onChange={e => setAdv({ ...adv, limit: Number(e.target.value) })}
                placeholder="Limit"
              />
              <input
                type="number"
                min={0}
                value={adv.offset}
                onChange={e => setAdv({ ...adv, offset: Number(e.target.value) })}
                placeholder="Offset"
              />
              <button className="btn-secondary" onClick={() => fetchSearch("")}>
                🔎 Advanced Search
              </button>
            </div>
            {searchQuery && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <div className="text-center p-3" style={{ color: "#888" }}>
                    No results found. Try a different search term.
                  </div>
                ) : (
                  searchResults.map((c) => (
                    <div key={c.card_code + String(c.cm_idProduct)} className="search-result-item fade-in">
                      <div>
                        <h4 className="straw-hat flag-wave">{c.name}</h4>
                        <div className="search-result-meta">
                          <span className="pirate-flag">{c.card_code}</span> · {c.cm_expansion} · {c.rarity}
                        </div>
                      </div>
                      <button className="btn-success btn-sm treasure-glow" onClick={() => handlePickCard(c)}>
                        ⚔️ Select
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="sample-cards straw-hat-crew">
            <h3>🎴 Quick Samples</h3>
            <div className="sample-buttons">
              <button className="btn-primary" onClick={() => handleLoadSample(0)}>
                🥇 Load Luffy Sample
              </button>
              <button className="btn-primary" onClick={() => handleLoadSample(1)}>
                ⚔️ Load Zoro Sample
              </button>
              <button className="btn-primary" onClick={() => handleLoadSample(2)}>
                🏥 Load Law Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="tool-section">
          <div className="upload-section zoro-swords">
            <h3>📸 Upload Card Image</h3>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="file-input"
              />
              <span className="file-input-label">
                📷 Choose Card Image
              </span>
            </div>
            {previewUrl && (
              <div className="image-preview">
                <img
                  src={previewUrl}
                  alt="Card preview"
                />
              </div>
            )}
            <button
              className="btn-primary btn-lg"
              onClick={handleIdentify}
              disabled={!selectedFile || (result && result.loading)}
            >
              {result && result.loading ? (
                <span className="loading-spinner">Identifying...</span>
              ) : (
                '🔍 Identify Card'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="tool-section">
          <div className="inventory-section chopper-medical">
            <h3>📚 My Collection ({inventory.length})</h3>
            {inventory.length === 0 ? (
              <div className="inventory-empty">
                <p>🏴‍☠️ No cards saved yet. Start by uploading an image or searching for cards!</p>
              </div>
            ) : (
              <div className="inventory-table">
                <table>
                  <thead>
                    <tr>
                      <th>Character</th>
                      <th>Code</th>
                      <th>Set</th>
                      <th>Language</th>
                      <th>Condition</th>
                      <th>Cardmarket ID</th>
                      <th>Notes</th>
                      <th>Confidence</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((e) => (
                      <tr key={e.id}>
                        <td className="straw-hat">{e.name}</td>
                        <td className="pirate-flag">{e.card_code}</td>
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
              </div>
            )}
            <div className="inventory-actions">
              <button
                className="btn-primary treasure-glow"
                onClick={handleExportCSV}
                disabled={inventory.length === 0}
              >
                📊 Export CSV
              </button>
              {csvUrl && (
                <a
                  href={csvUrl}
                  download={`card_inventory_${Date.now()}.csv`}
                  className="btn-secondary flag-wave"
                >
                  💾 Download CSV
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="tool-section">
          <div className="admin-panel sanji-cooking">
            <h3>⚙️ Admin Controls</h3>
            <div className="admin-controls">
              <button className="btn-primary" onClick={loadStats}>
                📊 Load Stats
              </button>
              <button className="btn-secondary" onClick={triggerRefresh}>
                🔄 Refresh One Piece (Cardmarket)
              </button>
              <label className="file-input-wrapper">
                <span className="file-input-label">📁 Import JSON</span>
                <input type="file" accept="application/json" onChange={importJson} className="file-input" />
              </label>
              <div className="d-flex gap-2 align-items-center">
                <input
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://.../onepiece.json"
                  className="search-input"
                  style={{ width: '260px' }}
                />
                <button
                  className="btn-success"
                  onClick={importFromUrl}
                  disabled={importing || !importUrl}
                >
                  {importing ? '⏳' : '🚀'} Go
                </button>
              </div>
              {stats && (
                <div className="admin-stats">
                  📈 Count: {stats.count} · 🔍 Searchable chars: {stats.sumSearchableChars}
                </div>
              )}
              {importing && <span className="loading-spinner">Importing...</span>}
            </div>
          </div>
        </div>
      )}

      {/* Card Detection Modal - Shows when result is available */}
      {result && !result.loading && (
        <div className="card-detection-modal">
          <div className="modal-overlay" onClick={() => setResult(null)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h3>🎯 Detected Card</h3>
              <button className="modal-close" onClick={() => setResult(null)}>×</button>
            </div>
            {result.error ? (
              <div className="error-message">
                ❌ Error: {result.error}
              </div>
            ) : (
              <>
                <div className="detection-form">
                  <div className="form-group">
                    <label>Character Name</label>
                    <input
                      value={result.name || ""}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      placeholder="Enter character name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Card Code</label>
                    <input
                      value={result.card_code || ""}
                      onChange={(e) => handleFieldChange("card_code", e.target.value)}
                      placeholder="e.g., OP01-001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Set/Expansion</label>
                    <input
                      value={result.cm_expansion || ""}
                      onChange={(e) => handleFieldChange("cm_expansion", e.target.value)}
                      placeholder="e.g., ROMANCE DAWN"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cardmarket ID</label>
                    <input
                      value={result.cm_idProduct || ""}
                      readOnly
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Language</label>
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
                    </div>
                    <div className="form-group">
                      <label>Condition</label>
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
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input
                      value={result.notes || ""}
                      onChange={(e) => handleFieldChange("notes", e.target.value)}
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Confidence Score</label>
                    <input
                      value={result.confidence}
                      readOnly
                      placeholder="Detection confidence"
                    />
                  </div>
                  {result.match_score !== undefined && (
                    <div className="form-group">
                      <label>Match Score</label>
                      <input
                        value={`${Math.round(result.match_score * 100)}%`}
                        readOnly
                        placeholder="Match percentage"
                      />
                    </div>
                  )}
                  {result.extracted_code && (
                    <div className="form-group">
                      <label>Extracted Code</label>
                      <input
                        value={result.extracted_code}
                        readOnly
                        placeholder="Code from OCR"
                      />
                    </div>
                  )}
                  {result.extracted_name && (
                    <div className="form-group">
                      <label>Extracted Name</label>
                      <input
                        value={result.extracted_name}
                        readOnly
                        placeholder="Name from OCR"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Raw OCR Text</label>
                    <textarea
                      value={result.raw_text || ""}
                      readOnly
                      rows={3}
                      placeholder="Raw text detected from image"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn-success btn-lg"
                    onClick={handleSave}
                    disabled={saving || !result.cm_idProduct}
                  >
                    {saving ? <span className="loading-spinner">Saving...</span> : '💾 Save to Inventory'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setResult(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <div className="treasure-chest">
          <h4 className="ocean-wave">💡 Pro Tips</h4>
          <p>
            <strong>📸 For best results:</strong> Use clear, well-lit photos with the card centered and flat.
            <br />
            <strong>🔍 Search tip:</strong> Try searching by character name, card code, or set name.
            <br />
            <strong>⚡ Performance:</strong> This is a local demo - your data stays on your device!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
