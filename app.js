//SI Final Project Face Detection and verification using MS Azure Face API

'use strict';

const express = require("express");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const dotenv = require('dotenv').config();
const PORT = 3000; //declaring and initializing the port on which we will run our api

const options = {
    swaggerDefinition: {
        info: {
            title: 'SI Final project: Face API Detection + Verification',
            version: '1.0.0',
            description: 'This API will give us the information about face from a given persons image. It can perform Face detection and verification of the face.'
        },
        host: '143.198.162.71:3000',
        basePath: '/'
    },
    apis: ['./app.js']
}

const specs = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs)); // to visit the localhost:3000/docs link for performing the API Actions
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

//The below is the valid subscription key and endpoint from our MS Azure account for FACE API
let key = process.env.MY_API_KEY;
let endpoint = "https://projectfaceapi.cognitiveservices.azure.com//face/v1.0/detect";


//code for localhost:3000 url
app.get('/', (request, response) => {
    response.status(200).send("This is not why you're here. Head to the '/docs' link to test the face detection and verification.")
})

//code for detection of faces from the image URL - We are Using POST method here
    
 /**
 * @swagger
 * definitions:
 *   To detect faces in an image:
 *     properties:
 *       Image_URL:
 *         type: string
 *         description: Provide URL of the image in the request portion for detecting the face
 */
/**
 * @swagger
 * /detect:
 *    post:
 *      description: To detect faces in an image
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: The detection was SUCCESSFUL and the output provides us with an array object containing information
 *          400:
 *              description: Please provide valid input
 *          500:
 *              description: Some internal server error
 *      parameters:
 *          - name: Image_URL
 *            description: Please provide URL of the image in the request portion below in place of string
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/To detect faces in an image'
 *
 */
 app.post("/detect", async (req, res, next) => {
    let Image_URL="";
    if(!req.body.Image_URL){
        return res.status(400).json({
            message : "Invalid Input / Request" 
        });

    }else {
        Image_URL= req.body.Image_URL
    }
    console.log(Image_URL);
    
    let result = axios({
        method: 'post',
        url: endpoint,
        params : {
            detectionModel: 'detection_02',
            returnFaceId: true
        },
        data: {
            url: Image_URL,
        },
        headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': key }
    }).then(response => {
    
        console.log(response.data);
        if(response.data.length!=0){
            res.status(200).json(response.data);
        }else {
            res.status(200).json({
                "face": "No face was detected"
            });
        }
    }).catch(error => {
        console.log(error)
        res.status(400).json({
            error
        })
    });
});

//code for verification of two faces from the image URL
/**
 * @swagger
 * definitions:
 *    To detect similarity of faces in two images:
 *     properties:
 *       Image_URL1:
 *         type: string
 *         description: Provide URL of the image 1 in the request portion for comparing it to the iamge 2
 *       Image_URL2:
 *         type: string
 *         description: Provide URL of the image 2 in the request portion for comparing it to the iamge 1
 */
/**
 * @swagger
 * /verify:
 *    post:
 *      description: To detects faces in two images and verify if they are similar or not
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: The detection was SUCCESSFUL and the output provides us with an array object containing information that two faces are Similar or not
 *          400:
 *              description: Please provide valid input
 *          500:
 *              description: Some internal server error
 *      parameters:
 *          - name: Image_URL
 *            description: Please provide URLs of the images in the request portion below in place of string for verification
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/To detect similarity of faces in two images'
 *
 */
app.post("/verify", async (req, res, next) => {
    let Image_URL1 = "";
    let Image_URL2 = "";
    if(!req.body.Image_URL1 || !req.body.Image_URL2){
        return res.status(400).json({
            message : "Bad Request or invalid request"
        })
    }else {
        Image_URL1 = req.body.Image_URL1;
        Image_URL2 =  req.body.Image_URL2
    }

    let faceId1 = "";
    let faceId2 = "";
    let msazureEndpoint = "https://eastus.api.cognitive.microsoft.com/face/v1.0/verify";
    axios({
        method: 'post',
        url: endpoint,
        params : {
            detectionModel: 'detection_02',
            returnFaceId: true
        },
        data: {
            url: Image_URL1,
        },
        headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': key }
    }).then(response => {
        faceId1 = response.data[0].faceId;
        //console.log(response.data);
        //console.log(faceId1);
        axios({
            method: 'post',
            url: endpoint,
            params : {
                detectionModel: 'detection_02',
                returnFaceId: true
            },
            data: {
                url: Image_URL2,
            },
            headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': key }
        }).then(response => {
            faceId2 = response.data[0].faceId;
            // console.log(response.data);
            // console.log(faceId2);
            axios({
                method: 'post',
                url: msazureEndpoint,
                data: {
                    faceId1: faceId1,
                    faceId2: faceId2
                },
                headers: { 'Content-Type': 'application/json','Ocp-Apim-Subscription-Key': key }
            }).then(response => {
                res.status(200).json(response.data);
                
            }).catch(error => {
                res.status(500).json({
                    error
                })
            });
            
        }).catch(error => {
            console.log(error)
            res.status(400).json({
                message : "Bad Request or invalid request"
            })
            
        });
    }).catch(error => {
        console.log(error)
        res.status(400).json({
            message : "Bad Request or invalid request"
        })
    });
});

//starting the server
app.listen(PORT, () => {
    console.log('Server is running at port', PORT);
});
