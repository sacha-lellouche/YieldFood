import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';

const layout = ({ children }) => {
  const router = useRouter();

  return (
    <ClerkProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </ClerkProvider>
  );
};

export default layout;