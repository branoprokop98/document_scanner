let current
(async () => {
    let files
    let imgElement = document.getElementById('imageSrc');
    let inputElement = document.getElementById('fileInput');
    let borderBtn = document.getElementById("borderBtn");
    let borderCancelBtn = document.getElementById("borderCancelBtn");
    let birthNumber = document.getElementById("fbirthnumber")
    let patientName = document.getElementById("fname")
    let sizeBtn = document.getElementById("sizeBtn")
    let nextBtn = document.getElementById("next-pic-btn")
    let rotateClockBtn = document.getElementById("rotateClockBtn")
    let rotateCounterClockBtn = document.getElementById("rotateCounterBtn")
    let submitBtn = document.getElementById("submit")

    inputElement.addEventListener('change', (e) => {
        $("#warpedPerspectiveImg").remove();
        $("#imageSrc").attr("src", "");
        current = 0;
        files = e.target.files
        if (!!files[current]) {
            imgElement.src = URL.createObjectURL(files[current]);
            $("#flex-item").css("display", "block")
        }
    }, false);


    imgElement.onload = function () {
        let imageUrl
        let jcpWhole
        let jcp
        let src = cv.imread(imgElement);
        let cornerImg = src.clone()

        function resolveVariables() {
            if (!!jcpWhole) {
                jcpWhole.destroy()
            }
            if (!!jcp) {
                jcp.destroy()
            }
            $("#warpedPerspectiveImg").remove();
            $("#warpedPerspective").attr("src", "");
            $("#controls").css("display", "none");
            $("#fail-detection").css("display", "none");
            updateView(jcpWhole, files)
        }

        function handleClick(callback) {
            callback()
        }
        inputElement.addEventListener('change', (e) => {
            handleClick(resolveVariables)
        })

        if (!!jcpWhole) {
            jcpWhole.destroy()
        }

        let blur = blurImage(src);
        let morph = morphology(blur);
        let contours = findContours(morph, src);
        let biggestContour = findBiggestContour(contours)
        let {corner1, corner2, corner3, corner4} = drawCorners(biggestContour, cornerImg);
        if (!!corner1 && !!corner2 && !!corner3 && !!corner4) {
            let {tl, tr, bl, br, theWidth, theHeight} = getFinalDimensions(corner1, corner2, corner3, corner4);
            let finalDest = warpPerspective(theWidth, theHeight, tl, tr, br, bl, src);

            $("#controls").css("display", "block");
            $("#fail-detection").css("display", "none");
            // sizeBtn.onclick = function () {
            //     let size = $("#fsize").val()
            //     if (!!size) {
            //         resizeResultImage(parseInt(size), finalDest)
            //         cv.imshow("warpedPerspective", finalDest)
            //         let canvas = document.getElementById('warpedPerspective');
            //         let img = document.getElementById('warpedPerspectiveImg');
            //         img.src = canvas.toDataURL("image/jpg")
            //         if (!!jcp) {
            //             jcp.destroy()
            //         }
            //
            //         if (!!jcpWhole) {
            //             jcpWhole.destroy()
            //             initCrop(finalDest, imageUrl, function (value, crop) {
            //                 imageUrl = value
            //                 jcpWhole = crop
            //             });
            //         }
            //     }
            // }


            resizeResultImage(750, finalDest);


            cv.imshow('warpedPerspective', finalDest);
            console.log(theWidth, theHeight, birthNumBorders.length)
            // textRecognition(theWidth, theHeight, finalDest)

            blur.delete()
            morph.delete()
            contours.delete()

            try {
                let parent = document.getElementsByClassName("flex-item")[0]
                let warpedImg = document.getElementById("warpedPerspectiveImg")
                let jcrop = document.getElementsByClassName("jcrop-stage")[0]
                parent.removeChild(warpedImg)
                parent.removeChild(jcrop)
            } catch (e) {

            }

            let canvas = document.getElementById('warpedPerspective');
            let imageFoo = document.createElement('img');

            imageFoo.src = canvas.toDataURL("image/jpg");
            imageFoo.id = "warpedPerspectiveImg"

            let caption = document.getElementsByClassName("caption")[1]
            caption.parentNode.insertBefore(imageFoo, caption)

            imageUrl = finalDest

            borderBtn.onclick = function () {
                Jcrop.load('warpedPerspectiveImg').then(img => {
                    jcpWhole.destroy()
                    jcp = Jcrop.attach(img, {multi: true});

                    jcp.listen("crop.change", (w, e) => {
                        console.log(w.pos)
                        textRecognitionFromBorder(w.pos.x, w.pos.y, w.pos.w, w.pos.h, finalDest)
                    })
                });
            }

            borderCancelBtn.onclick = function () {
                if (!!jcp) {
                    jcp.destroy()
                    initCrop(finalDest, imageUrl, function (value, crop) {
                        imageUrl = value
                        jcpWhole = crop
                    });
                }
            }
            initCrop(finalDest, imageUrl, function (value, crop) {
                imageUrl = value
                jcpWhole = crop
            });
            rotateClockBtn.onclick = function () {
                imageUrl = rotate(-90, finalDest, imageUrl, jcpWhole, jcp, function (value, crop, regionCrop) {
                    imageUrl = value
                    jcpWhole = crop
                    jcp = regionCrop
                })
            }
            rotateCounterClockBtn.onclick = function () {
                imageUrl = rotate(90, finalDest, imageUrl, jcpWhole, jcp, function (value, crop, regionCrop) {
                    imageUrl = value
                    jcpWhole = crop
                    jcp = regionCrop
                })
            }

        } else {
            $("#controls").css("display", "none");
            $("#fail-detection").css("display", "block");

            current++
            if (!!files[current]) {
                $("#next-pic-btn").css("display", "revert");
            } else {
                $("#next-pic-btn").css("display", "none");
            }

            nextBtn.onclick = function () {
                updateView(jcpWhole, files)
            }
        }

        submitBtn.onclick = function () {
            if(!validateBirthNumber(birthNumber.value)) {
                return
            }

            isFemale(birthNumber.value)

            sendOnServer(imageUrl, files[current].name, jcpWhole, jcp, files)
            if (!!jcp) {
                jcp.destroy()
            }
            imageUrl.delete()
        }
    }

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
        if (!!biggestContour2.biggest.data32S) {
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

        let corner1 = null
        let corner2 = null
        let corner3 = null
        let corner4 = null

        return {corner1, corner2, corner3, corner4};
    }

    function getFinalDimensions(corner1, corner2, corner3, corner4) {
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

    function textRecognitionFromBorder(x, y, w, h, finalDest) {
        let birthNumImage = document.getElementById("birthNumber")

        const worker = Tesseract.createWorker();

        (async () => {
            await worker.load();
            await worker.loadLanguage('slk');
            await worker.initialize('slk');
            const values = [];

            let dst = new cv.Mat();
            let rect = new cv.Rect(x, y, w, h);
            dst = finalDest.roi(rect);
            cv.imshow('birthNumber', dst)
            dst.delete()
            const {data: {text}} = await worker.recognize(birthNumImage);
            values.push(text);

            console.log(values);
            values.forEach(string => {
                const found = string.match(/[0-9]{6}\/[0-9]{3,4}/g);
                if (typeof found != "undefined" && found != null && found.length != null
                    && found.length > 0) {
                    console.log(found[0])
                    birthNumber.value = found[0]
                } else {
                    patientName.value = text
                }
            })
            await worker.terminate();
        })();
    }

    const getBase64StringFromDataURL = (dataURL) =>
        dataURL.replace('data:', '').replace(/^.+,/, '');


    function removeFourthValues(array) {
        return new Uint8ClampedArray(array.filter((value, index) => (index + 1) % 4 !== 0));
    }

    function validateBirthNumber(birthNumberString) {
        const found = birthNumberString.match(/[0-9]{6}\/[0-9]{3,4}/g)
        if (typeof found == "undefined" || found == null || found.length == null || found.length === 0) {
            return false
        }

        let birthMonth = birthNumberString.substring(2, 4)
        birthMonth = parseInt(birthMonth)

        if ((birthMonth > 0 && birthMonth <= 12) || (birthMonth > 50 && birthMonth <= 62)) {
            birthNumberString = birthNumberString.replace("/", "")
            let birthNumber = parseInt(birthNumberString)

            return birthNumber % 11 === 0;
        }
        return false
    }

    function isFemale(birthNumberString) {
        let birthMonth = birthNumberString.substring(2, 4)
        birthMonth = parseInt(birthMonth)
        return birthMonth > 50;
    }


})();

function resizeResultImage(width, finalDest) {
    let aspectRatio = finalDest.rows / finalDest.cols;
    let height = Math.round(width * aspectRatio);
    let dsize = new cv.Size(width, height);
    cv.resize(finalDest, finalDest, dsize, 0, 0, cv.INTER_AREA);
}

function initCrop(finalDest, imageUrl, callback) {
    Jcrop.load('warpedPerspectiveImg').then(img => {
        let jcpWhole = Jcrop.attach(img, {multi: false});
        const rect = Jcrop.Rect.sizeOf(jcpWhole.el);
        jcpWhole.newWidget(rect, {});

        jcpWhole.listen("crop.change", (w, e) => {
            console.log(w.pos)
            let rect = new cv.Rect(
                w.pos.x,
                w.pos.y,
                w.pos.w,
                w.pos.h);
            imageUrl = finalDest.roi(rect);
            cv.imshow("cropped", imageUrl)
            imageUrl = cv.imread("cropped")
            callback(imageUrl, jcpWhole)
        })
        callback(imageUrl, jcpWhole)
    });
}

function rotate2(angle) {
    let image = document.getElementById("warpedPerspectiveImg");
    image.style.transform = "rotate(" + angle + "deg)";
}

function rotate(angle, finalDest, imageUrl, jcpWhole, jcp, callback) {
    const canvas = document.getElementById('warpedPerspectiveImg');
    const image = cv.imread(canvas);
    let output = new cv.Mat();
    const size = new cv.Size();

    size.width = image.cols;
    size.height = image.rows;

    const scalar = new cv.Scalar(0, 0, 0, 0);

    let center;
    let padding;
    let height = size.height;
    let width = size.width;

    if (height > width) {
        center = new cv.Point(height / 2, height / 2);
        padding = (height - width) / 2;
        // Pad out the left and right before rotating to make the width the same as the height
        cv.copyMakeBorder(image, output, 0, 0, padding, padding, cv.BORDER_CONSTANT, scalar);
        size.width = height;
    } else {
        center = new cv.Point(width / 2, width / 2);
        padding = (width - height) / 2;
        // Pad out the top and bottom before rotating to make the height the same as the width
        cv.copyMakeBorder(image, output, padding, padding, 0, 0, cv.BORDER_CONSTANT, scalar);
        size.height = width;
    }

    const rotationMatrix = cv.getRotationMatrix2D(center, angle, 1);

    cv.warpAffine(
        output,
        output,
        rotationMatrix,
        size,
        // cv.INTER_LINEAR,
        // cv.BORDER_CONSTANT,
        // new cv.Scalar()
    );

    let rectangle;

    if (height > width) {
        rectangle = new cv.Rect(0, padding, height, width);
    } else {
        /* These arguments might not be in the right order as my solution only needed height
         * > width so I've just assumed this is the order they'll need to be for width >=
         * height.
         */
        rectangle = new cv.Rect(padding, 0, height, width);
    }

    output = output.roi(rectangle);

    cv.imshow("warpedPerspective", output);
    finalDest = output.clone()
    imageUrl = output.clone()
    output.delete()

    let canvasWarped = document.getElementById('warpedPerspective');
    let imageFoo = document.createElement('img');


    imageFoo.src = canvasWarped.toDataURL("image/jpg");
    imageFoo.id = "warpedPerspectiveImg"

    console.log(canvasWarped.toDataURL("image/jpg"))

    let caption = document.getElementsByClassName("caption")[1]
    document.getElementById("warpedPerspectiveImg").outerHTML = "";
    caption.parentNode.insertBefore(imageFoo, caption)


    if (!!jcp) {
        jcp.destroy()
        callback(imageUrl, jcpWhole, jcp)
    }

    if (!!jcpWhole) {
        jcpWhole.destroy()

        initCrop(finalDest, imageUrl, function (value, crop) {
            imageUrl = value
            jcpWhole = crop
            callback(imageUrl, jcpWhole, jcp)
        });

        callback(imageUrl, jcpWhole, jcp)
    }

    return imageUrl
}

function updateView(jcpWhole, files) {
    if (!!files[current]) {
        let imgElement = document.getElementById('imageSrc');
        imgElement.src = URL.createObjectURL(files[current]);
        $("#flex-item").css("display", "block")
    } else if (!!jcpWhole) {
        $("#flex-item").css("display", "none")
    }
}

