import cv2
import numpy as np
import cv2 as cv


def biggestContour(contours):
    biggest = np.array([])
    max_area = -1
    for i in contours:
        area = cv2.contourArea(i)
        if area > 2000:
            perimeter = cv2.arcLength(i, True)
            approx = cv2.approxPolyDP(i, 0.02 * perimeter, True)
            if area > max_area and len(approx) == 4:
                biggest = approx
                max_area = area
    return biggest, max_area


def reorder(myPoints):
    myPoints = myPoints.reshape((4, 2))
    myPointsNew = np.zeros((4, 1, 2), dtype=np.int32)
    add = myPoints.sum(1)

    myPointsNew[0] = myPoints[np.argmin(add)]
    myPointsNew[3] = myPoints[np.argmax(add)]

    diff = np.diff(myPoints, axis=1)
    myPointsNew[1] = myPoints[np.argmin(diff)]
    myPointsNew[2] = myPoints[np.argmax(diff)]

    return myPointsNew


img = cv2.imread("Your image with a paper")
imgWidth = img.shape[1] // 5
imgHeight = img.shape[0] // 5

img = cv2.resize(img, (img.shape[1] // 5, img.shape[0] // 5))

imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
imgBlur = cv2.GaussianBlur(imgGray, (5, 5), 1)

imgCanny = cv2.Canny(imgBlur, 100, 100, 3)

contoursImg = img.copy()
bigContour = img.copy()
contours, hierarchy = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)

cv2.drawContours(contoursImg, contours, -1, (0, 255, 0), 5)

biggest, max_area = biggestContour(contours)

if biggest.size != 0:
    biggest = reorder(biggest)
    cv2.drawContours(bigContour, biggest, -1, (0, 255, 0), 5)
    pts1 = np.float32(biggest)
    pts2 = np.float32(
        [[20, 20], [imgWidth, 20], [20, imgHeight],
         [imgWidth, imgHeight]])
    matrix = cv2.getPerspectiveTransform(pts1, pts2)
    imgWarp = cv2.warpPerspective(img, matrix, (imgWidth + 20, imgHeight + 20))

    cv2.imshow("test", imgWarp)
    newWarp = imgWarp.copy()
    cv2.waitKey(0)

    imgGray = cv2.cvtColor(imgWarp, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (1, 1), 1)

    imgCanny = cv2.Canny(imgBlur, 100, 100, 3)

    contoursImg = imgWarp.copy()
    bigContour = imgWarp.copy()
    contours, hierarchy = cv2.findContours(imgCanny, cv2.RETR_EXTERNAL,
                                           cv2.CHAIN_APPROX_SIMPLE)

    cv2.drawContours(contoursImg, contours, -1, (0, 255, 0), 5)

    biggest, max_area = biggestContour(contours)


cv2.imshow("test", contoursImg)
cv2.waitKey(0)
cv.destroyAllWindows()
