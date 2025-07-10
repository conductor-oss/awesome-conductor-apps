'use client'; // Enables client-side interactivity in Next.js

import { useEffect, useState, useRef } from 'react'; // React hooks
import { useSearchParams } from 'next/navigation'; // For accessing query params
import { getTaskResultByRefName } from '../../lib/orkesClient'; // Orkes task fetcher
import html2pdf from 'html2pdf.js'; // Library to generate PDFs from HTML

export default function ResponsePage() {
  const [output, setOutput] = useState('Loading...'); // Output HTML state
  const searchParams = useSearchParams(); // Get URL params
  const contentRef = useRef(null); // Reference to the HTML section to convert to PDF

  useEffect(() => {
    const workflowId = searchParams.get('workflowId'); // Read workflowId from URL

    if (!workflowId) {
      setOutput('Missing workflow ID.');
      return;
    }

    // Fetch output from Orkes
    getTaskResultByRefName(workflowId, 'compile_subtopics_response_ref')
      .then((result) => {
        setOutput(result || 'No result found.');
      })
      .catch((error) => {
        console.error('Error fetching task result:', error);
        setOutput('Failed to retrieve response.');
      });
  }, [searchParams]);

  // Handles PDF download
  const handleDownloadPDF = () => {
    if (!contentRef.current) return;

    const opt = {
      margin: 0.5,
      filename: 'response.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(contentRef.current).set(opt).save();
  };

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

        {/* Generated Response Section */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#2b6cb0',
            marginBottom: '1rem'
          }}>
            Generated Response
          </h2>
          <div
            ref={contentRef} // Referenced for PDF
            style={{
              fontSize: '1.1rem',
              color: '#4a5568',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: output }}
          />
        </section>

        {/* PDF Download Section */}
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
            onClick={(e) => {
              e.preventDefault();
              handleDownloadPDF();
            }}
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
