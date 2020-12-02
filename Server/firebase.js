const admin = require("firebase-admin");
var serviceAccount = require("./inbay-8bcf3-firebase-adminsdk-r0hqv-18a3a3175f.json");

if(admin.apps.length == 0)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://inbay-8bcf3.appspot.com/"
  });

let bucket = admin.storage().bucket();


if(process.env.ENTORNO === "LOCAL") {
  db.settings({
    host: "localhost:8080",
    ssl: false
  });
}

/*let db = admin.firestore();
db.collection('Bahias').get().then( (snapshot) => {
  for(const res of snapshot.docs)
    console.log(res.data());
})*/

module.exports = { bucket };