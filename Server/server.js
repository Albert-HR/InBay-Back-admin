const tf = require('@tensorflow/tfjs');
/*require('@tensorflow/tfjs-node');*/
const fs = require('fs')

const { v4: uuidv4 } = require('uuid');

const { Image, createCanvas, loadImage, toBlob } = require('canvas');
const  cocoSsd = require("@tensorflow-models/coco-ssd");

//const storage = require("./firebase");

const express = require("express")
const bodyParser = require("body-parser")
const port = 3000;


const {Storage} = require('@google-cloud/storage');

const admin = require("firebase-admin");
var serviceAccount = require("./inbay-8bcf3-firebase-adminsdk-r0hqv-18a3a3175f.json");

if(admin.apps.length == 0)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://inbay-8bcf3.appspot.com/",
    databaseURL: "https://inbay-8bcf3.firebaseio.com"
  });

const storage = admin.storage().bucket();


const db = admin.firestore();

function filter_predictions(predictions) {
    var i = predictions.length;
    while (i--) {
        if(predictions[i].class != "truck" && 
           predictions[i].class != "bus" && 
           predictions[i].class != "car" &&
           predictions[i].class != "motorcycle" &&
           predictions[i].class != "bicycle") {
            predictions.splice(i, 1);
        } 
    }
}

cocoSsd.load().then( async model => {
	console.log("modelo cargado");
    console.log(model);

	const app = express();

    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
   
    async function estimatePoseOnImage(imageElement) {
        return await model.detect(imageElement);
	}

	app.post("/", (req, res) => {
        var { img } = req.body;
        var { type } = req.body;
        var image = new Image();
        image.onerror = function(param) {console.log(param)}
        //console.log(req.body);
        image.onload = async() => {
            var canvas = createCanvas(image.width, image.height);
            var ctx = canvas.getContext('2d');



            //canvas.width = 720;
            //canvas.height = 480;

            ctx.drawImage(image, 0, 0);

            pred = await estimatePoseOnImage(canvas);
            filter_predictions(pred);
            res.send(JSON.stringify(pred));

            if(pred.length) {
                await changeCamera();
                await changeCamera();
            }

            ctx.beginPath();
            ctx.font = 'bold 45pt DejaVu Sans';
            for(const ob of pred){
                //Boundingbox
                ctx.rect(ob.bbox[0], ob.bbox[1], ob.bbox[2], ob.bbox[3]);
                ctx.lineWidth = "4";
                ctx.strokeStyle = "#EF6C00";
                //text box
                ctx.fillStyle = "#EF6C00";
                let txtw = ctx.measureText(ob.class).width
                ctx.fillRect(ob.bbox[0] - 2, ob.bbox[1]  - 40, txtw + 6, 40);
                //text
                ctx.fillStyle = "#00314e";
                ctx.fillText(ob.class, ob.bbox[0] + 1, ob.bbox[1] - 3)
            }
            ctx.stroke();

            const buffer = canvas.toBuffer(`image/${type}`)
            fs.writeFileSync(`./image.${type}`, buffer)

            uploadFile(`./image.${type}`,type);
        }
        image.src = `data:image/${type};base64,` + img;
	});

	app.listen(port, () => {
			console.log("coco server running in port: 3000");
	});
});

const changeCamera = async() => {
    await db.collection('Camaras')
    .get('4xIcMnNnNARqaCPHCZBz')
    .then((snapshot) => {
        for(o of snapshot.docs) {
            o.ref.update({
                'detectCamera': !o.data().detectCamera
            });
        }
    }); 
}


const uploadFile = async(image, type) => {

    // Uploads a local file to the bucket
    await storage.upload(image, {
        destination: `Images/img.${type}`,
        metadatos : { 
            metadatos : { 
                contentType: `image/${type}`,
                firebaseStorageDownloadTokens : uuidv4 ( )
           },
        }
    });

}