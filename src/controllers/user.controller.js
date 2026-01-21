import {asyncHandler} from '../utils/asyncHandler.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, fullName, password} = req.body
    console.log(username)

    if(username?.trim() === '' || email?.trim() === '' || fullName?.trim() === '' || password?.trim() === ''){
        res.status(400)
        throw new Error('Username is required')
        
    }

    const existedUser = User.findOne({
         $or: [{username},{email}]
    })
    if(existedUser){
        res.status(409)
        throw new Error('Username or email already exist.')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        req.status(400)
        throw new Error('Avatar is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        res.status(400)
        throw new Error('Avatar is required')
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        res.status(500)
        throw new Error("Something went wrong while registering the user")
    }

    return res.status(201).json(createdUser, 'User is registered successfully')
})

export {registerUser} 