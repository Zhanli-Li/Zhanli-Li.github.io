---
layout: single
title: "PDFlux PDF Parser"
permalink: /pdf-parser/
author_profile: false
---

<div class="pdf-parser">
  <p class="pdf-parser__intro">
    Upload a PDF and fetch the parsed Markdown directly from the Chatdoc PDF parser API.
  </p>

  <div class="pdf-parser__panel">
    <label class="pdf-parser__label" for="pdf-parser-file">PDF file</label>
    <input id="pdf-parser-file" class="pdf-parser__input" type="file" accept=".pdf,application/pdf">

    <div class="pdf-parser__actions">
      <button id="pdf-parser-submit" class="btn btn--primary btn--large" type="button">Upload and Parse</button>
      <button id="pdf-parser-copy" class="btn btn--inverse" type="button" disabled>Copy Markdown</button>
      <button id="pdf-parser-download" class="btn btn--inverse" type="button" disabled>Download .md</button>
    </div>

    <p id="pdf-parser-status" class="pdf-parser__status" aria-live="polite">
      Ready. Choose a PDF to start parsing.
    </p>
  </div>

  <div class="pdf-parser__panel">
    <label class="pdf-parser__label" for="pdf-parser-output">Markdown output</label>
    <textarea id="pdf-parser-output" class="pdf-parser__output" spellcheck="false" placeholder="Parsed Markdown will appear here."></textarea>
  </div>
</div>

<script src="{{ '/assets/js/pdf-parser.js' | relative_url }}"></script>
