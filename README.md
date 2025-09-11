# momo商品價格追蹤器 (Trace Price)
### 到價通知・歷史價格趨勢  
### 因為 momo App 的通知太多，無法只針對我關心的商品是否有降價，所以我開發了這個專案。 
### 使用者可以自行設定想追蹤的商品與目標價格，系統會每天自動爬取最新價格，當價格低於設定值時會發送通知，並同時保留歷史價格走勢以供查看。
---

## ✨ 功能特色

- **會員系統**
  - 註冊 / 登入（JWT 驗證）
  - 個人追蹤清單管理
- **價格追蹤**
  - 輸入商品網址，自動爬取商品名稱、圖片與價格
  - 設定目標價，到價自動通知（整合 n8n Webhook）
  - 商品歷史價格趨勢紀錄
- **自動化**
  - `node-cron` 每日定時爬取最新價格
  - 自動寫入 MongoDB 並檢查是否觸發通知
- **前端介面**
  - React + TailwindCSS 開發
  - 登入 / 註冊頁面
  - Dashboard 管理商品追蹤清單
---
## 🛠️ 技術架構

### 前端 (React + TypeScript)
- React (TypeScript)
- React Hook Form
- React Router
- TailwindCSS
---
### 後端 (Node.js + Express)
- Node.js + Express
- MongoDB + Mongoose
- node-cron (排程任務)
- JWT + bcrypt (身份驗證與加密)
- n8n Webhook (爬蟲 + gmail通知)

---

## ⚙️ 安裝與執行

### 1. Clone 專案
```bash
git clone https://github.com/your-username/trace-price.git
cd trace-price
```

### 2. 安裝依賴
前端：
```bash
cd client
npm install
```

後端：
```bash
cd backend
npm install
```

### 3. 環境變數設定
建立 `.env` 檔案：

```env
PORT=3001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/trace-price
JWT_SECRET=your_jwt_secret

```

### 4. 啟動專案
後端：
```bash
cd backend
npm run start
```

前端：
```bash
cd client
npm run dev
```
### 5. docker
- Docker Desktop
- n8nio/n8n:latest
- 建立一個 Container，設定以下參數：
  - Port 映射：5678:5678
  - 環境變數：
  - GENERIC_TIMEZONE=Asia/Taipei
  - N8N_BASIC_AUTH_ACTIVE=true
  - N8N_BASIC_AUTH_USER=admin
  - N8N_BASIC_AUTH_PASSWORD=admin123
  - Volume（選填）：掛載本地資料夾到 /home/node/.n8n 保存 workflow 設定
- 啟動容器後，打開 http://localhost:5678，使用上一步設定的帳號密碼登入 n8n。
- 進入 Workflows → Import from File，

### 6. 開發測試
- 註冊帳號並登入
- 在 Dashboard 輸入商品網址，新增追蹤
- 爬蟲會自動擷取商品資訊，並每日更新價格
---
