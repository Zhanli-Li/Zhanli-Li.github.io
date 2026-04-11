(function () {
  function wrapClaudeSections() {
    if (!document.body.classList.contains("claude-theme")) {
      return;
    }

    var content = document.querySelector(".page__content");
    if (!content || content.dataset.claudeSectionsReady === "1") {
      return;
    }

    var headings = Array.prototype.filter.call(content.children, function (node) {
      return node.tagName === "H2";
    });

    if (!headings.length) {
      return;
    }

    content.dataset.claudeSectionsReady = "1";

    headings.forEach(function (heading, index) {
      var section = document.createElement("section");
      section.className = "claude-section";

      if (index % 2 === 1) {
        section.classList.add("claude-section--dark");
      }

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
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wrapClaudeSections);
  } else {
    wrapClaudeSections();
  }
})();
