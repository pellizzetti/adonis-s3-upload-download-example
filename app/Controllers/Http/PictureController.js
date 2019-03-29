'use strict';

const Drive = use('Drive');
const Helpers = use('Helpers');

const fs = require('fs');
const mkdirp = require('mkdirp');
const { Readable } = require('stream');

class PictureController {
  /**
   * Save a Readable stream to local disk.
   * @private
   * @param {Readable} file - Readable stream that will be saved.
   * @param {string} pathname - Pathname in the disk.
   * @return {Promise} If successful returns a WritableStream.
   */
  _saveStreamToFile(file, pathname) {
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(pathname);

      file.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  /**
   * Return if a file exists in bucket and his formatted url.
   * @public
   * @param {string} params.filename - Filename to be queried.
   * @route {GET} /picture/:filename
   * @return {{ exists: boolean, fileUrl: string }} Status object
   */
  async show({ params }) {
    const folder = 'uploads';
    const { filename } = params;

    const [exists, fileUrl] = await Promise.all([
      Drive.exists(`${folder}/${filename}`),
      Drive.getUrl(`${folder}/${filename}`),
    ]);

    return { exists, fileUrl };
  }

  /**
   * Get file from bucket and save to local disk.
   * If file doesn't exist return error message.
   * @public
   * @param {string} params.filename - Filename to be queried.
   * @param {function} response.send - Sets the response body for the HTTP request
   * @param {function} response.download - Stream a file to the client as HTTP response.
   * @route {GET} /picture/:filename/download
   * @return {ResponseStream} Pipe stream to the response
   */
  async download({ params, response }) {
    const folder = 'uploads';
    const { filename } = params;
    const path = Helpers.tmpPath(`${folder}/`);

    const [exists, s3Object] = await Promise.all([
      Drive.exists(`${folder}/${filename}`),
      Drive.getObject(`${folder}/${filename}`),
    ]);

    if (!exists) {
      return response.status(404).send({
        error: {
          message: 'File not found.',
        },
      });
    }

    if (!fs.existsSync(path)) {
      mkdirp(path);
    }

    const pathname = `${path}/${filename}`;

    const readableInstanceStream = new Readable({
      read() {
        this.push(s3Object.Body);
        this.push(null);
      },
    });

    await this._saveStreamToFile(readableInstanceStream, pathname);

    return response.download(pathname);
  }

  /**
   * Upload file to bucket.
   * @public
   * @param {function} request.multipart.file - Add a listener to file.
   * @param {function} request.multipart.process - Process files by going over each part of the stream.
   * @route {POST} /picture
   * @return {string} Upload successful message.
   */
  async upload({ request }) {
    const folder = 'uploads';

    request.multipart.file('picture', {}, async file => {
      await Drive.put(`${folder}/${file.clientName}`, file.stream, {
        ACL: 'public-read',
        ContentType: `${file.type}/${file.subtype}`,
      });
    });

    await request.multipart.process();

    return 'File saved to S3.';
  }
}

module.exports = PictureController;
