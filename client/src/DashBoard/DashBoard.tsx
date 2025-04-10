import { useEffect, useState } from 'react'
import './DashBoard.css'
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts'
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
      const res = await fetch('https://trace-price-backend.onrender.com/tracker', {
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
      const res = await fetch(`https://trace-price-backend.onrender.com/deletetracker/${trackerID}`,{
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
      const res = await fetch('https://trace-price-backend.onrender.com/products')
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800 tracking-tight">
          🛍️ 商品價格追蹤器
        </h1>
    
        <div className="flex mb-8 gap-3">
          <input
            className="flex-1 px-5 py-3 border border-gray-200 rounded-xl shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              bg-white transition-all duration-200"
            placeholder="輸入商品網址"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            disabled={loading}
            onClick={handleAddToTrack}
            className="px-6 py-3 text-white rounded-xl font-medium
              bg-gradient-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              disabled:from-gray-400 disabled:to-gray-400 
              disabled:cursor-not-allowed 
              transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? '加入中...' : "開始追蹤"}
          </button>
        </div>

        {error && (
          <p className="text-red-500 mb-6 text-center bg-red-50 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="grid gap-6">
          {products.map((product, index) => {
            const chartData = product.history.map(e => ({
              date: e.date,
              price: Number(e.price.replace(",","")),
            }))
            return (
              <div 
                key={index} 
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md 
                  transition-all duration-200 border border-gray-100"
              >
                <button
                  onClick={() => handleDeleteTrack(product._id)}
                  className='absolute top-4 right-4 text-gray-400 hover:text-red-500 
                    transition-colors duration-200'
                  title='刪除追蹤'
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="flex items-start gap-4">
                  <img 
                    src={product.imgSrc} 
                    width="100" 
                    className="rounded-lg object-cover h-[100px] w-[100px]"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">
                      {product.name}
                    </h2>
                    <a
                      href={product.url}
                      target="_blank"
                      className="text-blue-600 text-sm hover:underline mt-1 inline-block"
                    >
                      查看商品 →
                    </a>
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">最新價格：</span>
                      <span className="text-lg font-medium text-gray-900">
                        {product.history[product.history.length - 1]?.price}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      更新於：{product.history[product.history.length - 1]?.date}
                    </div>
                  </div>
                </div>

                <div className="h-[250px] mt-6 bg-gray-50 rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
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
