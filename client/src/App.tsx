import DashBoard from './DashBoard/DashBoard'
import {BrowserRouter, Routes,Route } from "react-router-dom"
import { ToastContainer, Zoom } from 'react-toastify'


export default function App() {
  
  return (
  <>
    <BrowserRouter>
    <ToastContainer autoClose={1500} transition={Zoom} closeOnClick /> 
      <Routes>
        <Route path='/' element={<DashBoard />} />
      </Routes>
    </BrowserRouter>
  </>
  )
}
