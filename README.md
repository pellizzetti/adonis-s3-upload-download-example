# adonis-s3-upload-example

Simple example of a file upload routine using **AdonisJS**

## Getting started

Install dependencies:

```sh
npm install
# OR
# yarn
```

Run the application:

```
adonis serve --dev
```

## Routes
```
GET  '/picture/:filename'          => 'PictureController.show'
GET  '/picture/:filename/download' => 'PictureController.download'
POST '/picture'                    => 'PictureController.upload'
```

### Methods

> app/Controllers/Http/PictureController.js

#### show()

Return if a file exists in bucket and his formatted url.

##### Parameters

| Name            | Type     | Description             |
| --------------- | -------- | ----------------------- |
| params.filename | `string` | Filename to be queried. |

##### Returns

- `{ exists: boolean, fileUrl: string }` Status object

#### download()

Get file from bucket and save to local disk.
If file doesn't exist return error message.

##### Parameters

| Name              | Type       | Description                                   |
| ----------------- | ---------- | --------------------------------------------- |
| params.filename   | `string`   | Filename to be queried.                       |
| response.send     | `function` | Sets the response body for the HTTP request   |
| response.download | `function` | Stream a file to the client as HTTP response. |

##### Returns

- `ResponseStream` Pipe stream to the response

#### upload()

Upload file to bucket.

##### Parameters

| Name                      | Type       | Description                                          |
| ------------------------- | ---------- | ---------------------------------------------------- |
| request.multipart.file    | `function` | Add a listener to file.                              |
| request.multipart.process | `function` | Process files by going over each part of the stream. |

##### Returns

- `string` Upload successful message.
