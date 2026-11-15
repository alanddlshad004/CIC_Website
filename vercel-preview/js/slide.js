/* Home "Our Actions" — horizontal slider + expandable lists */
document.addEventListener("DOMContentLoaded", function () {
  var slider = document.querySelector(".actions-slider");
  var prev = document.getElementById("prev-slide");
  var next = document.getElementById("next-slide");

  if (slider && prev && next) {
    var step = function () {
      var card = slider.querySelector(".slide");
      return card ? card.getBoundingClientRect().width + 24 : slider.offsetWidth / 1.5;
    };
    var dir = function () { return getComputedStyle(slider).direction === "rtl" ? -1 : 1; };
    prev.addEventListener("click", function () { slider.scrollBy({ left: -step() * dir(), behavior: "smooth" }); });
    next.addEventListener("click", function () { slider.scrollBy({ left: step() * dir(), behavior: "smooth" }); });
  }

  document.querySelectorAll(".action-ctrl").forEach(function (ctrl) {
    var toggle = function () {
      var open = ctrl.classList.toggle("open");
      ctrl.setAttribute("aria-expanded", open ? "true" : "false");
    };
    ctrl.addEventListener("click", toggle);
    ctrl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
});
