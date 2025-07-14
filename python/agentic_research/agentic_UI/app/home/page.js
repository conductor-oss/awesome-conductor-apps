'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/ask');
  };

  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to left, #e0eafc, #cfdef3)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '600px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1rem',
          color: '#1a202c',
        }}>
          Agent Research Workflow Visualizer
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#4a5568',
          lineHeight: '1.6',
        }}>
          Welcome to our agentic research web application where we utilize the power of the Orkes Conductor to answer your queries!
        </p>
        <button
          onClick={handleClick}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#3182ce',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(49, 130, 206, 0.4)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#2b6cb0'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#3182ce'}
        >
          Ask me a question
        </button>
      </div>
    </main>
  );
}
