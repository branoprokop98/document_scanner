function cleanPage(jcp, jcpWhole, files) {
    $("#warpedPerspectiveImg").remove();
    $("#imageSrc").attr("src", "");
    $("#flex-item").css("display", "none");
    $("#controls").css("display", "none");
    $("#fname").val("");
    $("#fbirthnumber").val("")
    if (!!jcp) {
        jcp.destroy()
    }

    if (!!jcpWhole) {
        jcpWhole.destroy()
    }
    current++
    updateView(jcpWhole, files)
}

function openDialogWindow(text) {
    $("#myModal").css("display", "block");
    $('#dialogText').text(text);
    $("#closeBtn").on("click", function () {
        $("#myModal").css("display", "none");
    })
}

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
                cleanPage(jcp, jcpWhole, files);
                openDialogWindow("Dokument bol uložený")
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("Error")
                cleanPage(jcp, jcpWhole, files);
                openDialogWindow("Chyba spojenia s PACS serverom")
            }
        })
    }
}
