import {asyncHandler} from '../utils/asyncHandler.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, fullName, password} = req.body

    if(username?.trim() === '' || email?.trim() === '' || fullName?.trim() === '' || password?.trim() === ''){
        res.status(400)
    }

    const existedUser = await User.findOne({
         $or: [{username},{email}]
    })
    if(existedUser){
        res.status(409)
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
   
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        res.status(400)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        res.status(400)
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        res.status(500)
    }

    return res.status(201).json(createdUser)
})

export {registerUser} 