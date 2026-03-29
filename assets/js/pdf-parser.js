(function () {
  const apiKey = "sk-VTJ9OcVypsQEPuTNYHnM8G0hTQWvIVRwLx2W6dwDKNPghDk1";
  const uploadEndpoint = "https://api.chatdoc.studio/v1/pdf/parser/upload";
  const pollIntervalMs = 2000;
  const maxAttempts = 45;

  const fileInput = document.getElementById("pdf-parser-file");
  const submitButton = document.getElementById("pdf-parser-submit");
  const copyButton = document.getElementById("pdf-parser-copy");
  const downloadButton = document.getElementById("pdf-parser-download");
  const statusNode = document.getElementById("pdf-parser-status");
  const outputNode = document.getElementById("pdf-parser-output");

  if (!fileInput || !submitButton || !copyButton || !downloadButton || !statusNode || !outputNode) {
    return;
  }

  const setStatus = function (message, isError) {
    statusNode.textContent = message;
    statusNode.classList.toggle("pdf-parser__status--error", Boolean(isError));
  };

  const setBusy = function (busy) {
    submitButton.disabled = busy;
    fileInput.disabled = busy;
  };

  const getAuthHeader = function () {
    if (!apiKey) {
      throw new Error("Chatdoc API key is not configured.");
    }
    return "Bearer " + apiKey;
  };

  const parseMaybeJson = function (text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  };

  const wait = function (ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  };

  const fetchMarkdown = async function (uploadId, authHeader) {
    const resultEndpoint = "https://api.chatdoc.studio/v1/pdf/parser/" + encodeURIComponent(uploadId) + "/markdown";

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      setStatus("Processing PDF... attempt " + attempt + " / " + maxAttempts);

      const response = await fetch(resultEndpoint, {
        method: "GET",
        headers: {
          Authorization: authHeader
        },
        cache: "no-store"
      });

      const rawText = await response.text();
      const maybeJson = parseMaybeJson(rawText);

      if (!response.ok) {
        const detail = maybeJson && (maybeJson.detail || maybeJson.message || maybeJson.code);
        throw new Error(detail || "Failed to fetch parsed Markdown.");
      }

      if (typeof rawText === "string" && rawText.trim()) {
        if (!maybeJson) {
          return rawText;
        }

        if (maybeJson.data && typeof maybeJson.data.markdown === "string" && maybeJson.data.markdown.trim()) {
          return maybeJson.data.markdown;
        }
      }

      await wait(pollIntervalMs);
    }

    throw new Error("Timed out while waiting for parsed Markdown.");
  };

  const handleSubmit = async function () {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      setStatus("Please choose a PDF file first.", true);
      return;
    }

    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("Only PDF files are supported.", true);
      return;
    }

    try {
      setBusy(true);
      copyButton.disabled = true;
      downloadButton.disabled = true;
      outputNode.value = "";

      const authHeader = getAuthHeader();
      const formData = new FormData();
      formData.append("file", file);

      setStatus("Uploading PDF...");

      const uploadResponse = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader
        },
        body: formData
      });

      const uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok) {
        const detail = uploadPayload && (uploadPayload.detail || uploadPayload.message || uploadPayload.code);
        throw new Error(detail || "Upload failed.");
      }

      const uploadId = uploadPayload && uploadPayload.data && uploadPayload.data.upload_id;

      if (!uploadId) {
        throw new Error("Upload succeeded but no upload_id was returned.");
      }

      const markdown = await fetchMarkdown(uploadId, authHeader);
      outputNode.value = markdown;
      copyButton.disabled = false;
      downloadButton.disabled = false;
      setStatus("Done. Parsed Markdown is ready.");
    } catch (error) {
      setStatus(error.message || "Something went wrong.", true);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async function () {
    if (!outputNode.value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(outputNode.value);
      setStatus("Markdown copied to clipboard.");
    } catch (error) {
      setStatus("Copy failed in this browser.", true);
    }
  };

  const handleDownload = function () {
    if (!outputNode.value) {
      return;
    }

    const sourceName = fileInput.files && fileInput.files[0] ? fileInput.files[0].name.replace(/\.pdf$/i, "") : "parsed";
    const blob = new Blob([outputNode.value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = sourceName + ".md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  submitButton.addEventListener("click", handleSubmit);
  copyButton.addEventListener("click", handleCopy);
  downloadButton.addEventListener("click", handleDownload);
})();
