import {asyncHandler} from '../utils/asyncHandler.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const generateAccessAndRefreshToken = async (uderId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken
        const refreshToken = user.generateRefreshToken

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        res.status(500)
        console.error('something went wrong')
    }
}

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

const loginUser = asyncHandler(async (req, res ) => {
   const {username, email, password} = req.body
   if(!(username || email)){
    req.status(404)
    console.error('Username or email required')
   }

    const user = await User.findOne({
    $or: [{username}, {email}]
   })

   if(!user){
    res.status(404)
    console.error('User not found')
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    res.status(401)
    console.error('Password is incorrect!')
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly: true,
    secure: true
   }
    
   return res
   .status(200)
   .cookie('accessToken', accessToken, options)
   .cookie("reefreshToken", refreshToken, options)
   .json({user: loggedInUser, accessToken, refreshToken})

})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        }
    )
    
    const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json("User logged out")

})

export {registerUser, loginUser, logoutUser} 