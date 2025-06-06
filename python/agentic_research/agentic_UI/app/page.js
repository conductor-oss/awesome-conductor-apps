'use client'; // required for client-side navigation

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/ask'); // navigate to /ask page
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Helloooooooo from the App Router</h1>
      <p>Hello, welcome to our visual rendition of our agent research workflow.</p>
      <button
        onClick={handleClick}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Ask me a question
      </button>
    </main>
  );
}
