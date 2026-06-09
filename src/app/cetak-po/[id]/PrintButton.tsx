'use client'

export default function PrintButton() {
  return (
    <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px' }}>
      <button 
        onClick={() => window.print()} 
        style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}
      >
        Cetak Dokumen
      </button>
    </div>
  )
}
