import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js'
import dotenv from 'dotenv'
dotenv.config()

const connectDB = async () => {
     try {
      await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
      console.log('DataBase is connected :)')
     } catch (error) {
        console.error('ERROR in connecting to DataBase :(')
        process.exit(1)
     }
}

export default connectDB