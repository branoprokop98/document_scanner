$(document).ready(function() {
    $("#submit").click(function() {
        $.post("http://127.0.0.1:3000/request", {
                name: "viSion",
                designation: "Professional gamer"
            },
            function(data, status) {
                console.log(data);
            });
    });
});
