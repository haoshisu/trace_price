import DashBoard from "./DashBoard/DashBoard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, Zoom } from "react-toastify";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";

export default function App() {
 return (
  <>
   <BrowserRouter>
    <ToastContainer autoClose={1500} transition={Zoom} closeOnClick />
    <Routes>
     <Route path="/dashboard" element={<DashBoard />} />
     <Route path="/register" element={<RegisterForm />} />
     <Route path="/login" element={<LoginForm />} />
     <Route path="/" element={<LoginForm />} />
    </Routes>
   </BrowserRouter>
  </>
 );
}
