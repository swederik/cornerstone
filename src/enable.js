/**
 * This module is responsible for enabling an element to display images with cornerstone
 */
(function (cornerstone) {

    "use strict";

    function enable(element) {
        if(element === undefined) {
            throw "enable: parameter element cannot be undefined";
        }

        var canvas = document.createElement('canvas');
        element.appendChild(canvas);

        var el = {
            element: element,
            canvas: canvas,
            image : undefined, // will be set once image is loaded
            invalid: false, // true if image needs to be drawn, false if not
            needsRedraw:true,
            data : {}
        };
        cornerstone.addEnabledElement(el);

        cornerstone.resize(element, true);


        function draw(timestamp) {
            if (el.canvas === undefined){
                return;
            }

            $(el.element).trigger('CornerstonePreRender', { enabledElement: el, timestamp: timestamp });

            if (el.needsRedraw && el.image !== undefined){
                var start = new Date();
                
                var render = el.image.render;

                el.image.stats = {
                    lastGetPixelDataTime:-1.0,
                    lastStoredPixelDataToCanvasImageDataTime:-1.0,
                    lastPutImageDataTime:-1.0,
                    lastRenderTime:-1.0,
                    lastLutGenerateTime:-1.0,
                };

                if(!render) {
                    render = el.image.color ? cornerstone.renderColorImage : cornerstone.renderGrayscaleImage;
                }

                render(el, el.invalid);

                var context = el.canvas.getContext('2d');

                var end = new Date();
                var diff = end - start;

                var eventData = {
                    viewport: el.viewport,
                    element: el.element,
                    image: el.image,
                    enabledElement: el,
                    canvasContext: context,
                    renderTimeInMs: diff
                };

                el.image.stats.lastRenderTime = diff;

                el.invalid = false;
                el.needsRedraw = false;

                $(el.element).trigger("CornerstoneImageRendered", eventData);
            }

            cornerstone.requestAnimationFrame(draw);
        }

        draw();

        return element;
    }

    // module/private exports
    cornerstone.enable = enable;
}(cornerstone));