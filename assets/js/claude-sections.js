(function () {
  function classifySection(section, headingText) {
    var normalized = headingText.toLowerCase();

    if (normalized.indexOf("publication") !== -1) {
      section.classList.add("claude-section--publications");
      return;
    }

    if (normalized.indexOf("news") !== -1) {
      section.classList.add("claude-section--news", "claude-section--dark");
      return;
    }

    if (normalized.indexOf("vistor") !== -1 || normalized.indexOf("visitor") !== -1) {
      section.classList.add("claude-section--visitor");
      return;
    }

    if (section.dataset.claudeSectionIndex && Number(section.dataset.claudeSectionIndex) % 2 === 1) {
      section.classList.add("claude-section--dark");
    }
  }

  function wrapClaudeSections() {
    if (!document.body.classList.contains("claude-theme")) {
      return;
    }

    var content = document.querySelector(".page__content");
    if (!content || content.dataset.claudeSectionsReady === "1") {
      return;
    }

    var headings = Array.prototype.filter.call(content.children, function (node) {
      return node.nodeType === 1 && node.tagName === "H2";
    });

    if (!headings.length) {
      return;
    }

    content.dataset.claudeSectionsReady = "1";

    headings.forEach(function (heading, index) {
      var section = document.createElement("section");
      section.className = "claude-section";
      section.dataset.claudeSectionIndex = String(index);
      section.dataset.claudeSectionTitle = (heading.textContent || "").trim();

      content.insertBefore(section, heading);
      section.appendChild(heading);

      var nextNode = section.nextSibling;
      while (nextNode) {
        var currentNode = nextNode;
        nextNode = currentNode.nextSibling;

        if (currentNode.nodeType === 1 && currentNode.tagName === "H2") {
          break;
        }

        section.appendChild(currentNode);
      }

      classifySection(section, section.dataset.claudeSectionTitle);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wrapClaudeSections);
  } else {
    wrapClaudeSections();
  }
})();
