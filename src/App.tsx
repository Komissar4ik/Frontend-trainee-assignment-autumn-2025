import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components';
import { AddsList } from '@/pages/AddsList';
import { AddDetail } from '@/pages/AddDetail';
import { Stats } from '@/pages/Stats';
import './styles/index.css';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/list" replace />} />
          <Route path="/list" element={<AddsList />} />
          <Route path="/item/:id" element={<AddDetail />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
