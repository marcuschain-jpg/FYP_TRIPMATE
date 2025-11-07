import React, { useState } from "react";
import axios from "axios";

function UploadPhoto() {
  const [file, setFile] = useState(null);

  function handlePhotoChange(e) {
    setFile(e.target.files[0]);
  }

  async function uploadPhoto() {
    if (!file) return alert("Please select a photo first");
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await axios.post("http://localhost:8080/Itinerary/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Upload successful:", res.data);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }

  return (
    <>
      <input type="file" name="photo" onChange={handlePhotoChange} />
      <button onClick={uploadPhoto}>Upload</button>
    </>
  );
}

export default UploadPhoto;