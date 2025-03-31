import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import MessageSelector from './pages/MessageSelector';
import PostEditor from './pages/PostEditor';
import NotFound from './pages/NotFound';

function App() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<MessageSelector />} />
          <Route path="messages" element={<MessageSelector />} />
          <Route path="editor" element={<PostEditor />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

export default App; 