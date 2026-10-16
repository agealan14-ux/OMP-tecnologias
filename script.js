(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "image-viewer";
  dialog.setAttribute("aria-label", "Imagen ampliada");

  const toolbar = document.createElement("div");
  toolbar.className = "image-viewer-toolbar";

  const label = document.createElement("p");
  label.className = "image-viewer-label";

  const controls = document.createElement("div");
  controls.className = "image-viewer-controls";

  const makeButton = (text, description, className = "") => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.setAttribute("aria-label", description);
    if (className) button.className = className;
    return button;
  };

  const zoomOut = makeButton("−", "Alejar imagen");
  const zoomIn = makeButton("+", "Acercar imagen");
  const close = makeButton("×", "Cerrar imagen ampliada", "image-viewer-close");

  controls.append(zoomOut, zoomIn, close);
  toolbar.append(label, controls);

  const stage = document.createElement("div");
  stage.className = "image-viewer-stage";

  const image = document.createElement("img");
  image.className = "image-viewer-image";
  image.alt = "";
  image.draggable = false;
  stage.append(image);
  dialog.append(toolbar, stage);
  document.body.append(dialog);

  let zoom = 1;
  let fitScale = 1;

  const renderImageSize = () => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const availableWidth = Math.max(1, stage.clientWidth - 32);
    const availableHeight = Math.max(1, stage.clientHeight - 32);
    fitScale = Math.min(
      availableWidth / image.naturalWidth,
      availableHeight / image.naturalHeight,
      1,
    );
    image.style.width = `${image.naturalWidth * fitScale * zoom}px`;
    image.style.height = `${image.naturalHeight * fitScale * zoom}px`;
  };

  const changeZoom = (amount) => {
    zoom = Math.min(5, Math.max(1, zoom + amount));
    renderImageSize();
  };

  const openImage = (card) => {
    const background = getComputedStyle(card).backgroundImage;
    const match = background.match(/^url\(["']?(.*?)["']?\)$/);
    if (!match) return;

    image.src = match[1];
    image.alt = card.getAttribute("aria-label") || "Captura del programa";
    label.textContent = card.dataset.imageLabel || image.alt;
    zoom = 1;
    stage.scrollTo(0, 0);
    dialog.showModal();
    image.onload = renderImageSize;
    if (image.complete) renderImageSize();
  };

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".gallery-image");
    if (card) openImage(card);
  });

  document.addEventListener("keydown", (event) => {
    const card = event.target.closest?.(".gallery-image");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openImage(card);
    }
  });

  zoomIn.addEventListener("click", () => changeZoom(0.5));
  zoomOut.addEventListener("click", () => changeZoom(-0.5));
  close.addEventListener("click", () => dialog.close());
  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
  }, { passive: false });
  window.addEventListener("resize", renderImageSize);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
