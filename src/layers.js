import guid from './internal/guid.js';

function triggerEvent (eventName, enabledElement, layerId) {
  const element = enabledElement.element;
  const eventData = {
    viewport: enabledElement.viewport,
    element: enabledElement.element,
    image: enabledElement.image,
    enabledElement,
    layerId
  };

  $(element).trigger(eventName, eventData);
}

function rescaleImage (baseLayer, targetLayer) {
  const baseImage = baseLayer.image;
  const targetImage = targetLayer.image;
  const baseImagePlane = cornerstone.metaData.get('imagePlane', baseImage.imageId);
  const targetImagePlane = cornerstone.metaData.get('imagePlane', targetImage.imageId);

  if (!baseImagePlane || !baseImagePlane.columnPixelSpacing ||
        !targetImagePlane || !targetImagePlane.columnPixelSpacing) {
    return;
  }

    // Column pixel spacing need to be considered when calculating the
    // ratio between the layer added and base layer images
  const colRelative = (targetImagePlane.columnPixelSpacing * targetImage.width) /
                      (baseImagePlane.columnPixelSpacing * baseImage.width);
  const viewportRatio = targetLayer.viewport.scale / baseLayer.viewport.scale * colRelative;

  targetLayer.viewport.scale = baseLayer.viewport.scale * viewportRatio;
}

export function addLayer (element, image, options) {
  const layerId = guid();
  const enabledElement = cornerstone.getEnabledElement(element);
  const layers = enabledElement.layers;
  const viewport = cornerstone.internal.getDefaultViewport(enabledElement.canvas, image);

    // Set syncViewports to true by default when a new layer is added
  if (enabledElement.syncViewports !== false) {
    enabledElement.syncViewports = true;
  }

  const newLayer = {
    image,
    layerId,
    viewport,
    options: options || {}
  };

  // Rescale the new layer based on the base layer to make sure
  // they will have a proportional size (pixel spacing)
  if (layers.length) {
    rescaleImage(layers[0], newLayer);
  }

  layers.push(newLayer);

  // Set the layer as active if it's the first layer added
  if (layers.length === 1) {
    setActiveLayer(element, layers[0].layerId);
  }

  triggerEvent('CornerstoneLayerAdded', enabledElement, layerId);

  return layerId;
}

export function removeLayer (element, layerId) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const layers = enabledElement.layers;
  const index = enabledElement.layers.findIndex((layer) => layer.layerId === layerId);

  if (index !== -1) {
    layers.splice(index, 1);
    console.log(`Layer removed: ${layerId}`);

    if (layerId === enabledElement.activeLayerId && layers.length) {
      setActiveLayer(element, layers[0].layerId);
    }

    triggerEvent('CornerstoneLayerRemoved', enabledElement, layerId);
  }
}

export function getLayerById (element, layerId) {
  const enabledElement = cornerstone.getEnabledElement(element);


  return enabledElement.layers.find((layer) => layer.layerId === layerId);
}

export function getLayers (element) {
  const enabledElement = cornerstone.getEnabledElement(element);


  return enabledElement.layers;
}

export function getVisibleLayers (element) {
  const enabledElement = cornerstone.getEnabledElement(element);

  return enabledElement.layers.filter((layer) => layer.options &&
               layer.options.visible !== false &&
               layer.options.opacity !== 0);
}

export function setActiveLayer (element, layerId) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const index = enabledElement.layers.findIndex((layer) => layer.layerId === layerId);

  if ((index === -1) || (enabledElement.activeLayerId === layerId)) {
    return;
  }

  const layer = enabledElement.layers[index];

  enabledElement.activeLayerId = layerId;
  enabledElement.image = layer.image;
  enabledElement.viewport = layer.viewport;

  cornerstone.updateImage(element);
  triggerEvent('CornerstoneActiveLayerChanged', enabledElement, layerId);
}

export function getActiveLayer (element) {
  const enabledElement = cornerstone.getEnabledElement(element);


  return enabledElement.layers.find((layer) => layer.layerId === enabledElement.activeLayerId);
}
