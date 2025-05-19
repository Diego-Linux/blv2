const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads', 
    format: async (req, file) => file.mimetype.split('/')[1], 
    public_id: (req, file) => file.originalname.split('.')[0], 
  },
});

module.exports = { cloudinary, storage };
