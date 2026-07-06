(function () {
  "use strict";

  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  var searchInput = document.getElementById("tool-search");
  var cards = document.querySelectorAll(".tool-card");
  var count = document.getElementById("tool-count");
  var emptyMessage = document.getElementById("no-tools-message");

  if (!searchInput || !cards.length) {
    return;
  }

  searchInput.addEventListener("input", function () {
    var query = searchInput.value.toLowerCase().trim();
    var visibleCards = 0;

    cards.forEach(function (card) {
      var searchableText = card.getAttribute("data-tool") || "";
      var isMatch = searchableText.toLowerCase().indexOf(query) !== -1;

      card.hidden = !isMatch;

      if (isMatch) {
        visibleCards += 1;
      }
    });

    if (count) {
      count.textContent = visibleCards + (visibleCards === 1 ? " tool available" : " tools available");
    }

    if (emptyMessage) {
      emptyMessage.hidden = visibleCards !== 0;
    }
  });
})();
