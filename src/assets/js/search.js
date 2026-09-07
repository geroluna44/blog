(function () {
  var input = document.getElementById("search");
  var results = document.getElementById("search-results");
  var main = document.querySelector("main");
  if (!input || !results || !main) return;

  var index = [];
  fetch("/search-index.json")
    .then(function (res) {
      if (!res.ok) throw new Error("No se pudo cargar el índice de búsqueda");
      return res.json();
    })
    .then(function (data) {
      index = data;
    })
    .catch(function () {
      input.disabled = true;
      input.placeholder = "Búsqueda no disponible";
    });

  function normalize(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function render(items) {
    if (items.length === 0) {
      results.innerHTML = "<p>Sin resultados.</p>";
    } else {
      results.innerHTML = items
        .map(function (item) {
          return (
            '<div class="result-item">' +
            '<a href="' +
            item.url +
            '">' +
            item.title +
            "</a>" +
            '<div class="result-snippet">' +
            item.description +
            "</div></div>"
          );
        })
        .join("");
    }
    results.hidden = false;
    main.hidden = true;
  }

  function clear() {
    results.hidden = true;
    main.hidden = false;
    results.innerHTML = "";
  }

  input.addEventListener("input", function () {
    var query = normalize(input.value.trim());
    if (!query) {
      clear();
      return;
    }
    var matches = index.filter(function (item) {
      return (
        normalize(item.title).includes(query) ||
        normalize(item.description).includes(query) ||
        item.tags.join(" ").toLowerCase().includes(query)
      );
    });
    render(matches.slice(0, 10));
  });
})();