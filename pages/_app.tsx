import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ConfigProvider>
        <Component {...pageProps} />
      </ConfigProvider>
    </SessionProvider>
  );
}

export default MyApp;