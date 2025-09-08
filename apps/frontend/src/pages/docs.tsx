import { Layout } from '@/components/layout';
import { DocsMain } from '@/components/docs';

export function Docs() {
  return (
    <Layout title="📚 Documentation" showRestartButton={false}>
      <DocsMain />
    </Layout>
  );
}

export default Docs;
