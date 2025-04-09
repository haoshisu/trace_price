import mongooseDB from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const password = process.env.MONGODB_PASSWORD 
const account = process.env.MONGODB_ACCOUNT

const uri = `mongodb+srv://haoshisu0614:${password}@cluster0.o5zlror.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
mongooseDB.connect(uri).then(() => console.log("連接成功")).catch(() => console.log("連接失敗"))

export default mongooseDB