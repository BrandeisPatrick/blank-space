// Animation Canvas example - Performance test with 500 particles
export const animation = {
  name: 'Animation Canvas (500 particles)',
  files: {
    'App.jsx': `import { useState } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import AnimationControls from './components/AnimationControls';

export default function App() {
  const [isRunning, setIsRunning] = useState(true);
  const [particleCount, setParticleCount] = useState(500);

  return (
    <div style={{ padding: '20px', textAlign: 'center', background: '#1a1a1a', minHeight: '100vh' }}>
      <h1 style={{ color: 'white' }}>Particle Animation Performance Test</h1>
      <AnimationControls
        isRunning={isRunning}
        particleCount={particleCount}
        onToggleRunning={() => setIsRunning(!isRunning)}
        onParticleCountChange={setParticleCount}
      />
      <ParticleCanvas isRunning={isRunning} particleCount={particleCount} />
    </div>
  );
}`,
    'components/ParticleCanvas.jsx': `import { useRef } from 'react';
import { useParticleAnimation } from '../hooks/useParticleAnimation';

export default function ParticleCanvas({ isRunning, particleCount }) {
  const canvasRef = useRef(null);
  useParticleAnimation(canvasRef, isRunning, particleCount);

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        background: '#000'
      }}
    />
  );
}`,
    'components/AnimationControls.jsx': `export default function AnimationControls({ isRunning, particleCount, onToggleRunning, onParticleCountChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={onToggleRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: isRunning ? '#ef4444' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        {isRunning ? 'Pause' : 'Play'}
      </button>

      <label style={{ color: 'white', marginLeft: '20px' }}>
        Particles: {particleCount}
        <input
          type="range"
          min="50"
          max="1000"
          value={particleCount}
          onChange={(e) => onParticleCountChange(Number(e.target.value))}
          style={{ marginLeft: '10px', width: '200px' }}
        />
      </label>
    </div>
  );
}`,
    'hooks/useParticleAnimation.js': `import { useEffect, useRef } from 'react';

export function useParticleAnimation(canvasRef, isRunning, particleCount) {
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 3 + 1,
      color: \`hsl(\${Math.random() * 360}, 70%, 60%)\`
    }));

    const animate = () => {
      if (!isRunning) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = \`rgba(255, 255, 255, \${1 - distance / 100})\`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isRunning) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, particleCount]);
}`,
    'styles.css': `body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #1a1a1a;
}`
  }
};
