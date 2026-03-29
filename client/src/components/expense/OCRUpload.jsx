import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

// Category icons mapping
const CATEGORY_ICONS = {
  'Food': '🍽️',
  'Travel': '✈️',
  'Accommodation': '🏨',
  'Transport': '🚗',
  'Fuel': '⛽',
  'Office Supplies': '📎',
  'Software & Subscriptions': '💻',
  'Communication': '📱',
  'Medical': '🏥',
  'Entertainment': '🎬',
  'Shopping': '🛍️',
  'Maintenance': '🔧',
  'Other': '📄',
};

const CURRENCY_SYMBOLS = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
  AED: 'AED', SAR: 'SAR', JPY: '¥',
};

/**
 * OCRUpload Component
 *
 * Props:
 *   onScanComplete(data) — called when OCR succeeds, passes the structured result
 *                          so the parent form can pre-fill its fields
 *
 * The parent form should handle:
 *   data.amount, data.currency, data.date, data.merchantName, data.category
 */
export default function OCRUpload({ onScanComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ── File selection handlers ──────────────────────────────────────────

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }

    setError(null);
    setResult(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleFileInput = (e) => handleFile(e.target.files[0]);
  const handleCameraInput = (e) => handleFile(e.target.files[0]);

  // ── OCR scan ────────────────────────────────────────────────────────

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/expenses/scan`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const data = response.data.data;
      setResult(data);

      // Notify parent form to pre-fill fields
      if (onScanComplete) onScanComplete(data);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to scan receipt. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ── Helpers ──────────────────────────────────────────────────────────

  const confidenceColor = (conf) => {
    if (conf >= 0.8) return '#10b981';   // green
    if (conf >= 0.5) return '#f59e0b';   // amber
    return '#ef4444';                    // red
  };

  const confidenceLabel = (conf) => {
    if (conf >= 0.8) return 'High Confidence';
    if (conf >= 0.5) return 'Medium Confidence';
    return 'Low Confidence — please verify';
  };

  const currencySymbol = (code) => CURRENCY_SYMBOLS[code] || code || '';

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>🤖</span>
        <div>
          <h3 style={styles.headerTitle}>AI Receipt Scanner</h3>
          <p style={styles.headerSub}>Upload your receipt and we'll fill the form automatically</p>
        </div>
      </div>

      {/* Drop zone */}
      {!previewUrl && (
        <div
          style={{
            ...styles.dropzone,
            ...(dragOver ? styles.dropzoneActive : {}),
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div style={styles.dropzoneIcon}>📄</div>
          <p style={styles.dropzoneText}>Drag & drop your receipt here</p>
          <p style={styles.dropzoneOr}>— or —</p>

          <div style={styles.buttonRow}>
            {/* Gallery picker */}
            <button
              style={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              📁 Choose File
            </button>

            {/* Camera capture (works on mobile) */}
            <button
              style={{ ...styles.uploadBtn, ...styles.cameraBtn }}
              onClick={() => cameraInputRef.current?.click()}
              type="button"
            >
              📷 Take Photo
            </button>
          </div>

          <p style={styles.hint}>JPEG, PNG, WebP · Max 10MB</p>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraInput}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Preview + Scan */}
      {previewUrl && !result && (
        <div style={styles.previewSection}>
          <div style={styles.previewHeader}>
            <span style={styles.previewFileName}>{file?.name}</span>
            <button style={styles.removeBtn} onClick={handleReset} type="button">✕ Remove</button>
          </div>

          <div style={styles.previewContainer}>
            <img src={previewUrl} alt="Receipt preview" style={styles.previewImage} />
          </div>

          <button
            style={{
              ...styles.scanBtn,
              ...(scanning ? styles.scanBtnLoading : {}),
            }}
            onClick={handleScan}
            disabled={scanning}
            type="button"
          >
            {scanning ? (
              <>
                <span style={styles.spinner} />
                Analyzing Receipt...
              </>
            ) : (
              '🔍 Scan & Auto-fill Form'
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={styles.resultsSection}>
          {/* Success banner */}
          <div style={styles.successBanner}>
            <span>✅</span>
            <div>
              <strong>Receipt scanned successfully!</strong>
              <p style={styles.successSub}>Form fields have been pre-filled. Review and adjust if needed.</p>
            </div>
            <button style={styles.rescanBtn} onClick={handleReset} type="button">
              🔄 Scan Another
            </button>
          </div>

          {/* Preview thumbnail */}
          <div style={styles.resultLayout}>
            <img src={previewUrl} alt="Receipt" style={styles.thumbImage} />

            <div style={styles.resultFields}>
              {/* Category chip */}
              <div style={styles.categoryChip}>
                <span style={styles.categoryIcon}>
                  {CATEGORY_ICONS[result.category] || '📄'}
                </span>
                <span style={styles.categoryName}>{result.category}</span>
                <span
                  style={{
                    ...styles.confidenceBadge,
                    background: confidenceColor(result.confidence) + '22',
                    color: confidenceColor(result.confidence),
                  }}
                >
                  {(result.confidence * 100).toFixed(0)}% · {confidenceLabel(result.confidence)}
                </span>
              </div>

              {/* Extracted fields grid */}
              <div style={styles.fieldsGrid}>
                <ResultField
                  label="Amount"
                  value={result.amount
                    ? `${currencySymbol(result.currency)}${result.amount.toLocaleString()}`
                    : null}
                  icon="💰"
                />
                <ResultField label="Currency" value={result.currency} icon="💱" />
                <ResultField label="Date" value={result.date} icon="📅" />
                <ResultField label="Merchant" value={result.merchantName} icon="🏪" />
              </div>

              {/* Method badge */}
              <div style={styles.methodBadge}>
                {result.method === 'groq-vision' ? '⚡ Groq Vision AI' : '🔤 OCR Fallback'}
              </div>
            </div>
          </div>

          {/* Low confidence warning */}
          {result.confidence < 0.5 && (
            <div style={styles.warningBox}>
              ⚠️ Some fields may be inaccurate. Please review all pre-filled values before submitting.
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: single result field ──────────────────────────────────

function ResultField({ label, value, icon }) {
  return (
    <div style={styles.resultField}>
      <span style={styles.fieldIcon}>{icon}</span>
      <div>
        <p style={styles.fieldLabel}>{label}</p>
        <p style={styles.fieldValue}>
          {value || <span style={styles.fieldMissing}>Not detected</span>}
        </p>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '24px',
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: '#f1f5f9',
    maxWidth: '680px',
    width: '100%',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  headerIcon: { fontSize: '28px' },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerSub: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#64748b',
  },

  // Drop zone
  dropzone: {
    border: '2px dashed #334155',
    borderRadius: '12px',
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#0f172a',
  },
  dropzoneActive: {
    border: '2px dashed #6366f1',
    background: '#1e1b4b',
  },
  dropzoneIcon: { fontSize: '40px', marginBottom: '12px' },
  dropzoneText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#94a3b8',
    margin: '0 0 6px',
  },
  dropzoneOr: {
    fontSize: '12px',
    color: '#475569',
    margin: '0 0 16px',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  uploadBtn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  cameraBtn: {
    background: '#0ea5e9',
  },
  hint: {
    fontSize: '11px',
    color: '#475569',
    margin: 0,
  },

  // Preview
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewFileName: {
    fontSize: '13px',
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60%',
  },
  removeBtn: {
    background: 'transparent',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#94a3b8',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  previewContainer: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #1e293b',
    maxHeight: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1e293b',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
  },
  scanBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 0.2s',
    letterSpacing: '0.3px',
  },
  scanBtnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },

  // Results
  resultsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  successBanner: {
    background: '#052e16',
    border: '1px solid #166534',
    borderRadius: '10px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '14px',
    color: '#86efac',
  },
  successSub: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#4ade80',
    opacity: 0.8,
  },
  rescanBtn: {
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
    background: 'transparent',
    border: '1px solid #166534',
    borderRadius: '6px',
    color: '#4ade80',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  resultLayout: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  thumbImage: {
    width: '120px',
    height: '160px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #1e293b',
    flexShrink: 0,
  },
  resultFields: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '200px',
  },
  categoryChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  categoryIcon: { fontSize: '22px' },
  categoryName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f1f5f9',
  },
  confidenceBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  resultField: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    background: '#1e293b',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  fieldIcon: { fontSize: '16px', marginTop: '2px' },
  fieldLabel: {
    margin: '0 0 2px',
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  fieldValue: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  fieldMissing: {
    color: '#475569',
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: '13px',
  },
  methodBadge: {
    fontSize: '11px',
    color: '#475569',
    fontStyle: 'italic',
  },

  // Warning / Error
  warningBox: {
    background: '#431407',
    border: '1px solid #92400e',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#fbbf24',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1c0a0a',
    border: '1px solid #7f1d1d',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#fca5a5',
    marginTop: '12px',
  },
};
