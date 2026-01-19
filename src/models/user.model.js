import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
     },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName:{
        type: String,
        required: true,
        index: true
    },
    avatar:{
        type: String
    },
    coverImage:{
        type: String
    },
    password:{
        type: String,
        unique: true,
        trim: true,
        required: true,
        min: 3,
        max: 10
    },
    refreshToken:{
        type: String,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    
},{
    timestamps: true
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next()
    this.password = bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPassowrdCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


export const User = mongoose.model('User', userSchema)