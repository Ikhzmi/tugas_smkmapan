import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Cpu, 
  Network, 
  ShieldAlert, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Terminal, 
  Monitor, 
  Server, 
  Router, 
  Laptop, 
  Clock, 
  Send, 
  Sparkles, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Download, 
  ShieldCheck,
  Eye,
  Check
} from 'lucide-react';
import { LMS_DAILY_SCHEDULE, CBT_QUESTIONS, SHOWCASE_EPISODES } from '../data/schoolData';
import './LearningEcosystem.css';

export default function LearningEcosystem({ onOpenLms }) {
  const [activePillar, setActivePillar] = useState('network'); // 'network', 'cbt', 'video'

  // ==========================================
  // 1. CLOUD NETWORKING SIMULATOR STATE
  // ==========================================
  const [selectedNode, setSelectedNode] = useState('router');
  const [isPinging, setIsPinging] = useState(false);
  const [cliLogs, setCliLogs] = useState([
    "[SYSTEM READY] MikroTik RouterOS v7.14 & Cisco IOS Sandbox loaded.",
    "[NET-INTERFACE] ether1-WAN: 180.250.12.8/29 UP (Bandwidth: 1 Gbps)",
    "[NET-INTERFACE] ether2-LAB-TKJ: 192.168.10.1/24 UP (DHCP Server Active)",
    "Pilih node atau klik 'Kirim Packet Ping' untuk menguji konektivitas rute."
  ]);

  const networkNodes = {
    router: {
      id: 'router',
      label: 'Core Router Mapan 8',
      type: 'MikroTik CCR2004 / Cisco 2911',
      ip: '192.168.10.1',
      vlan: 'VLAN 10 (Main Trunk)',
      mac: 'E4:8D:8C:91:AA:01',
      status: 'Online (0.2ms)',
      uptime: '48 hari 14 jam',
      role: 'Default Gateway & OSPF Backbone Router'
    },
    switch: {
      id: 'switch',
      label: 'Switch Distribution Lab',
      type: 'Cisco Catalyst 2960-X (24 Port)',
      ip: '192.168.10.2',
      vlan: 'VLAN 10, 20, 30',
      mac: '00:1A:E8:42:3B:77',
      status: 'Online (0.4ms)',
      uptime: '48 hari 12 jam',
      role: 'Spanning Tree Root & Layer 2 Aggregator'
    },
    server: {
      id: 'server',
      label: 'Cloud Server LMS Mapan',
      type: 'Ubuntu Linux 24.04 LTS (Docker Pod)',
      ip: '192.168.10.254',
      vlan: 'VLAN 10 (Datacenter)',
      mac: '52:54:00:12:34:56',
      status: 'Online (0.8ms)',
      uptime: '120 hari',
      role: 'LMS Moodle, CBT Engine & Video Streaming'
    },
    pc1: {
      id: 'pc1',
      label: 'PC Siswa Lab 01',
      type: 'Workstation TKJ Intel Core i7',
      ip: '192.168.10.15',
      vlan: 'VLAN 10 (DHCP Pool)',
      mac: '30:9C:23:71:04:1A',
      status: 'Online (Active)',
      uptime: '3 jam 42 mnt',
      role: 'Siswa Active: Rian Pratama (Kelas XII TKJ)'
    },
    pc2: {
      id: 'pc2',
      label: 'PC Siswa Lab 02',
      type: 'Workstation DKV iMac Retina',
      ip: '192.168.10.16',
      vlan: 'VLAN 10 (DHCP Pool)',
      mac: '30:9C:23:71:04:1B',
      status: 'Online (Active)',
      uptime: '2 jam 15 mnt',
      role: 'Siswa Active: Naila Azzahra (Kelas XI DKV)'
    }
  };

  const handleSendPing = () => {
    if (isPinging) return;
    setIsPinging(true);

    const timestamp = new Date().toLocaleTimeString('id-ID');
    setCliLogs((prev) => [
      ...prev,
      `[${timestamp}] root@mapan-tkj:~# ping -c 4 192.168.10.254 (Cloud Server LMS)`
    ]);

    let step = 1;
    const interval = setInterval(() => {
      if (step === 1) {
        setCliLogs((prev) => [
          ...prev,
          `64 bytes from 192.168.10.254: icmp_seq=1 ttl=64 time=1.12 ms`
        ]);
      } else if (step === 2) {
        setCliLogs((prev) => [
          ...prev,
          `64 bytes from 192.168.10.254: icmp_seq=2 ttl=64 time=0.98 ms`
        ]);
      } else if (step === 3) {
        setCliLogs((prev) => [
          ...prev,
          `64 bytes from 192.168.10.254: icmp_seq=3 ttl=64 time=1.05 ms`
        ]);
      } else if (step === 4) {
        setCliLogs((prev) => [
          ...prev,
          `64 bytes from 192.168.10.254: icmp_seq=4 ttl=64 time=0.91 ms`,
          `--- 192.168.10.254 ping statistics ---`,
          `4 packets transmitted, 4 received, 0% packet loss, rtt min/avg/max = 0.91/1.01/1.12 ms`,
          `[SUCCESS] Jalur komunikasi PC Siswa -> Core Router -> Cloud Server LMS berjalan sempurna!`
        ]);
        setIsPinging(false);
        clearInterval(interval);
      }
      step++;
    }, 600);
  };

  // ==========================================
  // 2. CBT ANTI-CHEAT EXAM STATE
  // ==========================================
  const [currentCbtIdx, setCurrentCbtIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(null);
  const [examTimer, setExamTimer] = useState(25 * 60); // 25 minutes

  useEffect(() => {
    if (examSubmitted) return;
    const timer = setInterval(() => {
      setExamTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [examSubmitted]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (questionId, optionId) => {
    if (examSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitExam = () => {
    let score = 0;
    CBT_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score += 100 / CBT_QUESTIONS.length;
      }
    });
    const finalScore = Math.round(score);
    setExamScore(finalScore);
    setExamSubmitted(true);

    if (finalScore >= 66) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleResetExam = () => {
    setSelectedAnswers({});
    setExamSubmitted(false);
    setExamScore(null);
    setCurrentCbtIdx(0);
    setExamTimer(25 * 60);
  };

  // ==========================================
  // 3. SHOWREEL VIDEO REPOSITORY STATE
  // ==========================================
  const [selectedEpisode, setSelectedEpisode] = useState(SHOWCASE_EPISODES[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const videoProgress = 35;
  const [isMuted, setIsMuted] = useState(false);

  return (
    <section id="lms-ecosystem" className="lms-section reveal-on-scroll">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-badge blue">
            <Sparkles size={14} />
            <span>Inovasi Digital Pendidikan Vokasi 4.0</span>
          </div>
          <h2 className="section-title">
            Mapan <span className="text-orange">Learning Ecosystem</span> (LMS Terpadu)
          </h2>
          <p className="section-subtitle">
            Integrasi platform pembelajaran pintar sekolah vokasi: sinkronisasi jadwal praktikum live, 
            simulasi lab jaringan virtual di browser, serta sistem CBT anti-cheat modern berstandar industri.
          </p>
        </div>

        {/* Live Student Synchronized Status Bar */}
        <div className="live-lms-bar glass-card">
          <div className="bar-col live-schedule-col">
            <div className="bar-tag">
              <span className="status-dot"></span>
              <span className="bar-tag-title">Jadwal Praktikum Aktif Hari Ini</span>
            </div>
            <div className="schedule-meta-row">
              <span className="schedule-major-badge">{LMS_DAILY_SCHEDULE[0].major}</span>
              <span className="schedule-subject-name">{LMS_DAILY_SCHEDULE[0].subject}</span>
            </div>
            <div className="schedule-sub-meta">
              <Clock size={13} className="text-muted" />
              <span>{LMS_DAILY_SCHEDULE[0].time}</span>
              <span className="divider-dot">•</span>
              <span>{LMS_DAILY_SCHEDULE[0].room}</span>
              <span className="divider-dot">•</span>
              <span>{LMS_DAILY_SCHEDULE[0].teacher}</span>
            </div>
          </div>

          <div className="bar-col metrics-col">
            <div className="lms-mini-metric">
              <span className="lms-metric-val text-green">98.5%</span>
              <span className="lms-metric-lbl">Presensi Siswa</span>
            </div>
            <div className="lms-mini-metric">
              <span className="lms-metric-val text-orange">18/18</span>
              <span className="lms-metric-lbl">Modul Tuntas</span>
            </div>
            <div className="lms-mini-metric">
              <span className="lms-metric-val text-blue">BNSP / Cisco</span>
              <span className="lms-metric-lbl">Sertifikasi Siap</span>
            </div>
          </div>

          <div className="bar-col action-col">
            <button 
              onClick={onOpenLms}
              className="btn btn-primary btn-sm btn-full-lms"
              id="btn-open-student-dashboard"
            >
              <Monitor size={16} />
              <span>Buka Dashboard Siswa</span>
            </button>
          </div>
        </div>

        {/* Three Pillar Tab Switcher */}
        <div className="pillar-tabs-container">
          <button 
            className={`pillar-tab ${activePillar === 'network' ? 'active' : ''}`}
            onClick={() => setActivePillar('network')}
            id="tab-network-simulator"
          >
            <div className="tab-icon-box">
              <Network size={20} />
            </div>
            <div className="tab-text-box">
              <span className="tab-title">Cloud Networking Simulator</span>
              <span className="tab-sub">Virtual Lab Cisco & MikroTik</span>
            </div>
            {activePillar === 'network' && <div className="tab-active-indicator" />}
          </button>

          <button 
            className={`pillar-tab ${activePillar === 'cbt' ? 'active' : ''}`}
            onClick={() => setActivePillar('cbt')}
            id="tab-cbt-exam"
          >
            <div className="tab-icon-box">
              <ShieldAlert size={20} />
            </div>
            <div className="tab-text-box">
              <span className="tab-title">CBT Anti-Cheat & Auto-Grade</span>
              <span className="tab-sub">Simulasi Ujian Daring Protektif</span>
            </div>
            {activePillar === 'cbt' && <div className="tab-active-indicator" />}
          </button>

          <button 
            className={`pillar-tab ${activePillar === 'video' ? 'active' : ''}`}
            onClick={() => setActivePillar('video')}
            id="tab-video-repository"
          >
            <div className="tab-icon-box">
              <Play size={20} />
            </div>
            <div className="tab-text-box">
              <span className="tab-title">Repositori Video & Modul</span>
              <span className="tab-sub">Showreel & Materi Studio Mandiri</span>
            </div>
            {activePillar === 'video' && <div className="tab-active-indicator" />}
          </button>
        </div>

        {/* ============================================================ */}
        {/* PILAR 1: CLOUD NETWORKING SIMULATOR */}
        {/* ============================================================ */}
        {activePillar === 'network' && (
          <div className="simulator-card-wrapper fade-in-up">
            <div className="simulator-header-strip">
              <div className="sim-title-group">
                <div className="status-pill live">
                  <span className="status-dot"></span>
                  <span>LIVE TOPOLOGY RUNNING</span>
                </div>
                <h3 className="sim-main-title">Lab Topologi Jaringan Terpadu TKJ</h3>
              </div>
              <div className="sim-actions-group">
                <button 
                  onClick={handleSendPing}
                  disabled={isPinging}
                  className="btn btn-primary btn-sm"
                  id="btn-send-ping"
                >
                  <Send size={15} />
                  <span>{isPinging ? 'Mengirim Packet ICMP...' : 'Kirim Packet Ping / Traceroute'}</span>
                </button>
              </div>
            </div>

            <div className="simulator-workspace-grid">
              {/* Interactive Canvas */}
              <div className="topology-canvas-area">
                <div className="canvas-badge-info">
                  <span>Klik perangkat untuk inspeksi konfigurasi IP & VLAN</span>
                </div>

                <div className="topology-nodes-network">
                  {/* Cloud Internet / Backbone */}
                  <div 
                    className={`net-node-item node-server ${selectedNode === 'server' ? 'selected' : ''}`}
                    onClick={() => setSelectedNode('server')}
                  >
                    <div className="node-icon-circle bg-blue">
                      <Server size={24} />
                      <span className="node-status-led online"></span>
                    </div>
                    <span className="node-label">Cloud Server LMS</span>
                    <span className="node-ip">192.168.10.254</span>
                  </div>

                  {/* Trunk Connecting Line */}
                  <div className="net-wire wire-vertical">
                    {isPinging && <div className="packet-bullet-vertical" />}
                  </div>

                  {/* Core Router */}
                  <div 
                    className={`net-node-item node-router ${selectedNode === 'router' ? 'selected' : ''}`}
                    onClick={() => setSelectedNode('router')}
                  >
                    <div className="node-icon-circle bg-orange">
                      <Router size={26} />
                      <span className="node-status-led online"></span>
                    </div>
                    <span className="node-label">Core Router Mapan 8</span>
                    <span className="node-ip">192.168.10.1 (Gateway)</span>
                  </div>

                  {/* Trunk Line */}
                  <div className="net-wire wire-vertical">
                    {isPinging && <div className="packet-bullet-vertical delay-1" />}
                  </div>

                  {/* Distribution Switch */}
                  <div 
                    className={`net-node-item node-switch ${selectedNode === 'switch' ? 'selected' : ''}`}
                    onClick={() => setSelectedNode('switch')}
                  >
                    <div className="node-icon-circle bg-dark">
                      <Cpu size={24} />
                      <span className="node-status-led online"></span>
                    </div>
                    <span className="node-label">Switch Distribution (24P)</span>
                    <span className="node-ip">192.168.10.2</span>
                  </div>

                  {/* Client PC Branch */}
                  <div className="clients-row">
                    <div className="net-wire wire-horizontal-left">
                      {isPinging && <div className="packet-bullet-horizontal" />}
                    </div>

                    <div 
                      className={`net-node-item node-pc ${selectedNode === 'pc1' ? 'selected' : ''}`}
                      onClick={() => setSelectedNode('pc1')}
                    >
                      <div className="node-icon-circle bg-light">
                        <Monitor size={22} />
                        <span className="node-status-led online"></span>
                      </div>
                      <span className="node-label">PC Siswa Lab 01</span>
                      <span className="node-ip">192.168.10.15</span>
                    </div>

                    <div 
                      className={`net-node-item node-pc ${selectedNode === 'pc2' ? 'selected' : ''}`}
                      onClick={() => setSelectedNode('pc2')}
                    >
                      <div className="node-icon-circle bg-light">
                        <Laptop size={22} />
                        <span className="node-status-led online"></span>
                      </div>
                      <span className="node-label">PC Siswa Lab 02</span>
                      <span className="node-ip">192.168.10.16</span>
                    </div>

                    <div className="net-wire wire-horizontal-right">
                      {isPinging && <div className="packet-bullet-horizontal delay-1" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspector & CLI Terminal Panel */}
              <div className="simulator-side-panel">
                {/* Node Inspector */}
                <div className="node-inspector-box">
                  <div className="inspector-header">
                    <div className="inspector-title">
                      <Cpu size={16} className="text-orange" />
                      <span>Node Inspector: <strong>{networkNodes[selectedNode].label}</strong></span>
                    </div>
                    <span className="inspector-badge">{networkNodes[selectedNode].vlan}</span>
                  </div>

                  <div className="inspector-table">
                    <div className="insp-row">
                      <span className="insp-key">Tipe Perangkat:</span>
                      <span className="insp-val">{networkNodes[selectedNode].type}</span>
                    </div>
                    <div className="insp-row">
                      <span className="insp-key">IP Address:</span>
                      <span className="insp-val text-mono text-orange">{networkNodes[selectedNode].ip}</span>
                    </div>
                    <div className="insp-row">
                      <span className="insp-key">MAC Address:</span>
                      <span className="insp-val text-mono">{networkNodes[selectedNode].mac}</span>
                    </div>
                    <div className="insp-row">
                      <span className="insp-key">Status Link:</span>
                      <span className="insp-val text-green font-bold">{networkNodes[selectedNode].status}</span>
                    </div>
                    <div className="insp-row">
                      <span className="insp-key">Peran Topologi:</span>
                      <span className="insp-val">{networkNodes[selectedNode].role}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated CLI Terminal */}
                <div className="cli-terminal-box">
                  <div className="cli-terminal-bar">
                    <div className="cli-dots">
                      <span className="cli-dot red"></span>
                      <span className="cli-dot yellow"></span>
                      <span className="cli-dot green"></span>
                    </div>
                    <span className="cli-title">mapan-terminal@lab-tkj: ~ (bash)</span>
                    <Terminal size={14} className="text-muted" />
                  </div>
                  <div className="cli-terminal-body">
                    {cliLogs.map((log, index) => (
                      <div key={index} className="cli-log-line">
                        {log}
                      </div>
                    ))}
                    {isPinging && (
                      <div className="cli-log-line text-orange blink">
                        [TRANSMITTING] Mengirim ICMP Echo Request ke 192.168.10.254 ...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PILAR 2: CBT ANTI-CHEAT & AUTO-GRADE */}
        {/* ============================================================ */}
        {activePillar === 'cbt' && (
          <div className="cbt-card-wrapper fade-in-up">
            {/* Exam Top Banner / Proctor Bar */}
            <div className="cbt-proctor-bar">
              <div className="proctor-left">
                <div className="proctor-badge anti-cheat">
                  <ShieldCheck size={16} className="text-green" />
                  <span>Proteksi Fullscreen & AI Anti-Cheat Aktif</span>
                </div>
                <div className="proctor-badge webcam">
                  <Eye size={16} className="text-blue" />
                  <span>Proctoring Monitoring: Wajah Terverifikasi</span>
                </div>
              </div>

              <div className="proctor-right">
                <div className="timer-badge">
                  <Clock size={16} />
                  <span>Sisa Waktu: <strong>{formatTimer(examTimer)}</strong></span>
                </div>
              </div>
            </div>

            {/* Exam Content Area */}
            {!examSubmitted ? (
              <div className="cbt-content-grid">
                {/* Question Area */}
                <div className="cbt-question-pane">
                  <div className="question-header">
                    <div className="question-number-badge">
                      Soal No. {currentCbtIdx + 1} dari {CBT_QUESTIONS.length}
                    </div>
                    <span className="question-category-tag">
                      {CBT_QUESTIONS[currentCbtIdx].category}
                    </span>
                  </div>

                  <p className="question-text">
                    {CBT_QUESTIONS[currentCbtIdx].question}
                  </p>

                  <div className="options-list">
                    {CBT_QUESTIONS[currentCbtIdx].options.map((opt) => {
                      const isSelected = selectedAnswers[CBT_QUESTIONS[currentCbtIdx].id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          className={`option-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectAnswer(CBT_QUESTIONS[currentCbtIdx].id, opt.id)}
                        >
                          <span className="option-letter">{opt.id}</span>
                          <span className="option-text">{opt.text}</span>
                          {isSelected && <Check size={18} className="option-check-icon" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="cbt-nav-buttons">
                    <button 
                      className="btn btn-outline btn-sm"
                      disabled={currentCbtIdx === 0}
                      onClick={() => setCurrentCbtIdx((prev) => prev - 1)}
                    >
                      &larr; Soal Sebelumnya
                    </button>

                    {currentCbtIdx < CBT_QUESTIONS.length - 1 ? (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCurrentCbtIdx((prev) => prev + 1)}
                      >
                        Soal Berikutnya &rarr;
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmitExam}
                        id="btn-submit-cbt"
                      >
                        <CheckCircle2 size={16} />
                        <span>Kirim Ujian & Periksa Nilai</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Map Sidebar */}
                <div className="cbt-map-sidebar">
                  <h4 className="sidebar-title">Daftar Nomor Soal</h4>
                  <div className="question-numbers-grid">
                    {CBT_QUESTIONS.map((q, idx) => {
                      const isAnswered = !!selectedAnswers[q.id];
                      const isCurrent = currentCbtIdx === idx;
                      return (
                        <button
                          key={q.id}
                          className={`num-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
                          onClick={() => setCurrentCbtIdx(idx)}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="cbt-legend">
                    <div className="legend-item">
                      <span className="legend-box answered"></span>
                      <span>Sudah Dijawab</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-box current"></span>
                      <span>Soal Aktif</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-box"></span>
                      <span>Belum Dijawab</span>
                    </div>
                  </div>

                  <div className="submit-box-wrapper">
                    <button 
                      onClick={handleSubmitExam}
                      className="btn btn-primary btn-block"
                      id="btn-finish-exam-sidebar"
                    >
                      <CheckCircle2 size={16} />
                      <span>Selesai & Auto-Grade</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Exam Result Panel */
              <div className="cbt-result-panel">
                <div className="result-card">
                  <div className="result-score-circle">
                    <span className="score-number">{examScore}</span>
                    <span className="score-max">/ 100</span>
                  </div>

                  <h3 className="result-title">
                    {examScore >= 70 ? 'Selamat! Anda Dinyatakan Lulus Kompetensi' : 'Terus Semangat Belajar & Latihan!'}
                  </h3>
                  <p className="result-desc">
                    Hasil auto-grade instan Mapan CBT Engine v2.0 telah tersinkronisasi ke buku nilai digital.
                  </p>

                  <div className="answers-review-list">
                    {CBT_QUESTIONS.map((q, idx) => {
                      const userAns = selectedAnswers[q.id];
                      const isCorrect = userAns === q.correctAnswer;
                      return (
                        <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                          <div className="review-header">
                            <span className="review-num">Soal #{idx + 1} ({q.category})</span>
                            <span className={`review-badge ${isCorrect ? 'text-green' : 'text-rose'}`}>
                              {isCorrect ? 'Jawaban Benar (+33.3)' : 'Jawaban Kurang Tepat'}
                            </span>
                          </div>
                          <p className="review-question">{q.question}</p>
                          <div className="review-details">
                            <p>Jawaban Anda: <strong>Opsi {userAns || 'Tidak Diisi'}</strong></p>
                            <p>Kunci Jawaban: <strong className="text-green">Opsi {q.correctAnswer}</strong></p>
                            <p className="explanation-text"><strong>Pembahasan:</strong> {q.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="result-actions">
                    <button onClick={handleResetExam} className="btn btn-outline">
                      <RotateCcw size={16} />
                      <span>Coba Simulasi Ujian Lagi</span>
                    </button>
                    <button onClick={onOpenLms} className="btn btn-primary">
                      <Monitor size={16} />
                      <span>Masuk ke LMS Siswa Lengkap</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PILAR 3: REPOSITORI VIDEO & MODUL INTERAKTIF */}
        {/* ============================================================ */}
        {activePillar === 'video' && (
          <div className="video-card-wrapper fade-in-up">
            <div className="video-player-grid">
              {/* Main Player Area */}
              <div className="player-main-area">
                <div className="simulated-video-screen">
                  <img 
                    src={selectedEpisode.image} 
                    alt={selectedEpisode.title} 
                    className="video-poster-img"
                  />
                  <div className="video-screen-overlay"></div>

                  {/* Center Play Button Overlay */}
                  <button 
                    className="center-play-button"
                    onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                    aria-label="Play or Pause Showreel"
                  >
                    {isPlayingVideo ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
                  </button>

                  {/* Top Video Header */}
                  <div className="video-top-meta">
                    <span className="ep-badge">{selectedEpisode.epNumber}</span>
                    <span className="ep-title-top">{selectedEpisode.title}</span>
                  </div>

                  {/* Bottom Controls Bar */}
                  <div className="video-controls-bar">
                    <div className="timeline-scrubber">
                      <div className="timeline-track" style={{ width: `${videoProgress}%` }}>
                        <div className="timeline-handle"></div>
                      </div>
                    </div>

                    <div className="controls-row">
                      <div className="controls-left">
                        <button 
                          className="ctrl-btn" 
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                        >
                          {isPlayingVideo ? <Pause size={18} /> : <Play size={18} />}
                        </button>

                        <button 
                          className="ctrl-btn" 
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>

                        <span className="time-display">01:45 / {selectedEpisode.duration}</span>
                      </div>

                      <div className="controls-right">
                        {/* Speed Toggle */}
                        <div className="speed-pills">
                          {[1, 1.25, 1.5].map((spd) => (
                            <button
                              key={spd}
                              className={`speed-pill ${playbackSpeed === spd ? 'active' : ''}`}
                              onClick={() => setPlaybackSpeed(spd)}
                            >
                              {spd}x
                            </button>
                          ))}
                        </div>

                        <button className="ctrl-btn" title="Fullscreen">
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info Card Underneath */}
                <div className="video-info-box">
                  <div className="video-info-main">
                    <div className="ep-tag-row">
                      <span className="ep-code">{selectedEpisode.epNumber}</span>
                      <span className="creator-tag">Karya: {selectedEpisode.creator}</span>
                      <span className="duration-tag"><Clock size={13} /> {selectedEpisode.duration}</span>
                    </div>
                    <h3 className="video-full-title">{selectedEpisode.title}</h3>
                    <p className="video-summary">{selectedEpisode.description}</p>
                  </div>

                  <div className="software-badges-row">
                    <span className="soft-label">Tools & Software:</span>
                    {selectedEpisode.software.map((tool) => (
                      <span key={tool} className="tool-chip">{tool}</span>
                    ))}
                  </div>

                  <div className="handout-download-row">
                    <button 
                      onClick={() => alert(`Mengunduh Modul Praktikum & Lembar Kerja: ${selectedEpisode.title} (PDF)`)}
                      className="btn btn-outline btn-sm"
                    >
                      <Download size={15} />
                      <span>Unduh Modul Pembelajaran (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Playlist Sidebar */}
              <div className="playlist-sidebar">
                <div className="playlist-header">
                  <h4 className="playlist-title">Daftar Episode Showreel</h4>
                  <span className="playlist-count">{SHOWCASE_EPISODES.length} Video Praktikum</span>
                </div>

                <div className="playlist-items-list">
                  {SHOWCASE_EPISODES.map((ep) => {
                    const isSelected = selectedEpisode.id === ep.id;
                    return (
                      <div 
                        key={ep.id}
                        className={`playlist-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedEpisode(ep);
                          setIsPlayingVideo(true);
                        }}
                      >
                        <div className="playlist-thumb">
                          <img src={ep.image} alt={ep.title} />
                          <span className="thumb-duration">{ep.duration}</span>
                          {isSelected && <span className="now-playing-badge">PLAYING</span>}
                        </div>
                        <div className="playlist-meta">
                          <span className="playlist-ep-num">{ep.epNumber}</span>
                          <h5 className="playlist-item-title">{ep.title}</h5>
                          <span className="playlist-creator">{ep.creator}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
