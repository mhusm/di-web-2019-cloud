const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const nconf = require('nconf');


// Read in keys and secrets. Using nconf use can set secrets via
// environment variables, command-line arguments, or a keys.json file.
nconf.argv().env().file('keys.json')



const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const db = nconf.get('mongoDB');
const cluster = nconf.get('mongoCluster');

const uri = `mongodb+srv://${user}:${pass}@${cluster}/${db}?retryWrites=true`;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
    console.log(err);
  const collection = client.db(db).collection("photos");
  // perform actions on the collection object
  let photo = { name: "image.jgp", date: new Date()};
  collection.insertOne(photo, (err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
  } );

  
  client.close();
});


// serve the index.html as starting page
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "dist", "index.html"))
});

// serve all files in dist
app.use(express.static('dist'));

http.listen(process.env.PORT || 8080, function(){
    console.log(`listening on *: ${http.address().port}`);
});