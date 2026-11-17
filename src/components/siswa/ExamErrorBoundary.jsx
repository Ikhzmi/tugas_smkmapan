import React from 'react';

// Tanpa boundary, satu TypeError di runner meng-unmount seluruh pohon React
// dan siswa terjebak di layar putih dengan attempt masih berjalan di server.
export default class ExamErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('ExamRunner gagal dimuat:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          position: 'fixed', inset: 0, zIndex: 1200, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: 'rgba(12,23,38,.72)',
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 420, background: '#fff', color: '#0c1726', borderRadius: 12,
            padding: '28px 26px', textAlign: 'center', boxShadow: '0 18px 50px rgba(0,0,0,.35)',
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Lembar ujian gagal dimuat</h3>
          <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.55, color: '#5b6472' }}>
            Terjadi kesalahan saat menampilkan soal. Progress Anda tetap tersimpan di server —
            coba muat ulang, atau tutup dan hubungi guru bila masalah berlanjut.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              style={{
                border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 700,
                background: '#FE4000', color: '#fff', cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={this.props.onClose}
              style={{
                border: '1px solid #e5e4e7', borderRadius: 8, padding: '10px 18px',
                fontWeight: 700, background: '#fff', color: '#0c1726', cursor: 'pointer',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }
}