import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io((import.meta as any).env.VITE_SERVER_URL || 'http://localhost:4000');

export default function App() {
  const [roomId] = useState('lobby');
  const [word, setWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [paths, setPaths] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);
  
  // Animation refs
  const titleRef = useRef<HTMLDivElement>(null);
  const canvasRef2 = useRef<HTMLDivElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    socket.emit('joinRoom', { roomId });

    socket.on('stroke', ({ x0, y0, x1, y1 }) => {
      // Validate coordinates before processing
      if (typeof x0 === 'number' && typeof y0 === 'number' && 
          typeof x1 === 'number' && typeof y1 === 'number' &&
          !isNaN(x0) && !isNaN(y0) && !isNaN(x1) && !isNaN(y1)) {
        
        // Scale coordinates from mobile to web canvas dimensions
        const mobileCanvasWidth = 375 - 40; // Approximate mobile screen width minus padding
        const mobileCanvasHeight = 812 * 0.4; // Approximate mobile screen height * 0.4
        const webCanvasWidth = 672; // max-w-2xl approximate width
        const webCanvasHeight = 384; // h-96 height
        
        const scaleX = webCanvasWidth / mobileCanvasWidth;
        const scaleY = webCanvasHeight / mobileCanvasHeight;
        
        const scaledX0 = x0 * scaleX;
        const scaledY0 = y0 * scaleY;
        const scaledX1 = x1 * scaleX;
        const scaledY1 = y1 * scaleY;
        
        const d = `M${scaledX0} ${scaledY0} L${scaledX1} ${scaledY1}`;
        setPaths((p) => [...p, d]);
      }
    });
    socket.on('clear', () => setPaths([]));
    socket.on('word', setWord);
    socket.on('correctGuess', (t: string) => {
      alert(`🎉 Correct! "${t}"`);
    });

    return () => {
      socket.off('stroke');
      socket.off('clear');
      socket.off('word');
      socket.off('correctGuess');
    };
  }, [roomId]);

  const handleTitlePress = () => {
    if (titleRef.current) {
      titleRef.current.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
  };

  const handleClearPress = () => {
    if (clearButtonRef.current) {
      clearButtonRef.current.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (clearButtonRef.current) {
          clearButtonRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
    
    setPaths([]);
    socket.emit('clear', { roomId });
  };

  const handleGuessSubmit = () => {
    if (inputValue.trim()) {
      socket.emit('guess', { roomId, text: inputValue.trim() });
      setInputValue('');
    }
  };

  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef2.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Ensure coordinates are valid numbers and within bounds
    return {
      x: Math.max(0, Math.min(rect.width, isNaN(x) ? 0 : x)),
      y: Math.max(0, Math.min(rect.height, isNaN(y) ? 0 : y))
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    setLastPos(pos);
    setCurrentPath(`M${pos.x} ${pos.y}`);
    
    if (canvasRef2.current) {
      canvasRef2.current.style.transform = 'scale(1.02)';
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !lastPos) return;
    
    const pos = getMousePos(e);
    const newPath = `${currentPath} L${pos.x} ${pos.y}`;
    setCurrentPath(newPath);
    
    // Send stroke data in real-time
    if (!isNaN(lastPos.x) && !isNaN(lastPos.y) && !isNaN(pos.x) && !isNaN(pos.y)) {
      socket.emit('stroke', { roomId, x0: lastPos.x, y0: lastPos.y, x1: pos.x, y1: pos.y });
      // Also add to local paths for immediate display
      const strokePath = `M${lastPos.x} ${lastPos.y} L${pos.x} ${pos.y}`;
      setPaths(prev => [...prev, strokePath]);
    }
    
    setLastPos(pos);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setCurrentPath('');
    setLastPos(null);
    
    if (canvasRef2.current) {
      canvasRef2.current.style.transform = 'scale(1)';
    }
  };

  const handleCanvasMouseLeave = () => {
    if (isDrawing) {
      handleCanvasMouseUp();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] animate-pulse opacity-80"></div>
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#667eea] rounded-full opacity-60 animate-bounce"
            style={{
              left: `${15 + i * 12}%`,
              top: '20%',
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center px-5 pt-16 pb-8 min-h-screen">
        {/* Title */}
        <div 
          ref={titleRef}
          onClick={handleTitlePress}
          className="cursor-pointer transition-transform duration-100 mb-5 text-center"
        >
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg" style={{
            textShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
          }}>
            🎨 Pictionary
          </h1>
          <p className="text-base text-gray-400 font-medium mt-1">Draw & Guess</p>
        </div>

        {/* Word Display */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 mb-6 border border-[#667eea]/30 shadow-lg animate-pulse">
          <p className="text-xs text-gray-400 text-center font-semibold uppercase tracking-wider">Your Word</p>
          <p className="text-xl font-bold text-white text-center mt-1">{word || '🎯 Waiting...'}</p>
        </div>

        {/* Drawing Canvas */}
        <div 
          ref={canvasRef2}
          className="w-full max-w-2xl h-96 mb-6 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        >
          <div className="w-full h-full bg-white/95 rounded-2xl border-2 border-[#667eea]/40 relative">
            <svg className="w-full h-full absolute inset-0">
              <defs>
                <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              {paths.map((d, idx) => (
                <path 
                  key={idx} 
                  d={d} 
                  stroke="url(#strokeGradient)" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              ))}
              {currentPath && (
                <path 
                  d={currentPath} 
                  stroke="url(#strokeGradient)" 
                  strokeWidth="3" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              )}
            </svg>
            <div className="absolute top-4 right-4 bg-black/10 rounded-xl px-3 py-1.5">
              <p className="text-xs text-gray-600 font-medium">✏️ Draw here</p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="w-full max-w-md mb-5">
          <div className="flex bg-white/10 backdrop-blur-md rounded-full border border-[#667eea]/30 overflow-hidden shadow-lg">
            <input
              type="text"
              placeholder="💭 Enter your guess..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGuessSubmit();
                }
              }}
              className="flex-1 px-5 py-4 text-white placeholder-gray-400 font-medium bg-transparent outline-none"
            />
            <button
              onClick={handleGuessSubmit}
              className="bg-[#667eea]/80 px-5 py-4 hover:bg-[#667eea] transition-colors duration-200"
            >
              <span className="text-lg">🚀</span>
            </button>
          </div>
        </div>

        {/* Clear Button */}
        <button
          ref={clearButtonRef}
          onClick={handleClearPress}
          className="w-full max-w-md bg-red-500/20 border-2 border-red-500/50 rounded-2xl py-4 text-red-400 font-bold shadow-lg hover:bg-red-500/30 transition-all duration-200"
        >
          🗑️ Clear Canvas
        </button>
      </div>
    </div>
  );
}
