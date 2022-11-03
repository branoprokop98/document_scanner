let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

(async () => {
    inputElement.addEventListener('change', (e) => {
        imgElement.src = URL.createObjectURL(e.target.files[0]);
    }, false);

    imgElement.onload = function () {
        let src = cv.imread(imgElement);
        let cornerImg = src.clone()

        let blur = blurImage(src);
        let morph = morphology(blur);
        let contours = findContours(morph, src);
        let biggestContour = findBiggestContour(contours)
        let {corner1, corner2, corner3, corner4} = drawCorners(biggestContour, cornerImg);
        let {tl, tr, bl, br, theWidth, theHeight} = getFinalDimenstions(corner1, corner2, corner3, corner4);
        let finalDest = warpPerspective(theWidth, theHeight, tl, tr, br, bl, src);


        // let enh = new cv.Mat();
        // let gray = new cv.Mat();
        // let tresh = new cv.Mat();
        // let dsize = new cv.Size(200, 200);
        // cv.resize(dst, enh, dsize, 0, 0, cv.INTER_CUBIC);
        // cv.cvtColor(enh, gray, cv.COLOR_RGBA2GRAY, 0);
        // cv.threshold(gray, tresh, 300, 400, cv.THRESH_BINARY);
        cv.imshow('warpedPerspective', finalDest);
        console.log(theWidth, theHeight, birthNumBorders.length)
        textRecognition(theWidth, theHeight, finalDest)

        blur.delete()
        morph.delete()
        contours.delete()
        // finalDest.delete()
        // let dst = new cv.Mat();
        // let x1 = (62.75 * theWidth) / 100
        // let y1 = (30.24 * theHeight) / 100
        // let x2 = (20.02 * theWidth) / 100
        // let y2 = (4.72 * theHeight) / 100
        // let rect = new cv.Rect(x1, y1, x2, y2);
        // dst = finalDest.roi(rect);
        // cv.imshow('birthNumber', dst)
    };

    function blurImage(src) {
        let blur = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        let grayscale = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);

        cv.cvtColor(src, grayscale, cv.COLOR_RGBA2GRAY)
        let ksize = new cv.Size(5, 5);
        cv.GaussianBlur(grayscale, blur, ksize, 0, 0, cv.BORDER_REPLICATE);

        grayscale.delete()
        return blur
    }

    function morphology(blur) {
        let morph = new cv.Mat();
        let erosionM = cv.Mat.ones(20, 20, cv.CV_8U);
        cv.morphologyEx(blur, morph, cv.MORPH_CLOSE, erosionM);
        erosionM.delete()
        return morph;
    }

    function findContours(morph, src) {
        let canny = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        let contourImg = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        let contoursColor = new cv.Scalar(0, 255, 255);

        cv.Canny(morph, canny, 25, 25, 3, false);
        cv.findContours(canny, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
        cv.drawContours(contourImg, contours, -1, contoursColor, 1)

        canny.delete()
        hierarchy.delete()
        contourImg.delete()

        return contours;
    }

    function drawCorners(biggestContour2, cornerImg) {
        let contoursColor = new cv.Scalar(0, 255, 255);
        let corner1 = new cv.Point(biggestContour2.biggest.data32S[0], biggestContour2.biggest.data32S[1]);
        let corner2 = new cv.Point(biggestContour2.biggest.data32S[2], biggestContour2.biggest.data32S[3]);
        let corner3 = new cv.Point(biggestContour2.biggest.data32S[4], biggestContour2.biggest.data32S[5]);
        let corner4 = new cv.Point(biggestContour2.biggest.data32S[6], biggestContour2.biggest.data32S[7]);

        cv.circle(cornerImg, corner1, 3, contoursColor, -1)
        cv.circle(cornerImg, corner2, 3, contoursColor, -1)
        cv.circle(cornerImg, corner3, 3, contoursColor, -1)
        cv.circle(cornerImg, corner4, 3, contoursColor, -1)

        return {corner1, corner2, corner3, corner4};
    }

    function getFinalDimenstions(corner1, corner2, corner3, corner4) {
        let cornerArray = [{corner: corner1}, {corner: corner2}, {corner: corner3}, {corner: corner4}];
        cornerArray.sort((item1, item2) => {
            return (item1.corner.y < item2.corner.y) ? -1 : (item1.corner.y > item2.corner.y) ? 1 : 0;
        }).slice(0, 5);

        let tl = cornerArray[0].corner.x < cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
        let tr = cornerArray[0].corner.x > cornerArray[1].corner.x ? cornerArray[0] : cornerArray[1];
        let bl = cornerArray[2].corner.x < cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];
        let br = cornerArray[2].corner.x > cornerArray[3].corner.x ? cornerArray[2] : cornerArray[3];

        let widthBottom = Math.hypot(br.corner.x - bl.corner.x, br.corner.y - bl.corner.y);
        let widthTop = Math.hypot(tr.corner.x - tl.corner.x, tr.corner.y - tl.corner.y);
        let theWidth = (widthBottom > widthTop) ? widthBottom : widthTop;
        let heightRight = Math.hypot(tr.corner.x - br.corner.x, tr.corner.y - br.corner.y);
        let heightLeft = Math.hypot(tl.corner.x - bl.corner.x, tl.corner.y - bl.corner.y);
        let theHeight = (heightRight > heightLeft) ? heightRight : heightLeft;
        return {tl, tr, bl, br, theWidth, theHeight};
    }

    function warpPerspective(theWidth, theHeight, tl, tr, br, bl, src) {
        let finalDest = new cv.Mat()
        let finalDestCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, theWidth - 1, 0, theWidth - 1, theHeight - 1, 0, theHeight - 1]); //
        let srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.corner.x, tl.corner.y, tr.corner.x, tr.corner.y, br.corner.x, br.corner.y, bl.corner.x, bl.corner.y]);
        let dsize = new cv.Size(theWidth, theHeight);
        let M = cv.getPerspectiveTransform(srcCoords, finalDestCoords)
        cv.warpPerspective(src, finalDest, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        finalDestCoords.delete()
        srcCoords.delete()
        M.delete()
        return finalDest;
    }

    function findBiggestContour(contours) {
        let biggest = new cv.MatVector();
        let max_area = -1
        for (let i = 0; i < contours.size(); i++) {
            let tmp = new cv.Mat();
            let area = cv.contourArea(contours.get(i))
            if (area > 2000) {
                let cnt = contours.get(i);
                let perimeter = cv.arcLength(cnt, true);
                cv.approxPolyDP(cnt, tmp, 0.05 * perimeter, true)
                if (area > max_area && tmp.rows === 4) {
                    biggest = tmp
                    max_area = area
                }
            }
        }
        return {"biggest": biggest, "area": max_area}
    }

    function textRecognition(theWidth, theHeight, finalDest) {
        let birthNumImage = document.getElementById("birthNumber")

        const worker = Tesseract.createWorker();
        const rectangles = [];

        birthNumBorders.forEach(border => {
            let x1 = (border.left * theWidth) / 100
            let y1 = (border.top * theHeight) / 100
            let x2 = (border.width * theWidth) / 100
            let y2 = (border.height * theHeight) / 100
            rectangles.push({left: x1, top: y1, width: x2, height: y2})
        });

        (async () => {
            await worker.load();
            await worker.loadLanguage('slk');
            await worker.initialize('slk');
            const values = [];
            for (let i = 0; i < rectangles.length; i++) {
                let rect = new cv.Rect(
                    rectangles[i].left,
                    rectangles[i].top,
                    rectangles[i].width,
                    rectangles[i].height);
                let dst = new cv.Mat();
                dst = finalDest.roi(rect);
                cv.imshow('birthNumber', dst)
                dst.delete()
                const {data: {text}} = await worker.recognize(birthNumImage);
                values.push(text);
            }
            console.log(values);
            values.forEach(string => {
                const found = string.match(/[0-9]{6}\/[0-9]{3,4}/g);
                if (typeof found != "undefined" && found != null && found.length != null
                    && found.length > 0) {
                    console.log(found[0])
                }
            })
            await worker.terminate();
        })();
    }
})();

