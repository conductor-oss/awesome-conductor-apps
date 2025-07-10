'use client'; // Enables client-side interactivity in Next.js (needed for useEffect, useState)

import { useEffect, useState } from 'react'; // React hooks for side effects and local state
import { useSearchParams } from 'next/navigation'; // For accessing query params like ?workflowId=...
import { getTaskResultByRefName } from '../../lib/orkesClient'; // Custom helper to fetch task output from Orkes

export default function ResponsePage() {
  // Local state to hold the output of the task (defaults to 'Loading...')
  const [output, setOutput] = useState('Loading...');

  // Access the query parameters in the URL
  const searchParams = useSearchParams();

  // Runs after the component mounts
  useEffect(() => {
    // Extract workflowId from the URL query string
    const workflowId = searchParams.get('workflowId');

    // Handle missing workflow ID
    if (!workflowId) {
      setOutput('Missing workflow ID.');
      return;
    }

    // Call backend to fetch result of task named 'compile_subtopics_response_ref'
    getTaskResultByRefName(workflowId, 'compile_subtopics_response_ref')
      .then((result) => {
        // If result is valid, set it; otherwise, show fallback
        setOutput(result || 'No result found.');
      })
      .catch((error) => {
        // Log and display error message
        console.error('Error fetching task result:', error);
        setOutput('Failed to retrieve response.');
      });

  }, [searchParams]); // Re-run this effect if the URL query changes

  // Render the UI
  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to right, #f9f9f9, #e2e8f0)',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '800px',
        backdropFilter: 'blur(10px)',
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '2rem',
          color: '#2d3748',
          textAlign: 'center'
        }}>
          Your Results
        </h1>

        {/* Section to display the fetched task output */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#2b6cb0',
            marginBottom: '1rem'
          }}>
            Generated Response
          </h2>
          {/* Render the HTML output properly using dangerouslySetInnerHTML */}
          <div
            style={{
              fontSize: '1.1rem',
              color: '#4a5568',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: output }}
          />
        </section>

        {/* Section for downloadable PDF (not functional yet) */}
        <section>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#2b6cb0',
            marginBottom: '1rem'
          }}>
            Downloadable PDF
          </h2>
          <a
            href="#"
            onClick={(e) => e.preventDefault()} // Prevent navigation for now
            style={{
              color: '#3182ce',
              textDecoration: 'underline',
              fontSize: '1.1rem'
            }}
          >
            Click here to download the PDF
          </a>
        </section>
      </div>
    </main>
  );
}
