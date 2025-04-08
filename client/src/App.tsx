import DashBoard from './DashBoard/DashBoard'
import { ToastContainer, Zoom } from 'react-toastify'


export default function App() {
  
  return (
  <>
    <ToastContainer autoClose={1500} transition={Zoom} closeOnClick /> 
    <DashBoard />
  </>
  )
}
