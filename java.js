document.addEventListener("DOMContentLoaded", function () {
  const uploadBtn = document.getElementById("uploadBtn");
  const imageInput = document.getElementById("imageInput");
  const cameraBtn = document.getElementById("cameraBtn");
  const cameraArea = document.getElementById("cameraArea");
  const cameraVideo = document.getElementById("cameraVideo");
  const captureBtn = document.getElementById("captureBtn");
  const closeCameraBtn = document.getElementById("closeCameraBtn");
  const dropZone = document.getElementById("dropZone");
  const previewContainer = document.getElementById("previewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const fileName = document.getElementById("fileName");
  const removeBtn = document.getElementById("removeBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const status = document.getElementById("status");
  const emptyResult = document.getElementById("emptyResult");
  const result = document.getElementById("result");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");

  let selectedFile = null;
  let cameraStream = null;

  // Open the image picker
  uploadBtn.addEventListener("click", function () {
    imageInput.click();
  });

  // Display the selected image
  imageInput.addEventListener("change", function () {
    if (imageInput.files.length > 0) {
      showImage(imageInput.files[0]);
    }
  });

  function showImage(file) {
    if (!file.type.startsWith("image/")) {
      status.textContent = "Please select a valid image.";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      status.textContent = "Image must be smaller than 10 MB.";
      return;
    }

    const imageURL = URL.createObjectURL(file);
    const testImage = new Image();

    testImage.onload = function () {
      if (imagePreview.dataset.url) {
        URL.revokeObjectURL(imagePreview.dataset.url);
      }

      selectedFile = file;
      imagePreview.src = imageURL;
      imagePreview.dataset.url = imageURL;
      fileName.textContent = file.name;

      previewContainer.hidden = false;
      analyzeBtn.disabled = false;
      status.textContent = "Image selected successfully!";
      emptyResult.hidden = true;
      result.hidden = true;

      closeCamera();
    };

    testImage.onerror = function () {
      URL.revokeObjectURL(imageURL);
      status.textContent = "Unable to open this image. Please try another.";
    };

    testImage.src = imageURL;
  }

  // Drag and drop image
  dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("dragging");
  });

  dropZone.addEventListener("drop", function (event) {
    event.preventDefault();
    dropZone.classList.remove("dragging");

    const file = event.dataTransfer.files[0];
    if (file) {
      showImage(file);
    }
  });

  // Open camera
  cameraBtn.addEventListener("click", async function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent =
        "Camera requires localhost or a secure HTTPS website.";
      return;
    }

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      cameraVideo.srcObject = cameraStream;
      cameraArea.hidden = false;
      status.textContent = "Camera is ready. Capture your photo.";
    } catch (error) {
      console.error("Camera error:", error);
      status.textContent =
        "Camera unavailable. Allow camera permission in your browser settings.";
    }
  });

  // Capture photo
  captureBtn.addEventListener("click", function () {
    if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
      status.textContent = "Please wait for the camera to start.";
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(cameraVideo, 0, 0);

    canvas.toBlob(function (blob) {
      if (blob) {
        const photo = new File([blob], "waste-photo.jpg", {
          type: "image/jpeg"
        });
        showImage(photo);
      } else {
        status.textContent = "Could not capture the photo. Try again.";
      }
    }, "image/jpeg");
  });

  function closeCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (track) {
        track.stop();
      });
      cameraStream = null;
    }

    cameraVideo.srcObject = null;
    cameraArea.hidden = true;
  }

  closeCameraBtn.addEventListener("click", closeCamera);

  // Remove selected image
  removeBtn.addEventListener("click", function () {
    selectedFile = null;
    imageInput.value = "";

    if (imagePreview.dataset.url) {
      URL.revokeObjectURL(imagePreview.dataset.url);
      delete imagePreview.dataset.url;
    }

    imagePreview.removeAttribute("src");
    previewContainer.hidden = true;
    analyzeBtn.disabled = true;
    result.hidden = true;
    emptyResult.hidden = false;
    status.textContent = "Choose an image to begin.";
  });

  // Demo analysis only; this does not use an actual AI model
  
  // Send the selected image to the Flask AI backend
  analyzeBtn.addEventListener("click", async function () {
    if (!selectedFile) {
      status.textContent = "Please select an image first.";
      return;
    }

    const originalButton = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";
    status.textContent = "Sending image to the AI model...";

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/predict",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `Server error: ${response.status}`
        );
      }

      if (!data.category) {
        throw new Error("The backend did not return a waste category.");
      }

      resultTitle.textContent = "Detected: " + data.category;

      const confidence = Number(data.confidence);

      resultText.textContent = Number.isFinite(confidence)
        ? `AI confidence: ${confidence.toFixed(1)}%`
        : "AI classification completed.";

      result.hidden = false;
      emptyResult.hidden = true;

      status.textContent = "AI analysis completed successfully!";

    } catch (error) {
      console.error("AI analysis error:", error);

      status.textContent =
        "Analysis failed: " + error.message;

      resultTitle.textContent = "Analysis Failed";
      resultText.textContent =
        "Check the Flask terminal and browser console for the error.";

      result.hidden = false;
      emptyResult.hidden = true;

    } finally {
      analyzeBtn.innerHTML = originalButton;
      analyzeBtn.disabled = !selectedFile;
    }
  });

  // Send the selected image to the Flask AI backend
 
  // Send the selected image to the AI backend
  analyzeBtn.addEventListener("click", async function () {
    if (!selectedFile) {
      status.textContent = "Please select an image first.";
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    analyzeBtn.disabled = true;
    status.textContent = "AI is analysing your image...";
    result.hidden = true;

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      resultTitle.textContent = data.category;
      resultText.textContent =
        "Confidence: " + data.confidence + "%\n" +
        "Disposal tip: " + data.tip;

      result.hidden = false;
      emptyResult.hidden = true;
      status.textContent = "Image analysis completed!";
    } catch (error) {
      console.error("AI analysis error:", error);
      status.textContent =
        "Could not analyse image. Check that the backend is running.";
    } finally {
      analyzeBtn.disabled = false;
    }
  });


  window.addEventListener("beforeunload", closeCamera);
});