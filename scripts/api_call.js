$(document).ready(function () {
    $("#submit").click(function () {
        $.ajax({
            url: "http://127.0.0.1:3000/request",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({"image": imageUrl.data, "rows": imageUrl.rows, "cols": imageUrl.cols}),
            success: function (data) {
                console.log("OK")
            }
        })
    })
})
