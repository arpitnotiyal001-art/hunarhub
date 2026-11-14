const cloudinary = require('../config/cloudinary');

exports.uploadBuffer = (buffer, folder = 'hunarhub') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
    );
    stream.end(buffer);
  });

exports.deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);