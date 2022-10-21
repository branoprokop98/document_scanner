// Get the modal
let modal = document.getElementById("myModal");


// Get the button that opens the modal
let btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
let span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
var stringImage = 'https://scaleflex.airstore.io/demo/stephen-walker-unsplash.jpg'
btn.onclick = function () {
    modal.style.display = "block";
    let wrappedImage = document.getElementById("warpedPerspective")
    stringImage = wrappedImage.toDataURL("image/png")

    const {TABS, TOOLS} = window.FilerobotImageEditor;
    const config = {
        source: stringImage,
        onSave: (editedImageObject, designState) => {
            console.log('saved', editedImageObject, designState)
            const link = document.createElement('a')
            link.href = editedImageObject.imageBase64
            link.download = editedImageObject.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        },
        previewPixelRatio: 10,
        defaultSavedImageName: 'image',
        annotationsCommon: {
            fill: '#ff0000',
        },
        Text: {text: 'Filerobot...'},
        Rotate: {angle: 90, componentType: 'buttons'},
        disableZooming: true,
        tabsIds: [TABS.ADJUST],
        defaultTabId: TABS.ADJUST,
        defaultToolId: TOOLS.TEXT,
    };

// Assuming we have a div with id="editor_container"
    const filerobotImageEditor = new FilerobotImageEditor(
        document.querySelector('#editor_container'),
        config,
    );

    filerobotImageEditor.render({});
    let test = document.getElementsByClassName('konvajs-content');

}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
