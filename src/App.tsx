import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Courses } from "./pages/Courses";
import { CourseDetail } from "./pages/CourseDetail";
import { Program } from "./pages/Program";
import { Visit } from "./pages/Visit";
import { Enroll } from "./pages/Enroll";
import { Desk } from "./pages/Desk";
import { Office } from "./pages/Office";
import { Invoice } from "./pages/Invoice";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:slug" element={<CourseDetail />} />
          <Route path="program" element={<Program />} />
          <Route path="visit" element={<Visit />} />
          <Route path="enroll" element={<Enroll />} />
          <Route path="desk" element={<Desk />} />
          <Route path="office" element={<Office />} />
          <Route path="invoice/:id" element={<Invoice />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
