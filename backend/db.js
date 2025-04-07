import mongooseDB from 'mongoose'

const uri = 'mongodb+srv://haoshisu0614:BxiavY7V38qjpid9@cluster0.o5zlror.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
mongooseDB.connect(uri).then(() => console.log("連接成功")).catch(() => console.log("連接失敗"))

export default mongooseDB