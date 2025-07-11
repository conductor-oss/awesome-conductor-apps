'use client';

// export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter/*, useSearchParams */} from 'next/navigation';
import { getWorkflowStatus } from '../../lib/orkesClient';

export default function LoadPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [workflowId, setWorkflowId] = useState(null);
  const router = useRouter();
  // const searchParams = useSearchParams();

  const steps = [
    'Validating input...',
    'Retrieving PDF content...',
    'Running agentic analysis...',
    'Summarizing key findings...',
    'Finalizing response...',
  ];

  useEffect(() => {
    // const id = searchParams.get('workflowId');
    // const normalizedFilename = searchParams.get('filename') || 'response.pdf';

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
          alert('Workflow failed. Please try again.');
          router.push('/ask');
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
      

    }, 180000);

    // Simulate visual progress through UI steps
    const animation = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    // Cleanup timers on unmount
    return () => {
      clearInterval(animation);
      clearInterval(pollInterval);
      clearTimeout(timeoutHandle);
    };
  }, [router/*, searchParams*/]);

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


        {/* Spinner animation keyframes */}
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
