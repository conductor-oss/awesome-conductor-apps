'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWorkflowStatus } from '../../lib/orkesClient';

export default function LoadPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [workflowId, setWorkflowId] = useState(null);
  const router = useRouter();

  // Extended steps list to fill the ~90 second runtime
  const steps = [
    'Validating input...',
    'Retrieving PDF content...',
    'Initializing AI agents...',
    'Scanning document structure...',
    'Extracting key sections...',
    'Analyzing text sentiment...',
    'Identifying core concepts...',
    'Linking citations...',
    'Building semantic graph...',
    'Running agentic analysis...',
    'Comparing external sources...',
    'Refining interpretations...',
    'Summarizing insights...',
    'Generating citations...',
    'Ranking relevance...',
    'Highlighting key arguments...',
    'Drafting conclusions...',
    'Formatting output...',
    'Finalizing response...',
    'Preparing download link...',
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('workflowId');
    const normalizedFilename = params.get('filename') || 'response.pdf';

    if (!id) {
      alert('Missing workflow ID.');
      router.push('/ask');
      return;
    }

    setWorkflowId(id);

    let pollInterval;
    let timeoutHandle;

    // Poll Orkes for workflow status
    const pollWorkflowStatus = async () => {
      try {
        const status = await getWorkflowStatus(id);
        console.log('Polling status:', status);

        if (status === 'COMPLETED') {
          clearInterval(pollInterval);
          clearTimeout(timeoutHandle);
          router.push(`/response?workflowId=${id}&filename=${encodeURIComponent(normalizedFilename)}`);
        } else if (status === 'FAILED' || status === 'TERMINATED') {
          clearInterval(pollInterval);
          clearTimeout(timeoutHandle);
          router.push('/response');
        }
      } catch (error) {
        console.error('Error polling workflow status:', error);
        clearInterval(pollInterval);
        clearTimeout(timeoutHandle);
        alert('Error occurred while checking workflow status.');
        router.push('/ask');
      }
    };

    // Start polling every 5 seconds
    pollInterval = setInterval(pollWorkflowStatus, 5000);
    pollWorkflowStatus(); // initial poll

    // Fallback: force navigation after 3 minutes if stuck
    timeoutHandle = setTimeout(() => {
      console.warn('Workflow timed out, navigating to response anyway...');
      clearInterval(pollInterval);
      router.push(`/response?workflowId=${id}`);
    }, 180000); // 3 minutes

    // Simulate visual progress through UI steps (~4.5s per step)
    const animation = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4500);

    // Cleanup timers on unmount
    return () => {
      clearInterval(animation);
      clearInterval(pollInterval);
      clearTimeout(timeoutHandle);
    };
  }, [router]);

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
        maxWidth: '520px',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#2d3748' }}>
          Generating Your Response
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#4a5568' }}>
          {steps[stepIndex]}
        </p>

        {/* Spinner */}
        <div style={{
          border: '6px solid #e2e8f0',
          borderTop: '6px solid #3182ce',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1.5rem auto'
        }} />

        {/* Additional animation: pulsing dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <div className="dot" />
          <div className="dot delay-1" />
          <div className="dot delay-2" />
        </div>

        {/* Animation keyframes */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 80%, 100% {
              transform: scale(0);
              opacity: 0.3;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .dot {
            width: 12px;
            height: 12px;
            background-color: #3182ce;
            border-radius: 50%;
            animation: pulse 1.4s infinite;
          }

          .delay-1 {
            animation-delay: 0.2s;
          }

          .delay-2 {
            animation-delay: 0.4s;
          }
        `}</style>
      </div>
    </main>
  );
}
