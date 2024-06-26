import CVEList from "./components/CVEList";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CVEDetailsPage from "./components/CVESecondPage";

function App() {
  return (
    <div className="hi">
      <BrowserRouter>
        <Routes>
          <Route path="/cves/list" element={<CVEList />} />
          <Route path="/cves/:cveId" element={<CVEDetailsPage />} />
          {/* <Route path="/cves/filter" element={<CVEDetailsPage />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
