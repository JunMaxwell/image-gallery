import type { AppProps } from 'next/app'
import '../styles/globals.css'

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