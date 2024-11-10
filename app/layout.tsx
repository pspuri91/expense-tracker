"use client"

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import '@n8n/chat/style.css'; // Import the n8n chat CSS
import { useEffect } from 'react';
import { createChat } from '@n8n/chat';
import { metadata } from './metadata'; // Import metadata from the new file

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    createChat({
      webhookUrl: process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL, // Use the updated environment variable
      allowFileUploads: true,
      initialMessages: [
        'Hello. Please upload a receipt to start adding items.'
      ], // You can add other options here as needed
    });
  }, []);

  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Set dark mode as the default theme
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
