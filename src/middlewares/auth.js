import { asyncHandler } from "../utils/asyncHandler.js"
import JWT from 'jsonwebtoken'
import {User} from "../models/user.model.js"


const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const Token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            res.status(401)
            console.error("Unauthorized request")
        }
    
        const decodedToken = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User
        .findById(decodedToken?._id)
        .select("-password -refreshToken")
    
        if(!user){
            res.status(401)
            console.log("Invalid Access Token")
        }
    
        req.user = user
        next()
    } catch (error) {
        res.status(401)
        console.error("Error (Invalid Acess Token):", error)
    }
})

export default verifyJWT