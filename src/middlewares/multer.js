import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public"));
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + fileName);
  }
});

export const upload = multer({ storage });
