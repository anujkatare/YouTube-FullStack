import dotenv from 'dotenv'
import connectDB from './db/index.js'
dotenv.config()

connectDB()
.then(() => {
app.on('error', (error) =>{
    console.error('ERROR:',error)
    throw error
})

    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running on PORT: ${process.env.PORT}`)

    })
})
.catch((error) => {
    console.error('error in connecting to DB , check your src/index.js', error)
})