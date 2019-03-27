'use strict';

const Drive = use('Drive');
const Helpers = use('Helpers');

const fs = require('fs');
const mkdirp = require('mkdirp');
const { Readable } = require('stream');

class PictureController {
  __createFile(file, pathname) {
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(pathname);

      file.pipe(writer);

      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  async show({ params, response }) {
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

    await this.__createFile(readableInstanceStream, pathname);

    return response.download(pathname);
  }

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
