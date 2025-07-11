'use client'; // Enables client-side rendering in Next.js

// export const dynamic = 'force-dynamic';

// Import necessary React hooks and libraries
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation'; // To access query parameters from URL
import { getTaskResultByRefName } from '../../lib/orkesClient'; // Orkes API helper
// import html2pdf from 'html2pdf.js'; // Library to convert HTML content to downloadable PDF

export default function ResponsePage() {
  // State to hold the fetched HTML response
  const [output, setOutput] = useState('Loading...');

  // State to hold the filename for the downloadable PDF
  const [filename, setFilename] = useState('response.pdf');

  // Hook to read URL search parameters (e.g., workflowId, filename)
  const searchParams = useSearchParams();

  // Ref to reference the HTML content for PDF generation
  const contentRef = useRef(null);

  // Effect to fetch data from Orkes once URL parameters are available
  useEffect(() => {
    // Extract query parameters
    const workflowId = searchParams.get('workflowId');
    const rawFilename = searchParams.get('filename');

    // If no workflow ID is present, display error and exit
    if (!workflowId) {
      setOutput('Missing workflow ID.');
      return;
    }

    // Normalize and sanitize the filename from query param
    const finalFilename =
      rawFilename && rawFilename.trim() !== ''
        ? rawFilename.endsWith('.pdf') // If already ends with .pdf, keep as is
          ? rawFilename
          : `${rawFilename}.pdf` // Otherwise, append .pdf
        : 'response.pdf'; // Fallback if no filename is provided
    setFilename(finalFilename);

    // Fetch the task result from Orkes using reference name
    getTaskResultByRefName(workflowId, 'compile_subtopics_response_ref')
      .then((result) => {
        setOutput(result || 'No result found.'); // Update UI with result or fallback
      })
      .catch((error) => {
        console.error('Error fetching task result:', error);
        setOutput('Failed to retrieve response.'); // Handle fetch failure
      });
  }, [searchParams]); // Re-run this effect if searchParams change

  // Function to download the displayed HTML content as a PDF
  // const handleDownloadPDF = () => {
  //   if (!contentRef.current) return;

  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined') return;
  
    const html2pdf = (await import('html2pdf.js')).default;
  
    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
  
    html2pdf().from(contentRef.current).set(opt).save();
  };
  

  //   // PDF generation configuration options
  //   const opt = {
  //     margin: 0.5,
  //     filename: filename,
  //     image: { type: 'jpeg', quality: 0.98 },
  //     html2canvas: { scale: 2 },
  //     jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  //   };

  //   // Generate and save the PDF
  //   html2pdf().from(contentRef.current).set(opt).save();
  // };

  // JSX for the page layout
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
        {/* Page Header */}
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '2rem',
          color: '#2d3748',
          textAlign: 'center'
        }}>
          Your Results
        </h1>

        {/* Section: Generated HTML response from Orkes */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#2b6cb0',
            marginBottom: '1rem'
          }}>
            Generated Response
          </h2>

          {/* HTML output rendered with innerHTML and marked for PDF export */}
          <div
            ref={contentRef}
            style={{
              fontSize: '1.1rem',
              color: '#4a5568',
              lineHeight: '1.6'
            }}
            dangerouslySetInnerHTML={{ __html: output }}
          />
        </section>

        {/* Section: PDF download link */}
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
              e.preventDefault(); // Prevent default link behavior
              handleDownloadPDF(); // Trigger PDF download
            }}
            style={{
              color: '#3182ce',
              textDecoration: 'underline',
              fontSize: '1.1rem'
            }}
          >
            Click here to download <strong>{filename}</strong>
          </a>
        </section>
      </div>
    </main>
  );
}
