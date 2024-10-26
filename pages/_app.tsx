import type { AppProps } from 'next/app'
import '../styles/globals.css'
import 'antd/dist/reset.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="app-container">
      <p id="title">
        Please Scroll to View Gallery ➡️
      </p>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp