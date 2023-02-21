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
                data: JSON.stringify({"image": imageUrl.data, "rows": imageUrl.rows, "cols": imageUrl.cols, "birth": birthNumber.value, "name": patientName.value, "filename": files[current].name}),
                success: function (data) {
                    console.log("OK")
                    imageUrl.delete()
                    imageUrl = null
                    $("#warpedPerspectiveImg").remove();
                    $("#imageSrc").attr("src","");
                    $("#flex-item").css("display","none");
                    $("#fname").val("");
                    $("#fbirthnumber").val("")
                    // $("#fileInput").val("")
                    if (!!jcp) {
                        jcp.destroy()
                    }

                    if(!!jcpWhole) {
                        jcpWhole.destroy()
                    }
                    updateView()
                }
            })
        }
    })

    function updateView() {
        current++
        if (!!files[current]) {
            imgElement.src = URL.createObjectURL(files[current]);
            $("#flex-item").css("display", "block")
        } else if (!!jcpWhole) {
            jcpWhole.destroy()
            $("#flex-item").css("display", "none")
        }
    }

})
