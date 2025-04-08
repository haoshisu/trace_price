import mongooseDB from "../db.js";


const productSchema = new mongooseDB.Schema({
    url:String,
    name:String,
    imgSrc:String,
    history:[{date:String,price:String}]
})

const Product = mongooseDB.model('Product',productSchema)

export default Product