import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashBoard.css";
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 Tooltip,
 ResponsiveContainer,
 CartesianGrid,
 Legend,
} from "recharts";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import FetchLoading from "../fetchLoading/FetchLoading";

interface Product {
 orderNo: string;
 url: string;
 name: string;
 imgSrc: string;
 history: { date: string; price: string }[];
 _id: string;
}

export default function DashBoard() {
 const navigate = useNavigate();
 const [url, setUrl] = useState<string>("");
 const [loading, setLoading] = useState<boolean>(false);
 const [fetchProductLoading, setFetchProductLoading] = useState<boolean>(false);
 const [products, setProducts] = useState<Product[]>([]);
 const [error, setError] = useState("");
 const [targetPrice, setTargetPrice] = useState<{ [key: string]: string }>({});

 //  登出function
 const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
 };

 //  價格通知設定
 const handleSetTargetPrice = async (productId: string) => {
  const token = localStorage.getItem("token");
  const priceStr = targetPrice[productId]; // 單一商品的輸入值（字串）
  const price = Number(priceStr);

  if (!priceStr) return toast.warning("請輸入目標價格");
  if (Number.isNaN(price) || price <= 0) return toast.warning("目標價格需為大於 0 的數字");

  try {
   const res = await fetch("https://trace-price-backend.onrender.com/set-target-price", {
    method: "POST",
    headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, price }),
   });
   const data = await res.json();
   if (data.status === "1x100") {
    toast.success("到價價格設定成功");
   } else {
    toast.error(data.message || "設定失敗");
   }
  } catch (err) {
   console.error(err);
   toast.error("設定失敗，請稍後再試");
  }
 };

 //新增追蹤商品
 const handleAddToTrack = async () => {
  setLoading(true);
  setError("");
  try {
   const token = localStorage.getItem("token"); // 取得登入時存下來的 token
   const res = await fetch("https://haoshisu0614.app.n8n.cloud/webhook-test/tracker", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
   });
   if (!res.ok) return toast.error("加入失敗");
   const data = await res.json();
   if (data.status === "1x101") return toast.error(`${data.message}`);
   if (data.status === "9x999") return toast.error(`${data.message}`);
   if (data.status === "1x100") {
    toast.success("新增成功");
    fetchProducts(); // 重新抓取清單
   }
  } catch (err) {
   console.error(err);
   setError("無法加入追蹤，請確認網址或後端狀態");
  } finally {
   setLoading(false);
   setUrl("");
  }
 };

 //刪除追蹤商品
 const handleDeleteTrack = async (trackerID: string) => {
  try {
   const token = localStorage.getItem("token"); // 取得登入時存下來的 token
   const res = await fetch(`https://trace-price-backend.onrender.com/deletetracker/${trackerID}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
   });
   if (!res.ok) return toast.error("刪除失敗");
   const data = await res.json();
   if (data.status === "1x101") return toast.error(`${data.message}`);
   if (data.status === "9x999") return toast.error(`${data.message}`);
   if (data.status === "1x100") toast.success("刪除成功");
   fetchProducts();
  } catch (err: any) {
   toast.error(err.message);
   //    console.error("刪除失敗", err);
  }
 };

 //獲取追蹤商品
 const fetchProducts = async () => {
  setFetchProductLoading(true);
  try {
   const token = localStorage.getItem("token"); // 取得登入時存下來的 token
   const res = await fetch("https://trace-price-backend.onrender.com/products", {
    headers: {
     Authorization: `Bearer ${token}`,
    },
   });
   const data = await res.json();
   setProducts(data);
  } catch (err) {
   toast.warning("無法獲取追蹤商品");
   //    console.error("無法獲取追蹤清單", err);
  } finally {
   setFetchProductLoading(false);
  }
 };

 useEffect(() => {
  fetchProducts();
 }, []);

 //  const handlemail = () => {
 //   const token = localStorage.getItem("token");
 //   fetch("http://localhost:3001/test-mail", {
 //    method: "POST",
 //    headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
 //   })
 //    .then((res) => res.json())
 //    .then((data) => console.log(data));
 //  };

 return (
  <>
   {fetchProductLoading ? (
    <FetchLoading />
   ) : (
    <div className="min-h-screen bg-gray-100 p-8">
     <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
       <h1 className="text-3xl font-bold text-center flex-1">🛍️ 商品價格追蹤器</h1>
       <button
        className="ml-4 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm"
        onClick={handleLogout}
        title="登出"
       >
        登出
       </button>
      </div>
      <div className="flex mb-6 gap-2">
       <input
        className="flex-1 px-4 py-2 border rounded-lg shadow-sm"
        placeholder="輸入商品網址"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
       />
       <button
        disabled={loading}
        onClick={handleAddToTrack}
        className="px-4 py-2 text-white rounded-lg bg-blue-600 hover:bg-blue-700
            disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
       >
        {loading ? "加入中" : "追蹤"}
       </button>
      </div>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="grid gap-4">
       {products.map((product, index) => {
        const chartData = product.history.map((e) => ({
         date: e.date,
         //  price: e.price,
         price: Number(String(e.price).replace(/,/g, "")),
        }));
        return (
         <div key={index} className="p-4 bg-white rounded-lg shadow relative">
          {/* 刪除按鈕 */}
          <button
           onClick={() => handleDeleteTrack(product._id)}
           className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
           title="刪除追蹤"
          >
           <X className="w-5 h-5" />
          </button>

          {/* <div className="mt-4 flex items-center gap-2">
           <input
            type="text"
            min="0"
            placeholder="輸入目標價格"
            value={targetPrice[product._id] || ""}
            onChange={(e) =>
             setTargetPrice((prev) => ({
              ...prev,
              [product._id]: e.target.value,
             }))
            }
            className="border rounded-lg px-2 py-1 w-32 text-right"
           />
           <button
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
            onClick={() => handleSetTargetPrice(product._id)}
           >
            設定到價通知
           </button>
          </div> */}

          <h2 className="text-lg font-semibold">{product.name}</h2>
          <a href={product.url} target="_blank" className="text-blue-500 text-sm underline">
           查看商品
          </a>

          <div>
           <img src={product.imgSrc} width="100px" />
          </div>

          <div className="mt-2 text-sm text-gray-700">
           最新價格：
           <span className="font-medium">{product.history[product.history.length - 1]?.price}</span>
          </div>
          <div className="text-xs text-gray-500">
           追蹤日期：{product.history[product.history.length - 1]?.date}
          </div>

          <div className="h-[250px] mt-2">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis
              dataKey="date"
              minTickGap={18}
              tickFormatter={(v) => (v.length > 5 ? v.slice(5) : v)}
             />
             <YAxis />
             <Tooltip />
             <Legend />
             <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
            </LineChart>
           </ResponsiveContainer>
          </div>
         </div>
        );
       })}
      </div>
     </div>
    </div>
   )}
  </>
 );
}
