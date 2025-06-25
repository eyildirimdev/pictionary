import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io(
  (import.meta as any).env.VITE_SERVER_URL || 'http://localhost:4000'
);

type Point = { x: number; y: number };

export default function App() {
  /* ------------------------------------------------ state / refs ---- */
  const [roomId]  = useState('lobby');
  const [word , setWord ] = useState('');
  const [guess, setGuess] = useState('');
  const [tick , setTick ] = useState(0);               // forces <svg> refresh

  /* mutable drawing buffers (avoid re-render spam) */
  const pathsRef   = useRef<string[]>([]);
  const lastRef    = useRef<Point|null>(null);
  const drawingRef = useRef(false);

  const canvasRef  = useRef<HTMLDivElement>(null);
  const titleRef   = useRef<HTMLDivElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);

  /* ------------------------------------------------ sockets --------- */
  useEffect(() => {
    socket.emit('joinRoom', { roomId });

    /** draw any stroke coming over the wire */
    const handleStroke = (raw: any) => {
      console.log('[RAW] stroke:', raw);
      const { x0,y0,x1,y1,w,h } = raw;
      if (![x0,y0,x1,y1].every(n=>typeof n==='number' && !isNaN(n))) {
        console.warn('[WEB] bad coords, skip'); return;
      }

      const box = canvasRef.current?.getBoundingClientRect();
      if (!box) return;

      /* pick scale factors */
      const sx = box.width  / (w ?? box.width);
      const sy = box.height / (h ?? box.height);

      const d  = `M${x0*sx} ${y0*sy} L${x1*sx} ${y1*sy}`;
      console.log('[WEB] drawing path:', d);
      pathsRef.current.push(d);
      setTick(t=>t+1);
    };

    socket.on('stroke', handleStroke);
    socket.on('clear', ()   => { pathsRef.current=[]; setTick(t=>t+1); });
    socket.on('word',  setWord);
    socket.on('correctGuess', (t:string)=>alert(`🎉 Correct! «${t}»`));

    return () => socket.off('stroke', handleStroke);
  }, [roomId]);

  /* ------------------------------------------------ helpers --------- */
  const emitStroke = (p0:Point,p1:Point) => {
    const box = canvasRef.current!.getBoundingClientRect();
    const payload = {
      roomId,
      x0:p0.x/box.width, y0:p0.y/box.height,
      x1:p1.x/box.width, y1:p1.y/box.height,
      w: box.width, h: box.height,
    };
    console.log('[WEB] emit stroke:', payload);
    socket.emit('stroke', payload);
  };

  const local = (e:React.MouseEvent):Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x:e.clientX-r.left, y:e.clientY-r.top };
  };

  /* ------------------------------------------------ mouse ----------- */
  const down = (e:React.MouseEvent) => {
    drawingRef.current = true;
    const p = local(e);
    lastRef .current = p;

    // visual feedback
    canvasRef.current!.style.transform = 'scale(1.02)';
    titleRef .current!.style.transform = 'scale(0.97)';

    // dot
    pathsRef.current.push(`M${p.x} ${p.y} L${p.x} ${p.y}`);
    emitStroke(p,p);
    setTick(t=>t+1);
  };

  const move = (e:React.MouseEvent) => {
    if (!drawingRef.current || !lastRef.current) return;
    const p0 = lastRef.current, p1 = local(e);

    pathsRef.current.push(`M${p0.x} ${p0.y} L${p1.x} ${p1.y}`);
    emitStroke(p0,p1);
    lastRef.current = p1;
    setTick(t=>t+1);
  };

  const up   = () => {
    drawingRef.current = false; lastRef.current = null;
    canvasRef.current!.style.transform = 'scale(1)';
    titleRef .current!.style.transform = 'scale(1)';
  };

  /* ------------------------------------------------ jsx ------------- */
  const svgPaths = pathsRef.current.map((d,i)=>(
    <path key={i} d={d} stroke="url(#grad)" strokeWidth="3"
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden relative">

      {/* animated bg pulse */}
      <div className="absolute inset-0 animate-pulse opacity-75
                      bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />

      {/* floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_,i)=>(
          <div key={i}
               className="absolute w-1 h-1 bg-[#667eea] rounded-full opacity-60 animate-bounce"
               style={{
                 left : `${15+i*12}%`,
                 top  : '20%',
                 animationDelay   : `${i*0.5}s`,
                 animationDuration: '3s',
               }}/>
        ))}
      </div>

      <main className="relative z-10 flex flex-col items-center px-5 pt-16 pb-8 gap-8">

        {/* title */}
        <div ref={titleRef}
             onClick={()=>{
               titleRef.current!.style.transform='scale(0.95)';
               setTimeout(()=>titleRef.current!.style.transform='scale(1)',150);
             }}
             className="transition-transform duration-100 text-center cursor-pointer">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg"
              style={{textShadow:'0 0 10px rgba(102,126,234,.5)'}}>🎨 Pictionary</h1>
          <p className="text-base text-gray-400 font-medium mt-1">Draw & Guess</p>
        </div>

        {/* word card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-[#667eea]/30 shadow-lg animate-pulse">
          <p className="text-xs text-gray-400 text-center font-semibold uppercase tracking-wider">Your Word</p>
          <p className="text-xl font-bold text-white text-center mt-1">{word || '🎯 Waiting…'}</p>
        </div>

        {/* canvas */}
        <div ref={canvasRef}
             className="w-full max-w-2xl h-96 mb-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#667eea]/40 bg-white/95
                        transition-transform duration-150"
             onMouseDown={down} onMouseMove={move}
             onMouseUp={up} onMouseLeave={up}>
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#667eea"/>
                <stop offset="100%" stopColor="#764ba2"/>
              </linearGradient>
            </defs>
            {svgPaths}
          </svg>
          <div className="absolute top-4 right-4 bg-black/10 rounded-xl px-3 py-1.5 text-xs text-gray-600">✏️ draw here</div>
        </div>

        {/* input row */}
        <div className="w-full max-w-md flex bg-white/10 backdrop-blur-md rounded-full border border-[#667eea]/30 overflow-hidden shadow-lg">
          <input
            placeholder="💭 enter your guess…" value={guess}
            onChange={e=>setGuess(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'){ socket.emit('guess',{roomId,text:guess}); setGuess(''); } }}
            className="flex-1 px-5 py-4 text-white placeholder-gray-400 bg-transparent outline-none font-medium"/>
          <button
            onClick={()=>{ socket.emit('guess',{roomId,text:guess}); setGuess(''); }}
            className="bg-[#667eea]/80 px-5 py-4 hover:bg-[#667eea] transition-colors">
            🚀
          </button>
        </div>

        {/* clear */}
        <button ref={btnRef}
                onClick={()=>{
                  btnRef.current!.style.transform='scale(0.9)';
                  setTimeout(()=>btnRef.current!.style.transform='scale(1)',100);
                  pathsRef.current=[]; socket.emit('clear',{roomId}); setTick(t=>t+1);
                }}
                className="w-full max-w-md bg-red-500/20 border-2 border-red-500/50 rounded-2xl py-4 text-red-400 font-bold shadow-lg hover:bg-red-500/30 transition-all">
          🗑️ Clear Canvas
        </button>
      </main>
    </div>
  );
}