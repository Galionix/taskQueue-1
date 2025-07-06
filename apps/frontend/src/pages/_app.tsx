// import { AppProps } from 'next/app';
// import Head from 'next/head';
// import './styles.css';

// function CustomApp({ Component, pageProps }: AppProps) {
//   return (
//     <>
//       <Head>
//         <title>Welcome to frontend!</title>
//       </Head>
//       <main className="app">
//         <Component {...pageProps} />
//       </main>
//     </>
//   );
// }

// export default CustomApp;
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional for dev tools

// import { taskConstant } from '@tasks/lib';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  // console.log(taskConstant);
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <ReactQueryDevtools initialIsOpen={false} /> {/* Optional */}
    </QueryClientProvider>
  );
}

export default MyApp;