const express = require("express")
const path = require("path");
const cors = require('cors');
const fs = require('fs');
const dcmjs = require('dcmjs')
const canvasNode = require('canvas');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*'
}));

// Setting path for public directory
const static_path = path.join(__dirname, "../");
app.use(express.static(static_path));
app.use(express.text({limit: '200mb'}));
app.use(express.json({limit: '200mb'}));


app.get('/', function (req, res) {
    let reqPath = path.join(__dirname, '../');
    res.sendFile(reqPath + '/index.html');
});

// Handling request
app.post("/request", (req, res) => {
    const data = req.body.image
    const rows = req.body.rows;
    const cols = req.body.cols;
    const birthNumber = req.body.birth;
    const name = req.body.name;
    saveImageToDicom(data, rows, cols, birthNumber, name)
    res.json([{
        name_recieved: "OK"
    }])
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
    "SOPInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.1670863918.781",
    "DerivationDescription" : "Lossless JPEG compression, selection value 1, point transform 0, compression ratio 1.4799",
    "PatientName": "Brano Prokop",
    "PatientID": "980827/6368",
    "PatientBirthDate": "19980827",
    "SeriesInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.1670863918.783",
    "StudyInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.1670863918.782",
    "SeriesInstanceUID": "1.2.276.0.7230010.3.1.4.3911126723.5164.1670863918.783",
    "StudyID": "1",
    "SeriesNumber": "1",
    "InstanceNumber": "1",
    "PatientOrientation": "",
    "Laterality": "L",
    "AccessionNumber": "",
    "StudyTime": "175158",
    "StudyDate": "20221212",
    "PatientSex": "M",
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

function saveImageToDicom(data, rows, cols, birthNumber, patientName) {
    let pixelArray = new Uint8ClampedArray(Object.values(data));
    let array = removeFourthValues(pixelArray);

// Get the raw pixel data for the image
    const pixelData = array.buffer;

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

    dataset.PixelData = pixelData;


    const dicomDict = dcmjs.data.datasetToDict(dataset);
    const buffer = Buffer.from(dicomDict.write());

    fs.writeFile('dicom.dcm', buffer, err => {
        if (err) {
            console.error(err);
        }
        // file written successfully
    });
}


function removeFourthValues(array) {
    return new Uint8ClampedArray(array.filter((value, index) => (index + 1) % 4 !== 0));
}

