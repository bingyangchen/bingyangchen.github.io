import { Navigate, Route, Routes } from "react-router-dom";

// layer one
import Main from "./pages/Main/Main";

// layer two
import Home from "./pages/Main/Home/Home";
import Resume from "./pages/Main/Resume/Resume";

export default function MyRouter() {
  return (
    <Routes>
      <Route path="" element={<Main />}>
        <Route path="" element={<Home />}></Route>
        <Route path="resume" element={<Resume />}></Route>
      </Route>
      <Route path="*" element={<Navigate to="" />} />
    </Routes>
  );
}
