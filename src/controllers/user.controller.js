import {asyncHandler} from '../utils/asyncHandler.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'
import { error } from 'console'
import { subscribe } from 'diagnostics_channel'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw error;
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
    res.status(404)
    console.error('Username or email required')
   }

    const user = await User.findOne({
    $or: [{username}, {email}]
   })

   if(!user){
    res.status(404)
    throw new Error("User not found");
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
    secure: false,  
    sameSite: "lax"
   }
    
   return res
   .status(200)
   .cookie('accessToken', accessToken, options)
   .cookie("refreshToken", refreshToken, options)
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
    secure: false,
    sameSite: "lax"
   }



   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json("User logged out")

})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        res.status(401)
        throw error('Invalid Refresh Token')
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            res.status(401)
            throw error('Invalid Refresh Token')
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            res.status(401)
            throw error('Refresh Token is expired or used')
        }
    
        const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
       }
    
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json({accessToken, refreshToken: newRefreshToken})
    } catch (error) {
        throw error("Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
     const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.body?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw error("Password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json("Password Successfully changed")

})

const getCurrentUser = asyncHandler( async (req, res) => {
       return res
       .status(200)
       .json(req.user)
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullName, email, } = req.body

    if(!fullName || !email){
        throw error("All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.body?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(user)
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.files?.path

    if(!avatarLocalPath){
      throw error("Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
       throw error("Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
          $set: {
            avatar: avatar.url
          }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(user)
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.files?.path

    if(!coverImageLocalPath){
      throw error("Cover image file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
       throw error("Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
          $set: {
            coverImage: coverImage.url
          }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(user)
}) 

const getUserChannelProfile  = asyncHandler( async (req, res) => {
      const {username} = req.params

      if(!username?.trim()){
        throw error("username is missing")
      }

    const channel = await User.aggregate([
        {
            $match:{
               username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
      ])

      if(!channel?.length){
           throw error("channel does not exist")
      }

      return res
      .status(200)
      .json(channel[0])
}) 

export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile } 