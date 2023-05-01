const express = require("express")
const path = require("path");
const cors = require('cors');
const fs = require('fs');
const dcmjs = require('dcmjs')
const dcmjsDimse = require('dcmjs-dimse');
const {Client} = dcmjsDimse;
const {CStoreRequest} = dcmjsDimse.requests;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*'
}));

// Setting path for public directory
const static_path = path.join(__dirname, "../");
app.use(express.static(static_path));
app.use(express.urlencoded({extended: true}));
app.use(express.text({limit: '200mb'}));
app.use(express.json({limit: '200mb'}));


app.get('/', function (req, res) {
    let reqPath = path.join(__dirname, '../');
    res.sendFile(reqPath + '/index.html');
});

// Handling request
app.post("/request", async (req, res) => {
    const data = req.body.image
    const rows = req.body.rows;
    const cols = req.body.cols;
    const birthNumber = req.body.birth;
    const name = req.body.name;
    const filename = req.body.filename;

    let buffer = saveImageToDicomBuffer(data, rows, cols, birthNumber, name)

    saveToFileAndSend(filename, buffer, function (error) {
        if(error) {
            res.status(500).send(error)
        } else {
            res.status(200).send()
        }
    });
})

// Server Setup
app.listen(port, () => {
    console.log(`server is running at ${port}`);
});


const jsonDataset = `{
    "BitsAllocated": 16,
    "BitsStored": 16,
    "Columns": 256,
    "HighBit": 15,
    "PhotometricInterpretation": "MONOCHROME2",
    "PixelRepresentation": 1,
    "SpecificCharacterSet": "ISO_IR 192",
    "Rows": 256,
    "SamplesPerPixel": 1,
    "ConversionType": "DF",
    "Modality": "OT",
    "SeriesInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.1670863918.783",
    "PlanarConfiguration": 0,
    "SOPClassUID": "1.2.840.10008.5.1.4.1.1.7",
    "SOPInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.",
    "DerivationDescription" : "Lossless JPEG compression, selection value 1, point transform 0, compression ratio 1.4799",
    "PatientName": "Brano Prokop",
    "PatientID": "980827/6368",
    "PatientBirthDate": "19980827",
    "SeriesInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.",
    "StudyInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.",
    "StudyID": "1",
    "SeriesNumber": "1",
    "InstanceNumber": "1",
    "PatientOrientation": "",
    "Laterality": "L",
    "AccessionNumber": "",
    "StudyTime": "175158",
    "StudyDate": "20221212",
    "PatientSex": "O",
    "ReferringPhysicianName": "DICOM Web application diploma",
    "_meta": {
        "FileMetaInformationVersion": {
            "Value": [
                {
                    "0": 0,
                    "1": 1
                }
            ],
            "vr": "OB"
        },
        "ImplementationClassUID": {
            "Value": [
                "1.2.276.0.7230010.3.0.3.6.6"
            ],
            "vr": "UI"
        },
        "ImplementationVersionName": {
            "Value": [
                "1.0.0"
            ],
            "vr": "SH"
        }
    },
    "_vrMap": {
        "PixelData": "OW"
    }
}`;

function getDate(date_ob) {
    let day = date_ob.getDate()
    let month = date_ob.getMonth() + 1
    let year = date_ob.getFullYear()

    if (month < 10) {
        month = "0" + month
    }

    if (day < 10) {
        day = "0" + day
    }

    return year + "" + month + "" + day
}

function getTime(date_ob) {
    let hours = date_ob.getHours()
    let minutes = date_ob.getMinutes()
    let seconds = date_ob.getSeconds()

    if (hours < 10) {
        hours = "0" + hours
    }

    if (minutes < 10) {
        minutes = "0" + minutes
    }

    if (seconds < 10) {
        seconds = "0" + seconds
    }

    return hours + "" + minutes + "" + seconds
}

function extractBirthDate(birthNumber) {
    let birth = birthNumber.split("/")[0].toString()
    let actualYearString = new Date().getFullYear().toString();
    let year = birth.slice(0, 2)
    let actualYear = actualYearString.slice(-2)

    if (year <= 99 && year > actualYear) {
        return "19" + birth
    } else {
        return "20" + birth
    }
}


function saveToFileAndSend(filename, buffer, callback) {
    fs.writeFile("../files/" + filename + '.dcm', buffer, err => {
        if (err) {
            console.error(err);
        }
        // file written successfully
        sendFileToPacs(filename, function (error) {
            callback(error)
        });
    });
}

function saveImageToDicomBuffer(data, rows, cols, birthNumber, patientName) {
    let pixelArray = new Uint8ClampedArray(Object.values(data));
    let array = removeFourthValues(pixelArray);

// Get the raw pixel data for the image
    const pixelData = array.buffer;

    let date_ob = new Date();
    let date = getDate(date_ob);
    let time = getTime(date_ob);

    let birthDate = extractBirthDate(birthNumber)

    const dataset = JSON.parse(jsonDataset);

    dataset.PhotometricInterpretation = 'RGB'
    dataset.PixelRepresentation = 0
    dataset.SamplesPerPixel = 3
    dataset.PlanarConfiguration = 0
    dataset.BitsAllocated = 8
    dataset.BitsStored = 8
    dataset.HighBit = 7
    dataset.Rows = rows
    dataset.Columns = cols
    dataset.PatientName = patientName
    dataset.PatientID = birthNumber
    dataset.StudyTime = time
    dataset.StudyDate = date
    dataset.PatientBirthDate = birthDate
    dataset.StudyInstanceUID = dataset.StudyInstanceUID + Date.now() + "." + Math.floor(Math.random() * 999);
    dataset.SOPInstanceUID = dataset.SOPInstanceUID + Date.now() + "." + Math.floor(Math.random() * 999);
    dataset.SeriesInstanceUID = dataset.SeriesInstanceUID + Date.now() + "." + Math.floor(Math.random() * 999);

    dataset.PixelData = pixelData;

    const dicomDict = dcmjs.data.datasetToDict(dataset);
    return Buffer.from(dicomDict.write());
}

function sendFileToPacs(filename, callback) {
    const client = new Client();
    const request = new CStoreRequest("../files/" + filename + '.dcm');
    client.addRequest(request);
    client.on('networkError', (e) => {
        console.log('Network error: ', e);
        callback(e)
    });
    request.on('response', (response) => {
        console.log("Response")
        callback(null)
    });
    client.send('127.0.0.1', 104, 'SCU', 'ANY-SCP');
}


function removeFourthValues(array) {
    return new Uint8ClampedArray(array.filter((value, index) => (index + 1) % 4 !== 0));
}

