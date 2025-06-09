'use client';

export default function ResponsePage() {
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

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#2b6cb0',
            marginBottom: '1rem'
          }}>
            Generated Response
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#4a5568',
            lineHeight: '1.6',
            whiteSpace: 'pre-line'
          }}>
            {/* Placeholder text – replace with your actual generated content */}
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. 
            Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.
          </p>
        </section>

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
            onClick={(e) => e.preventDefault()} // Remove this when real link is added
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
