import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { Navbar } from "./components";
import { Home } from "./pages";
import PassagePage from "./pages/PassagePage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <main className="bg-slate-300/20">
              <Navbar />
              <Home />
            </main>
          }
        />
        <Route path="/web"    element={<PassagePage key="web"    slug="web"    />} />
        <Route path="/design" element={<PassagePage key="design" slug="design" />} />
        <Route path="/xr"     element={<PassagePage key="xr"     slug="xr"     />} />
      </Routes>
    </Router>
  );
};

export default App;
