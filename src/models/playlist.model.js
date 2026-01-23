import mongoose, {Schema} from "mongoose";

const playlistSchema = new Schema({
   name:{
    type: String,
    required: true,
   },
   description:{
    type: String,
    required:  true,
   },
   video:{
    type: Schema.Types.ObjectId,
    ref: "Video"
   },
   owner:{
    type: Schema.Types.ObjectId,
    ref: "Owner"
   }
},{
    timestamps: true
})

export default Playlist = mongoose.model("Playlist", playlistSchema)