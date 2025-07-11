'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { runAgenticResearch } from '../../lib/orkesClient'; 

export default function AskPage() {
  const router = useRouter();

  // Form state: research question and filename
  const [question, setQuestion] = useState('');
  const [filename, setFilename] = useState('');

  // Handle form submission
  const handleClick = async () => {
    try {
      // Ensure the filename ends with `.pdf`
      const normalizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

      console.log('Research Question:', question);
      console.log('PDF Filename:', normalizedFilename);

      // Start the agentic_research workflow
      const workflowId = await runAgenticResearch(question, normalizedFilename);

      console.log('Workflow started with ID:', workflowId);

      // Navigate to the load page with workflow ID as query param
      router.push(`/load?workflowId=${workflowId}&filename=${encodeURIComponent(normalizedFilename)}`);
    } catch (error) {
      console.error('Error starting workflow:', error);
      alert('Failed to start the workflow. Please try again.');
    }
  };

  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#1a202c' }}>
          Ask a Research Question
        </h1>

        {/* Research question input */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
            Please type in a research question:
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How does protein folding affect drug efficacy?"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* PDF filename input */}
        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>
            PDF file name:
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. research_summary"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleClick}
          style={{
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
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2b6cb0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
        >
          Generate Response!
        </button>
      </div>
    </main>
  );
}
