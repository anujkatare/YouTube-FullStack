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

app.get('/',(req, res) => {
    res.send('hey')
})

app.listen(PORT, () =>{
    console.log(`server is running on PORT: ${PORT}`)
})