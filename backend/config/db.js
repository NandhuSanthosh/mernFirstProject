const mongoose =  require('mongoose')
const dotenv = require('dotenv')
dotenv.config()
const connectDB = async() => {
    try{
        console.log(process.env.PORT)
        mongoose.set("strictQuery", false);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,   
        })
        console.log(`Mongodb connected: ${conn.connection.host}`.cyan.underline);
    }catch (error){
        console.log(`Error: ${error.message}`.red.bold)
        process.exit();
    }
}

module.exports = connectDB