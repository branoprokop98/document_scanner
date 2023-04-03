function sendOnServer(image, filename, jcpWhole, jcp, files) {
    let birthNumber = document.getElementById("fbirthnumber")
    let patientName = document.getElementById("fname")
    if (birthNumber.value === "" || patientName.value === "") {
        $("#error-submit").css("display", "block")
    } else {
        $("#error-submit").css("display", "none")
        $.ajax({
            url: "http://127.0.0.1:3000/request",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                "image": image.data,
                "rows": image.rows,
                "cols": image.cols,
                "birth": birthNumber.value,
                "name": patientName.value,
                "filename": filename}),
            success: function (data) {
                console.log("OK")
                $("#warpedPerspectiveImg").remove();
                $("#imageSrc").attr("src","");
                $("#flex-item").css("display","none");
                $("#controls").css("display","none");
                $("#fname").val("");
                $("#fbirthnumber").val("")
                // $("#fileInput").val("")
                if (!!jcp) {
                    jcp.destroy()
                }

                if(!!jcpWhole) {
                    jcpWhole.destroy()
                }
                current++
                updateView(jcpWhole, files)
            }
        })
    }
}

// $(document).ready(function () {
//     $("#submit").click(function () {
//         if (birthNumber.value === "" || patientName.value === "") {
//             $("#error-submit").css("display", "block")
//         } else {
//             $("#error-submit").css("display", "none")
//             $.ajax({
//                 url: "http://127.0.0.1:3000/request",
//                 type: 'POST',
//                 contentType: 'application/json',
//                 data: JSON.stringify({"image": imageUrl.data, "rows": imageUrl.rows, "cols": imageUrl.cols, "birth": birthNumber.value, "name": patientName.value, "filename": files[current].name}),
//                 success: function (data) {
//                     console.log("OK")
//                     imageUrl.delete()
//                     imageUrl = null
//                     $("#warpedPerspectiveImg").remove();
//                     $("#imageSrc").attr("src","");
//                     $("#flex-item").css("display","none");
//                     $("#controls").css("display","none");
//                     $("#fname").val("");
//                     $("#fbirthnumber").val("")
//                     // $("#fileInput").val("")
//                     if (!!jcp) {
//                         jcp.destroy()
//                     }
//
//                     if(!!jcpWhole) {
//                         jcpWhole.destroy()
//                     }
//                     current++
//                     updateView()
//                 }
//             })
//         }
//     })
// })
