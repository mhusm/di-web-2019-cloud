const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const nconf = require('nconf');
const Multer = require('multer');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const format = require('util').format;

require('dotenv').config();

// Instantiate a storage client
const storage = new Storage();


// Read in keys and secrets. Using nconf use can set secrets via
// environment variables, command-line arguments, or a keys.json file.
nconf.argv().env().file('keys.json')

const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const db = nconf.get('mongoDB');
const cluster = nconf.get('mongoCluster');

const oldUri = `mongodb://${user}:${pass}@cluster0-shard-00-00-m48bu.gcp.mongodb.net:27017,cluster0-shard-00-01-m48bu.gcp.mongodb.net:27017,cluster0-shard-00-02-m48bu.gcp.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`
const uri = `mongodb+srv://${user}:${pass}@${cluster}/${db}?retryWrites=true`;
const client = new MongoClient(oldUri, { useNewUrlParser: false });
client.connect(err => {
    console.log("mongodb error");
    console.log(err);
    if (err) {
        throw err;
    }

    /*
    const collection = client.db(db).collection("photos");
    // perform actions on the collection object
    let photo = { name: "image.jgp", date: new Date()};
    collection.insertOne(photo, (err, result) => {
      if (err) {
        throw err;
      }
      console.log(result);
    } );
  
    */
    //  client.close();
    // serve the index.html as starting page
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname, "dist", "index.html"))
    });

    // serve all files in dist
    app.use(express.static('dist'));


    // A bucket is a container for objects (files).
    const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

    app.use(bodyParser.json());
    // Multer is required to process file uploads and make them available via
    // req.files.
    const multer = Multer({
        storage: Multer.memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024, // no larger than 5mb, you can change as needed.
        },
    });

    app.post('/uploads', multer.single('file'), (req, res, next) => {
        console.log("uploading");
        if (!req.file) {
            console.log("no file");
            res.status(400).send('No file uploaded.');
            return;
        }

        console.log(req.file.originalname);

        // Create a new blob in the bucket and upload the file data.
        const blob = bucket.file(req.file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on('error', err => {
            console.log(err);
            next(err);
        });

        blobStream.on('finish', () => {
            // The public URL can be used to directly access the file via HTTP.
            const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
            res.status(200).send(publicUrl);

            // Add to MongoDB
            const collection = client.db(db).collection("photos");
            // perform actions on the collection object
            let photo = {
                name: blob.name,
                date: new Date(),
                url: publicUrl
            };
            collection.insertOne(photo, (err, result) => {
                if (err) {
                    throw err;
                }
            });

        });

        blobStream.end(req.file.buffer);

    });

});




http.listen(process.env.PORT || 8080, function () {
    console.log(`listening on *: ${http.address().port}`);
});