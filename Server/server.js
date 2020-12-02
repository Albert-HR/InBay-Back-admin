const tf = require('@tensorflow/tfjs');
/*require('@tensorflow/tfjs-node');*/

const { Image, createCanvas, loadImage } = require('canvas');
const  cocoSsd = require("@tensorflow-models/coco-ssd");

const express = require("express")
const bodyParser = require("body-parser")
const port = 3000;

function filter_predictions(predictions) {
    var i = predictions.length;
    while (i--) {
        if(predictions[i].class != "person") {
            predictions.splice(i, 1);
        } 
    }
}

cocoSsd.load().then(model => {
	console.log("modelo cargado");
    console.log(model);

	const app = express();

    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


    //app.use(bodyParser.urlencoded({ extended: false }))

	async function estimatePoseOnImage(imageElement, callback) {
        model.detect(imageElement).then(predictions => {
  		    callback(predictions);
        });
	}

	app.post("/", (req, res) => {
        var { img } = req.body;
        var { type } = req.body;
        var image = new Image();
        image.onerror = function(param) {console.log(param)}
        //console.log(req.body);
        image.onload = function(){
            var canvas = createCanvas(image.width, image.height);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            estimatePoseOnImage(canvas, (pred) => {
                filter_predictions(pred);
                res.send(JSON.stringify(pred));
            });
        }
        image.src = `data:image/${type};base64,` + img;
	});

	app.listen(port, () => {
			console.log("coco server running in port: 3000");
	});
});
