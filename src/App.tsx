import { useEffect, useState } from 'react'
import './App.css'
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts'
import { X } from 'lucide-react'


interface Product {
  orderNo:string
  url: string
  name: string
  imgSrc:string
  history: { date: string; price: string }[]
}

export default function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  const handleAddToTrack = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3001/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('加入失敗')
      const data = await res.json()
      console.log('新增商品:', data)
      fetchProducts() // 重新抓取清單
    } catch (err) {
      console.error("加入失敗",err)
      setError('無法加入追蹤，請確認網址或後端狀態')
    } finally {
      setLoading(false)
      setUrl('')
    }
  }

  const handleDeleteTrack = async (trackerID:string) => {
    console.log(trackerID)
    try{
      const res = await fetch("http://localhost:3001/deletetracker",{
        method:"POST",
        headers:{ 'Content-Type': 'application/json' },
        body:JSON.stringify({trackerID})
      })
      if(!res.ok) throw new Error("刪除失敗")
      const data = await res.json()
      fetchProducts()
    }catch(err){
      console.error("刪除失敗",err)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3001/products')
      const data = await res.json()
      console.log(data)
      setProducts(data)
    } catch (err) {
      console.error('無法獲取追蹤清單')
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🛍️ 商品價格追蹤器</h1>
        
        <div className="flex mb-6 gap-2">
          <input
            className="flex-1 px-4 py-2 border rounded-lg shadow-sm"
            placeholder="輸入商品網址"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handleAddToTrack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {loading ? '加入中' : "追蹤"}
          </button>
        </div>

        {error && <p className="text-red-500 mb-2" >{error}</p>}

        <div className="grid gap-4">
        {products.map((product, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow relative">
            {/* 刪除按鈕 */}
            <button
              onClick={() => handleDeleteTrack(product.orderNo)}
              // onClick={() => alert("ok")}
              className='absolute top-2 right-2 text-red-500 hover:text-red-700'
              title='刪除追蹤'
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <a
              href={product.url}
              target="_blank"
              className="text-blue-500 text-sm underline"
            >
              查看商品
            </a>

            <div>
              <img src={product.imgSrc} width={"100px"} ></img>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              最新價格：<span className="font-medium">{product.history[0].price}</span>
            </div>
            <div className="text-xs text-gray-500">
              追蹤日期：{product.history[0].date}
            </div>

            {/* 價格折線圖 */}
            <div className="h-40 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={product.history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}
