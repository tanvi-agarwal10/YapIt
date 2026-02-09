import { Manrope } from 'next/font/google';
import Head from 'next/head';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export default function App({ Component, pageProps }: { Component: React.ComponentType<any>; pageProps: any }) {
  return (
    <main className={`${manrope.variable} font-sans`}>
      <Head>
        <title>YapIt</title>
        <meta name="description" content="YapIt real-time chat" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
    </main>
  );
}
