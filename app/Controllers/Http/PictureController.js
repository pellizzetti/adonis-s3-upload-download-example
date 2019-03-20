'use strict';

const Drive = use('Drive');

class PictureController {
  async show({ params }) {
    const folder = 'uploads';
    const { filename } = params;

    const [exists, fileUrl] = await Promise.all([
      Drive.exists(`${folder}/${filename}`),
      Drive.getUrl(`${folder}/${filename}`),
    ]);

    return { exists, fileUrl };
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
