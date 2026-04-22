/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Trophy, Copy, Info, RefreshCw, X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRIZES, WHEEL_SEGMENTS, COOLDOWN_SECONDS, MIN_TURNS, SPIN_DURATION } from './constants';
import { Prize } from './types';

export default function App() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [result, setResult] = useState<{ prize: Prize; coupon: string } | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  
  const controls = useAnimation();

  // Cooldown logic
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const generateCoupon = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KINGCEL-${code}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.length <= 16) {
      setPhone(formatted);
      if (error) setError('');
    }
  };

  const handleSpin = async () => {
    if (isSpinning || cooldown > 0) return;

    if (!phone || phone.length < 10) {
      setError('Por favor, insira um número de telefone válido.');
      return;
    }

    // Check if this number has already spun (using localStorage for this demo)
    const alreadySpun = localStorage.getItem(`aure_spin_${phone.replace(/\D/g, '')}`);
    if (alreadySpun && !isDemoMode) {
      setError('Este número já realizou um giro.');
      return;
    }

    setError('');
    setIsSpinning(true);
    setResult(null);

    // 1. Weighted Selection
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let selectedPrize: Prize | null = null;

    for (const prize of PRIZES) {
      randomWeight -= prize.weight;
      if (randomWeight <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    if (!selectedPrize) selectedPrize = PRIZES[0];

    // 2. Find a physical segment for this prize
    const matchingIndices: number[] = [];
    WHEEL_SEGMENTS.forEach((s, idx) => {
      if (s.id === selectedPrize!.id) matchingIndices.push(idx);
    });
    const selectedSegmentIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];

    // 3. Calculate Rotation
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    // We want the pointer (at top, 0deg) to point at segment i.
    // Segment i starts at i*45 and ends at (i+1)*45.
    // Center of segment i is (i+0.5)*45.
    // If we rotate wheel by R, the pointer points at (360 - (R%360)) in wheel space.
    // We want 360 - (R%360) = (i+0.5)*45
    // R%360 = 360 - (i+0.5)*45
    
    const targetInsideAngle = 360 - (selectedSegmentIndex * segmentAngle) - (segmentAngle / 2);
    const newRotation = currentRotation + (MIN_TURNS * 360) + (targetInsideAngle - (currentRotation % 360));
    
    await controls.start({
      rotate: newRotation,
      transition: {
        duration: SPIN_DURATION / 1000,
        ease: [0.15, 0, 0.1, 1], // Strong "stopping" feel
      },
    });

    setCurrentRotation(newRotation);
    setIsSpinning(false);
    setCooldown(COOLDOWN_SECONDS);

    const coupon = generateCoupon();
    setResult({ prize: selectedPrize, coupon });
    setShowResultModal(true);

    // Save spin to localStorage only if it was a win
    if (selectedPrize.isWin) {
      localStorage.setItem(`aure_spin_${phone.replace(/\D/g, '')}`, JSON.stringify({
        prize: selectedPrize.label,
        coupon,
        date: new Date().toISOString()
      }));
    }

    if (selectedPrize.isWin) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e1662f', '#fb9a08', '#FFFFFF'],
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const sendToWhatsApp = (prize: string, coupon: string) => {
    const storeNumber = '553330224464';
    const message = encodeURIComponent(`Olá! Acabei de ganhar na Roleta Premiada da KING CEL!\n\n🎁 Prêmio: ${prize}\n🎟️ Cupom: ${coupon}\n📱 Telefone: ${phone}`);
    window.open(`https://wa.me/${storeNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#250917] flex flex-col font-sans overflow-x-hidden relative">
      {/* Top Branding Bar */}
      <div className="h-2 bg-gradient-to-r from-brand-dark via-brand-primary to-brand-accent w-full sticky top-0 z-[60]" />

      {/* Header */}
      <header className="h-24 px-6 md:px-10 flex justify-between items-center z-50 sticky top-2 bg-[#250917]/80 backdrop-blur-md border-b border-white/5 w-full shadow-sm">
        <div className="logo flex items-center gap-4">
          <div className="logo-icon w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-brand-dark font-black text-2xl transform rotate-3">K</div>
          <div className="flex flex-col">
            <span className="brand-name font-black text-2xl tracking-tighter text-white leading-none">KING CEL</span>
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.2em] mt-1">Conectando Você</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Status</span>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-white/60">SISTEMA ONLINE</span>
                </div>
            </div>
            <button 
              onClick={() => setShowRules(true)}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all shadow-sm"
            >
              <Info size={20} />
            </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-24 items-center z-10">
        {/* Left Column: Wheel Display */}
        <div className="wheel-container relative flex justify-center items-center">
            {/* Ambient Background for Wheel */}
            <div className="absolute w-[110%] aspect-square bg-brand-dark/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute w-[80%] aspect-square border border-brand-dark/10 rounded-full -z-10 scale-110" />
            <div className="absolute w-[60%] aspect-square border border-brand-dark/5 rounded-full -z-10 scale-125" />
            
            <div className="relative p-2 sm:p-4 rounded-full bg-white shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
                <div className="p-4 sm:p-6 rounded-full bg-[#1a0610] shadow-inner relative overflow-hidden">
                    {/* Pointer (Premium Style) */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-40">
                        <div className="w-12 h-14 bg-white shadow-2xl relative" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-dark animate-pulse" />
                        </div>
                    </div>
                    
                    <motion.div
                        animate={controls}
                        initial={{ rotate: 0 }}
                        style={{ rotate: currentRotation }}
                        className="relative z-10 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px]"
                    >
                        <RoletaCanvas />
                    </motion.div>
                    
                    {/* Hub (Premium Style) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full border-[6px] border-brand-dark z-20 flex items-center justify-center shadow-2xl">
                         <div className="text-brand-dark transform scale-125">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 5 2"/><path d="m5 5 2 1"/><path d="m2 2 2 5"/><path d="m5 5 1 2"/></svg>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Interaction Panel */}
        <div className="control-panel flex flex-col gap-8">
            <div className="bg-white/5 backdrop-blur-xl p-10 md:p-14 rounded-[48px] shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex flex-col border border-white/10 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="mb-12 relative z-10 text-center lg:text-left">
                    <h2 className="text-4xl md:text-5xl font-display font-black mb-6 leading-tight tracking-tight text-white">
                        Sua sorte na <span className="text-brand-accent">KING CEL</span> começou!
                    </h2>
                    <p className="text-white/60 font-medium text-lg leading-relaxed">
                        Ganhe descontos exclusivos agora. Digite seu WhatsApp abaixo.
                    </p>
                </div>
                
                <div className="w-full mb-10 relative z-10">
                    <label className="block text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-4 px-1 text-center">Seu WhatsApp</label>
                    <div className="relative">
                        <input 
                          type="tel" 
                          placeholder="(00) 0 0000-0000"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="w-full bg-white/10 border-2 border-white/20 rounded-[32px] p-6 text-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-brand-accent focus:bg-white/20 transition-all font-mono font-bold text-center shadow-lg"
                        />
                    </div>
                    {error && (
                        <motion.p 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="bg-red-500/20 text-red-200 text-xs font-bold mt-4 p-3 rounded-2xl border border-red-500/30 text-center"
                        >
                            {error}
                        </motion.p>
                    )}
                </div>

                <div className="flex flex-col gap-5 relative z-10">
                    <button
                        onClick={handleSpin}
                        disabled={isSpinning || cooldown > 0}
                        className={`
                            relative overflow-hidden group w-full py-7 rounded-[32px] font-black text-2xl tracking-[0.15em] transition-all duration-300 transform active:scale-95 shadow-2xl
                            ${(isSpinning || cooldown > 0) 
                                ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                                : 'bg-brand-accent text-brand-dark hover:brightness-110 hover:-translate-y-1'}
                        `}
                    >
                        {isSpinning ? (
                            <RefreshCw className="animate-spin mx-auto" size={32} />
                        ) : cooldown > 0 ? (
                            `AGUARDE ${cooldown}S`
                        ) : (
                            'QUERO MEU PRÊMIO!'
                        )}
                    </button>

                    <button
                        onClick={() => setShowRules(true)}
                        className="w-full py-5 text-white/50 font-bold text-sm hover:text-white transition-all uppercase tracking-[0.3em]"
                    >
                        Ver Regulamento
                    </button>
                </div>
            </div>

            {/* Demo Panel */}
                <div className="flex items-center justify-between mb-2 px-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-brand-accent animate-pulse' : 'bg-white/10'}`} />
                        <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Painel Demo</span>
                    </div>
                    <button 
                        onClick={() => setIsDemoMode(!isDemoMode)}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${isDemoMode ? 'bg-brand-accent' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isDemoMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

            <AnimatePresence>
                {isDemoMode && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {PRIZES.slice(0, 4).map(p => (
                                <div key={p.id} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-sm flex flex-col items-center text-center">
                                    <span className="text-[10px] text-white/30 block mb-2 uppercase font-black tracking-widest truncate w-full">{p.label}</span>
                                    <span className="text-lg font-black text-brand-accent">{p.weight}%</span>
                                    <span className="text-[8px] text-white/20 uppercase font-bold mt-1">Sorteio</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}`} alt="QR" className="w-10 h-10" />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight">Escaneie para testar no mobile e ver a experiência real de gamificação.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>

      {/* Status Badge */}
      <div className="fixed bottom-10 right-10 hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-xl shadow-xl px-4 py-2.5 rounded-2xl border border-white/10 z-30">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Sistema Operacional</span>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && result && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowResultModal(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative w-full max-w-[440px] bg-white rounded-[40px] p-12 text-center shadow-2xl"
                >
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full -z-10" />

                    <button 
                        onClick={() => setShowResultModal(false)}
                        className="absolute top-10 right-10 p-2 rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"
                    >
                        <X size={24} />
                    </button>

                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`
                            w-24 h-24 mx-auto rounded-[32px] flex items-center justify-center mb-10
                            ${result.prize.isWin ? 'bg-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-slate-100'} 
                        `}
                    >
                        {result.prize.isWin ? <Trophy size={48} className="text-white" /> : <X size={48} className="text-slate-400" />}
                    </motion.div>

                    <h2 className="font-display font-black text-4xl mb-4 text-slate-900">
                        {result.prize.isWin ? 'Parabéns! 🎉' : 'Quase lá!'}
                    </h2>
                    <p className="text-slate-500 text-base mb-10 px-4">
                        {result.prize.isWin 
                            ? `Você ganhou um ${result.prize.label}!` 
                            : 'Infelizmente você não ganhou desta vez. Tente novamente em breve!'
                        }
                    </p>

                    {result.prize.isWin && (
                        <div className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-dashed border-brand-primary mb-10 relative">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">CUPOM GERADO</span>
                            <div className="font-mono font-bold text-3xl tracking-[0.1em] text-brand-primary mb-6 tabular-nums">
                                {result.coupon}
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => copyToClipboard(result.coupon)}
                                    className={`
                                        w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300
                                        ${copyFeedback ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    {copyFeedback ? 'Copiado!' : 'Copiar Cupom'}
                                </button>

                                <button
                                    onClick={() => sendToWhatsApp(result.prize.label, result.coupon)}
                                    className="w-full py-4 rounded-xl bg-brand-primary text-white font-bold uppercase tracking-widest text-sm hover:bg-brand-primary/90 transition-all shadow-[0_10px_20px_rgba(109,40,217,0.3)]"
                                >
                                    Resgatar no WhatsApp
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowResultModal(false)}
                        className="w-full py-2 text-slate-400 hover:text-brand-primary font-bold text-xs uppercase tracking-widest transition-colors mt-4"
                    >
                        Fechar
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowRules(false)}
                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="relative w-full max-w-md bg-white rounded-[40px] p-10 md:p-12 shadow-2xl"
                >
                    <button 
                        onClick={() => setShowRules(false)}
                        className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-900 transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                             <Info size={24} />
                        </div>
                        <h2 className="font-display font-bold text-3xl text-slate-900">Regras</h2>
                    </div>
                    
                    <div className="space-y-6 text-slate-500 text-sm leading-relaxed">
                        <p>Esta plataforma é uma <span className="text-slate-900 font-bold italic">Demonstração Técnica</span> de gamificação criada pela <span className="text-brand-primary font-bold">KING CEL</span>.</p>
                        
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 shadow-lg shadow-brand-primary/20" />
                                <p>Os <span className="text-slate-900 font-medium">cupons KINGCEL</span> gerados aqui são apenas para fins ilustrativos e não possuem valor real de desconto comercial.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 shadow-lg shadow-brand-primary/20" />
                                <p>A dinâmica de sorteio utiliza <span className="text-slate-900 font-medium">probabilidade ponderada</span>. Se cair em "Tente Novamente", você ganha uma nova chance imediata.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 shadow-lg shadow-brand-primary/20" />
                                <p>Nenhum dado pessoal é capturado ou armazenado durante a utilização desta demonstração.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 shadow-lg shadow-brand-primary/20" />
                                <p>Para implementar uma solução completa de gamificação no seu negócio, entre em contato com nosso time.</p>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setShowRules(false)}
                        className="mt-12 w-full bg-brand-primary text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-100"
                    >
                        ENTENDI
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const RoletaCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const center = size / 2;
        const radius = center - 10;
        const segmentAngle = (2 * Math.PI) / WHEEL_SEGMENTS.length;

        ctx.clearRect(0, 0, size, size);

        // Shadow under wheel
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center + 5, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        ctx.restore();

        WHEEL_SEGMENTS.forEach((segment, i) => {
            const startAngle = i * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            // Border between segments (More subtle)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text logic
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + segmentAngle / 2);
            
            // Text Shadow for visibility
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            // Large '?' with extra shadow for depth and resized visibility
            ctx.font = '900 140px "Outfit", sans-serif'; 
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 15;
            
            // Privacy: Show large '?' to hide prize and build expectation
            ctx.fillText('?', radius - 160, 50);
            
            ctx.restore();
        });

        // Center hub mask or outer ring
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={1000}
            height={1000}
            className="w-full h-full rounded-full shadow-[0_0_100px_rgba(0,0,0,0.5)]"
        />
    );
};
