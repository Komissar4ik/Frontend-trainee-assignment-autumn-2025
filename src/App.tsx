import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components';
import { AdsList } from '@/pages/AdsList';
import { AdDetail } from '@/pages/AdDetail';
import { Stats } from '@/pages/Stats';
import './styles/index.css';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/list" replace />} />
          <Route path="/list" element={<AdsList />} />
          <Route path="/item/:id" element={<AdDetail />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

