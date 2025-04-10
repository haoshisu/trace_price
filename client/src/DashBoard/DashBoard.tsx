import { useEffect, useState } from 'react'
import './DashBoard.css'
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid, Legend } from 'recharts'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'


interface Product {
  orderNo:string
  url: string
  name: string
  imgSrc:string
  history: { date: string; price: string }[]
  _id:string
}

export default function DashBoard() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')

  //新增追蹤商品
  const handleAddToTrack = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3001/tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) return toast.error("加入失敗")
      const data = await res.json()
      if(data.status === "1x101") return toast.error(`${data.message}`)
      if(data.status === "9x999") return toast.error(`${data.message}`)
      if(data.status === "1x100") toast.success("新增成功")
      fetchProducts() // 重新抓取清單
    } catch (err) {
      console.error(err)
      setError('無法加入追蹤，請確認網址或後端狀態')
    } finally {
      setLoading(false)
      setUrl('')
    }
  }

  //刪除追蹤商品
  const handleDeleteTrack = async (trackerID:string) => {
    try{
      const res = await fetch(`http://localhost:3001/deletetracker/${trackerID}`,{
        method:"DELETE",
      })
      if(!res.ok) return toast.error("刪除失敗")
      const data = await res.json()
      if(data.status === "1x101") return toast.error(`${data.message}`)
      if(data.status === "9x999") return toast.error(`${data.message}`)
      if(data.status === "1x100") toast.success("刪除成功")
      console.log(data)
      fetchProducts()
    }catch(err){
      console.error("刪除失敗",err)
    }
  }

  //獲取追蹤商品
  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3001/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      toast.warning("無法獲取追蹤商品")
      console.error('無法獲取追蹤清單',err)
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
          disabled={loading}
          onClick={handleAddToTrack}
          className="px-4 py-2 text-white rounded-lg bg-blue-600 hover:bg-blue-700
          disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
        >
          {loading ? '加入中' : "追蹤"}
        </button>
      </div>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="grid gap-4">
        {products.map((product, index) => {
          const chartData = product.history.map(e => ({
            date: e.date,
            price: Number(e.price.replace(",","")),
          }))
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
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <a
                href={product.url}
                target="_blank"
                className="text-blue-500 text-sm underline"
              >
                查看商品
              </a>

              <div>
                <img src={product.imgSrc} width="100px" />
              </div>

              <div className="mt-2 text-sm text-gray-700">
                最新價格：<span className="font-medium">{product.history[product.history.length - 1]?.price}</span>
              </div>
              <div className="text-xs text-gray-500">
                追蹤日期：{product.history[product.history.length - 1]?.date}
              </div>

              <div className="h-[250px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </div>
  )
}
