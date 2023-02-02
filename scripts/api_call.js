$(document).ready(function () {
    $("#submit").click(function () {
        if (birthNumber.value === "" || patientName.value === "") {
            $("#error-submit").css("display", "block")
        } else {
            $("#error-submit").css("display", "none")
            $.ajax({
                url: "http://127.0.0.1:3000/request",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({"image": imageUrl.data, "rows": imageUrl.rows, "cols": imageUrl.cols, "birth": birthNumber.value, "name": patientName.value}),
                success: function (data) {
                    console.log("OK")
                    imageUrl.delete()
                    imageUrl = null
                    $("#warpedPerspectiveImg").attr("src","");
                    $("#imageSrc").attr("src","");
                    $("#fname").val("");
                    $("#fbirthnumber").val("")
                    $("#fileInput").val("")
                    if (!!jcp) {
                        jcp.destroy()
                    }

                    if(!!jcpWhole) {
                        jcpWhole.destroy()
                    }
                }
            })
        }
    })
})
