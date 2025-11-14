const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing file upload:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // Get file extension
    const extname = path.extname(file.originalname).toLowerCase();
    console.log('File extension:', extname);

    // Check MIME type first (more reliable than extension)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const isMimeTypeValid = allowedMimeTypes.some(type => file.mimetype.startsWith('image/'));
    
    // If MIME type is valid but extension is missing, add it based on MIME type
    let finalExtname = extname;
    if (isMimeTypeValid && !extname) {
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif'
      };
      finalExtname = mimeToExt[file.mimetype] || '';
      console.log('Added missing extension based on MIME type:', finalExtname);
      
      // Update the originalname to include the extension
      file.originalname += finalExtname;
    }

    // Check extension if present
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const isExtensionValid = !finalExtname || allowedExtensions.includes(finalExtname);
    
    console.log('Validation results:', {
      isExtensionValid,
      isMimeTypeValid,
      fileMimetype: file.mimetype,
      finalExtname,
      updatedOriginalName: file.originalname
    });

    if (isMimeTypeValid && isExtensionValid) {
      return cb(null, true);
    } else {
      const error = new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} images are allowed.`);
      error.code = 'LIMIT_FILE_TYPE';
      return cb(error, false);
    }
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_TYPE') {
      return res.status(400).json({ 
        error: 'Invalid file type',
        details: 'Only JPG, JPEG, PNG, and GIF images are allowed.'
      });
    }
  } else if (err) {
    // An unknown error occurred
    console.error('File upload error:', err);
    return res.status(500).json({ 
      error: 'File upload failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // No errors, proceed to next middleware
  next();
};

module.exports = { 
  upload: upload, 
  handleUploadError: handleUploadError 
};
