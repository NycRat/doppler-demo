const frequencyEl = document.getElementById("frequency");

frequencyEl.innerText = "125";

setInterval(() => {
  frequencyEl.innerText = frequencyEl.innerText - -1;
}, 5);
