import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()
dotenv.config()

app.use(cors({origin: process.env.CORS_ORIGIN}))
app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.static('public'))

import userRouter from './routes/user.route.js'

app.use('/api/v1/users', userRouter)

app.listen(process.env.PORT, () =>{
    console.log(`server is running on PORT: ${process.env.PORT}`)
})

export {app}