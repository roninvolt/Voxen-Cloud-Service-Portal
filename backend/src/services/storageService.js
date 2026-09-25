const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

// Base Storage Interface
class BaseStorageService {
  async saveFile(file, storedName) {
    throw new Error('saveFile method must be implemented');
  }

  async getFileStream(storedName) {
    throw new Error('getFileStream method must be implemented');
  }

  async deleteFile(storedName) {
    throw new Error('deleteFile method must be implemented');
  }

  async fileExists(storedName) {
    throw new Error('fileExists method must be implemented');
  }
}

// Local Storage Implementation
class LocalStorageService extends BaseStorageService {
  constructor() {
    super();
    this.uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`Created local uploads directory at ${this.uploadDir}`);
    }
  }

  async saveFile(file, storedName) {
    const targetPath = path.join(this.uploadDir, storedName);

    // If file was already saved by multer diskStorage
    if (file.path && fs.existsSync(file.path) && file.path !== targetPath) {
      await fs.promises.rename(file.path, targetPath);
    } else if (file.buffer) {
      await fs.promises.writeFile(targetPath, file.buffer);
    }

    return {
      storageProvider: 'local',
      storagePath: targetPath,
      storedName,
    };
  }

  async getFileStream(storedName) {
    const filePath = path.join(this.uploadDir, storedName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${storedName}`);
    }
    return fs.createReadStream(filePath);
  }

  async deleteFile(storedName) {
    const filePath = path.join(this.uploadDir, storedName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`Deleted local file: ${storedName}`);
      return true;
    }
    return false;
  }

  async fileExists(storedName) {
    const filePath = path.join(this.uploadDir, storedName);
    return fs.existsSync(filePath);
  }
}

// AWS S3 Storage Implementation
class S3StorageService extends BaseStorageService {
  constructor() {
    super();
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET;
    
    if (!this.bucket) {
      logger.warn('AWS_S3_BUCKET is not set. S3 storage may fail if called.');
    }

    const s3Config = {
      region: this.region,
    };

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    this.s3Client = new S3Client(s3Config);
  }

  async saveFile(file, storedName) {
    let body;
    if (file.buffer) {
      body = file.buffer;
    } else if (file.path) {
      body = fs.createReadStream(file.path);
    } else {
      throw new Error('Invalid file data for S3 upload');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storedName,
      Body: body,
      ContentType: file.mimetype || 'application/octet-stream',
    });

    await this.s3Client.send(command);

    // If local temporary file exists from multer, remove it
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        logger.warn('Could not clean up temporary upload file:', err.message);
      }
    }

    return {
      storageProvider: 's3',
      storagePath: `s3://${this.bucket}/${storedName}`,
      storedName,
    };
  }

  async getFileStream(storedName) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storedName,
    });

    const response = await this.s3Client.send(command);
    return response.Body; // Node.js Readable stream in SDK v3
  }

  async deleteFile(storedName) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storedName,
    });

    await this.s3Client.send(command);
    logger.info(`Deleted S3 file: ${storedName} from bucket ${this.bucket}`);
    return true;
  }

  async fileExists(storedName) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storedName,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
}

// Storage Service Factory
const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
let storageInstance;

if (provider === 's3') {
  logger.info('Initialized AWS S3 Storage Service');
  storageInstance = new S3StorageService();
} else {
  logger.info('Initialized Local Disk Storage Service');
  storageInstance = new LocalStorageService();
}

module.exports = {
  StorageService: storageInstance,
  LocalStorageService,
  S3StorageService,
};
