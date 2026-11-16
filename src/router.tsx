import { Navigate, Route, Routes } from "react-router-dom";

import SiteLayout from "./layouts/SiteLayout/SiteLayout";
import Home from "./pages/Home/Home";
import Resume from "./features/resume";

export default function MyRouter() {
  return (
    <Routes>
      <Route path="" element={<SiteLayout />}>
        <Route path="" element={<Home />}></Route>
        <Route path="resume" element={<Resume />}></Route>
      </Route>
      <Route path="*" element={<Navigate to="" />} />
    </Routes>
  );
}
