

const mongoose = require('mongoose');
mongoose.set('strictQuery',false);


const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected : ${conn.connection.host}`);
    }catch(error){
        console.log(error);
    }
}
module.exports = connectDB;




//create mongodb atlas , and create accnt that time you will create env (also npm i)that means env file file have another details so that time u need to save,and config file also, DB connect in app.js also that file require ,also dot env i and declire, then mongo atlas network access to make to sure access to every one