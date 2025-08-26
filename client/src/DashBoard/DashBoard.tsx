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
 const [isDemo, setIsDemo] = useState<boolean>(false);

 // ======================== 用戶是否demo身份 ========================
 const handleIsDemo = async () => {
  try {
   const token = localStorage.getItem("token");
   const res = await fetch("https://trace-price-backend.onrender.com/me", {
    headers: { Authorization: `Bearer ${token}` },
   });
   const data = await res.json();
   setIsDemo(data?.isDemo);
  } catch (error) {
   console.log(error);
  }
 };
 useEffect(() => {
  handleIsDemo();
 }, []);

 //  ======================== 登出function ========================
 const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
 };

 // ======================== 新增追蹤商品 ========================
 const handleAddToTrack = async () => {
  setLoading(true);
  setError("");
  try {
   const token = localStorage.getItem("token"); // 取得登入時存下來的 token
   const res = await fetch("https://6290bc1bb7c1.ngrok-free.app/webhook/tracker", {
    //http://localhost:5678/webhook/tracker
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

 // ======================== 刪除追蹤商品 ========================
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

 // ======================== 獲取追蹤商品 ========================
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

   //    const next: { [k: string]: string } = {};
   //    data.forEach((p) => {
   //     next[p._id] = p.targetPrice != null ? String(p.targetPrice) : "";
   //    });
   //    console.log(next);
   setTargetPrice({});
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

 // ======================== 設定/更新目標價 ========================
 const handleSetTargetPrice = async (productId: string) => {
  const val = targetPrice[productId];
  const num = Number(String(val).replace(/[^\d.]/g, "")); // 容錯：移除非數字
  if (!Number.isFinite(num) || num <= 0) {
   return toast.warning("請輸入有效的正整數/數字價格");
  }
  try {
   const token = localStorage.getItem("token");
   const res = await fetch(
    `hhttps://trace-price-backend.onrender.com/products/${productId}/target-price`,
    {
     method: "POST",
     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
     body: JSON.stringify({ price: num }),
    }
   );
   const data = await res.json();
   if (!res.ok || data.status !== "1x100") return toast.error(data.message || "設定失敗");
   toast.success("已設定到價通知");
   fetchProducts(); // 重新刷新畫面
  } catch (err: any) {
   toast.error(err.message || "設定失敗");
  }
 };

 // ======================== 清除目標價 ========================
 const handleClearTargetPrice = async (productId: string) => {
  try {
   const token = localStorage.getItem("token");
   const res = await fetch(
    `https://trace-price-backend.onrender.com/products/${productId}/target-price`,
    {
     method: "DELETE",
     headers: { Authorization: `Bearer ${token}` },
    }
   );
   const data = await res.json();
   if (!res.ok || data.status !== "1x100") return toast.error(data.message || "清除失敗");

   toast.success("已清除到價通知");
   // 立即清空輸入框並重新抓資料
   setTargetPrice((prev) => ({ ...prev, [productId]: "" }));
   fetchProducts();
  } catch (err: any) {
   toast.error(err.message || "清除失敗");
  }
 };

 return (
  <>
   {fetchProductLoading ? (
    <FetchLoading />
   ) : (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
     <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
       <div className="flex items-center gap-3">
        <span
         aria-hidden
         className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white text-sm"
        >
         ￥
        </span>
        <div>
         <h1 className="text-lg font-semibold text-slate-900 leading-tight">商品價格追蹤器</h1>
         <p className="text-xs text-slate-500">到價通知・歷史價格趨勢</p>
        </div>
       </div>

       <button
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={handleLogout}
        aria-label="登出"
        title="登出"
       >
        登出
       </button>
      </div>
     </header>

     <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <section aria-labelledby="add-tracker" className="mb-6">
       <form
        className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm"
        onSubmit={(e) => {
         e.preventDefault();
         if (!loading) handleAddToTrack();
        }}
       >
        <div className="flex gap-2">
         <div className="relative flex-1">
          <label htmlFor="track-url" className="sr-only">
           商品網址
          </label>
          <input
           id="track-url"
           type="url"
           inputMode="url"
           autoComplete="off"
           required
           pattern="https?://.+"
           className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-24 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
           placeholder="貼上商品網址（目前支援 momo ）"
           value={url}
           onChange={(e) => setUrl(e.target.value)}
           aria-describedby="track-help"
          />
          <p id="track-help" className="mt-1 text-xs text-slate-500">
           例如：https://www.momoshop.com.tw/goods/…
          </p>

          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
           追蹤中 {products.length} 件
          </span>
         </div>

         <button
          type="submit"
          disabled={loading}
          className={[
           "shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white",
           loading ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm",
          ].join(" ")}
         >
          {loading ? "加入中…" : "加入追蹤"}
         </button>
        </div>

        {error && (
         <p role="alert" className="mt-2 text-sm text-rose-600">
          {error}
         </p>
        )}
       </form>
      </section>

      {isDemo && (
       <p role="alert" className="m-2 text-sm text-red-500">
        **Demo 帳號僅供瀏覽與新增追蹤商品**
       </p>
      )}
      {/* 商品卡片區 */}
      <section aria-labelledby="list" className="grid gap-4">
       <h2 id="list" className="sr-only">
        追蹤清單
       </h2>
       {products.map((product, index) => {
        const chartData = product.history.map((e) => ({
         date: e.date,
         price: Number(String(e.price).replace(/,/g, "")),
        }));

        // 取得最新數字價格、判斷是否達標、判斷輸入是否有效/是否未變更
        const latestPriceNum = (() => {
         const raw = product.history[product.history.length - 1]?.price ?? "";
         return Number(String(raw).replace(/[^\d.]/g, ""));
        })();

        const inputStr = targetPrice[product._id] ?? "";
        const inputNum = Number(String(inputStr).replace(/[^\d.]/g, ""));
        const hasTarget = typeof (product as any).targetPrice === "number";
        const reached =
         hasTarget &&
         Number.isFinite(latestPriceNum) &&
         latestPriceNum <= (product as any).targetPrice;
        const invalid = !inputStr || !Number.isFinite(inputNum) || inputNum <= 0;
        const unchanged =
         hasTarget && Number.isFinite(inputNum) && inputNum === (product as any).targetPrice;

        return (
         <div
          key={index}
          className="p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 relative"
         >
          {/* 刪除 */}
          <button
           //  disabled={isDemo}
           onClick={() => {
            if (isDemo) return toast.info("Demo帳號僅供瀏覽");
            handleDeleteTrack(product._id);
           }}
           className={`absolute top-2 right-2 z-10 ${
            isDemo ? "text-red-600 cursor-not-allowed" : "text-red-500 hover:text-red-700"
           }`}
           title={isDemo ? "Demo 帳號無法刪除" : "刪除追蹤"}
          >
           <X className="w-5 h-5" />
          </button>

          {/* 標題 & 已達標 badge */}
          <div className="flex items-start justify-between gap-2">
           <div>
            <h2 className="text-base font-semibold leading-6 text-gray-900">{product.name}</h2>
            <a
             href={product.url}
             target="_blank"
             className="text-xs text-blue-600 underline underline-offset-2"
            >
             查看商品
            </a>
           </div>

           {reached && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
             已達標
            </span>
           )}
          </div>

          {/* 商品圖 & 價格摘要 */}
          <div className="mt-3 flex items-center gap-3">
           <img
            src={product.imgSrc}
            alt=""
            className="w-16 h-16 rounded-lg object-cover ring-1 ring-gray-200"
           />
           <div className="text-sm text-gray-700">
            <div>
             最新價格：
             <span className="font-semibold">
              {product.history[product.history.length - 1]?.price}
             </span>
            </div>
            <div className="text-xs text-gray-500">
             追蹤日期：{product.history[product.history.length - 1]?.date}
            </div>

            {/* 目前目標價（若已有） */}
            {(product as any).targetPrice != null && (
             <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
               目標價 NT$ {(product as any).targetPrice}
              </span>
             </div>
            )}
           </div>
          </div>

          {/* 到價設定區 */}
          <div className="mt-4 space-y-1.5">
           <div className="flex flex-wrap items-center gap-2">
            {/* 帶前綴 + 取現價 */}
            <div className="relative">
             <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              NT$
             </span>
             <input
              disabled={isDemo}
              type="number"
              inputMode="numeric"
              placeholder="目標價"
              value={inputStr}
              onChange={(e) =>
               setTargetPrice((prev) => ({ ...prev, [product._id]: e.target.value }))
              }
              className={[
               "w-40 rounded-xl border bg-gray-50 pl-9 pr-16 py-2 text-right text-sm outline-none",
               "transition-shadow focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
               invalid ? "border-rose-300 focus:ring-rose-400" : "border-gray-300",
              ].join(" ")}
             />
             <button
              disabled={isDemo}
              type="button"
              onClick={() =>
               setTargetPrice((prev) => ({
                ...prev,
                [product._id]: Number.isFinite(latestPriceNum) ? String(latestPriceNum) : "",
               }))
              }
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] text-gray-600 ring-1 ring-gray-200 hover:bg-white"
              title="套用目前價格"
             >
              取現價
             </button>
            </div>

            {/* 儲存/更新 */}
            <button
             onClick={() => handleSetTargetPrice(product._id)}
             disabled={invalid || unchanged}
             className={[
              "h-9 rounded-xl px-3 text-sm font-medium text-white shadow-sm",
              invalid || unchanged
               ? "bg-gray-300 cursor-not-allowed"
               : "bg-emerald-600 hover:bg-emerald-700",
             ].join(" ")}
            >
             {hasTarget ? "更新到價" : "設定到價"}
            </button>

            {/* 清除（次要按鈕） */}
            <button
             type="button"
             onClick={() => {
              if (hasTarget) {
               // 已設定過目標價 → 呼叫後端清除
               handleClearTargetPrice(product._id);
              } else {
               // 尚未設定，只是輸入框有值 → 只清空輸入框
               setTargetPrice((prev) => ({ ...prev, [product._id]: "" }));
              }
             }}
             disabled={!hasTarget && !inputStr}
             className={[
              "h-9 rounded-xl px-3 text-sm font-medium",
              "bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50",
              !hasTarget && !inputStr ? "opacity-50 cursor-not-allowed" : "",
             ].join(" ")}
             title="清除目標價"
            >
             清除
            </button>
           </div>

           <p className="text-xs text-gray-400">
            設定後，系統會在價格低於或等於目標價時通知你。
            {invalid && <span className="ml-1 text-rose-500">請輸入有效金額</span>}
            {unchanged && <span className="ml-1 text-amber-600">與目前目標價相同</span>}
           </p>
          </div>

          {/* 圖表 */}
          <div className="h-[250px] mt-4">
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
             <Line type="monotone" dataKey="price" stroke="#6366F1" dot={false} />
            </LineChart>
           </ResponsiveContainer>
          </div>
         </div>
        );
       })}
      </section>
     </main>

     <footer className="mx-auto max-w-3xl px-4 py-10 text-xs text-slate-500">
      <p>本工具僅用於協助用戶追蹤公開商品頁之價格變化；實際價格與庫存以原網站為準。</p>
     </footer>
    </div>
   )}
  </>
 );
}
