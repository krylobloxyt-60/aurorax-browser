const body = document.body;
const focusToggle = document.querySelector("[data-focus-toggle]");
const form = document.querySelector(".contact-form");
const statusText = document.querySelector(".form-status");

focusToggle?.addEventListener("click", () => {
  body.classList.toggle("is-focus-mode");
  focusToggle.textContent = body.classList.contains("is-focus-mode") ? "Focused" : "Focus";
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  statusText.textContent = name
    ? `Thanks, ${name}. Aurora Labs preview request received.`
    : "Aurora Labs preview request received.";
  form.reset();
});
