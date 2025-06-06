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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'sans-serif',
      backgroundColor: '#f9f9f9'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
        Welcome to the Agent Research Workflow Visualizer
      </h1>
      <p style={{ fontSize: '1.125rem', color: '#555', textAlign: 'center', maxWidth: '600px' }}>
        Hello, and welcome to our visual rendition of the agent research workflow. Explore how agents operate step-by-step through this interface.
      </p>
      <button
        onClick={handleClick}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = '#0059c1'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = '#0070f3'}
      >
        Ask me a question
      </button>
    </main>
  );
}
