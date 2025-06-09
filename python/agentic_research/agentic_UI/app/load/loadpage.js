'use client';

import { useEffect, useState } from 'react';

export default function LoadPage() {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Validating input...',
    'Retrieving PDF content...',
    'Running agentic analysis...',
    'Summarizing key findings...',
    'Finalizing response...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1500); // every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to right, #f9f9f9, #e2e8f0)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        width: '90%',
        maxWidth: '500px',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#2d3748' }}>
          Generating Your Response
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#4a5568' }}>
          {steps[stepIndex]}
        </p>

        <div style={{
          border: '6px solid #e2e8f0',
          borderTop: '6px solid #3182ce',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem auto'
        }} />

        {/* Optional progress bar */}
        <div style={{
          height: '10px',
          width: '100%',
          backgroundColor: '#e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((stepIndex + 1) / steps.length) * 100}%`,
            backgroundColor: '#3182ce',
            transition: 'width 1s ease',
          }} />
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </main>
  );
}
