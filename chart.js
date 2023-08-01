class Chart {
    constructor(container, samples, options) {
        this.samples = samples;

        this.axesLabels = options.axesLabels;
        this.style = options.styles;

        this.canvas = document.createElement('canvas');
        this.canvas.width = options.size;
        this.canvas.height = options.size;
        this.canvas.style = `background-color: white;`;
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        this.margin = options.size * 0.1;
        this.transparency = 0.5;

        this.dataTrans = {
            offset: [0, 0],
            scale: 1
        };
        this.dragInfo = {
            start: [0, 0],
            end: [0, 0],
            offset: [0, 0],
            dragging: false
        }

        this.pixelBounds = this.#getPixelBounds();
        this.dataBounds = this.#getDataBounds(); //tranforming while zoom
        this.defauldDataBounds = this.#getDataBounds(); //unchanged

        this.#draw();

        this.#addEventListeners();
    }

    #addEventListeners() {
        const { canvas, dataTrans, dragInfo } = this;

        //get dataCoordinates
        canvas.onmousedown = evt => {
            const dataLoc = this.#getMouse(evt, true); //true means data coordinates, false(default) : pixel coordinates of same mouse loc
            dragInfo.start = dataLoc;
            dragInfo.dragging = true;
        };

        canvas.onmousemove = evt => {
            if (dragInfo.dragging) {
                const dataLoc = this.#getMouse(evt, true);
                dragInfo.end = dataLoc;
                dragInfo.offset = math.subtract(dragInfo.start, dragInfo.end);

                //add current value of offset or the drag or new drag always start at default location of spawn position (centered)
                const newOffset = math.add(dataTrans.offset, dragInfo.offset);
                this.#updateDataBounds(newOffset);
                this.#draw();
            }
        }
        canvas.onmouseup = evt => {
            dataTrans.offset = math.add(dataTrans.offset, dragInfo.offset);
            dragInfo.dragging = false;
        }
    }

    #updateDataBounds(offset) {
        const { dataBounds, defauldDataBounds: def } = this;
        dataBounds.left = def.left + offset[0];
        dataBounds.right = def.right + offset[0];
        dataBounds.top = def.top + offset[1];
        dataBounds.bottom = def.bottom + offset[1];
    }

    #getMouse = (evt, dataSpace = false) => {
        const rect = this.canvas.getBoundingClientRect();

        //event.clientX is the x coordinate of the whole html document, rect.left is the left boundary of the html canvas
        //*this gives relative x coordinate of mouse in html canvas (in pixel values)
        const pixelLoc = [evt.clientX - rect.left, evt.clientY - rect.top];
        if (dataSpace) {
            //if dataspace requested, remap pixelLoc to dataLoc(dataBounds changes while zooming, so copy : defauldDataBounds || jittery effect)
            const dataLoc = math.remapPoint(this.pixelBounds, this.defauldDataBounds, pixelLoc);
            return dataLoc;
        }
        return pixelLoc;
    };

    //! Private methods start with '#'. Can't be accessed outside this class
    #getPixelBounds() {
        const { canvas, margin } = this;
        const bounds = {
            left: margin,
            right: canvas.width - margin,
            top: margin,
            bottom: canvas.height - margin,
        };
        return bounds;
    }

    #getDataBounds() {
        const { samples } = this;
        const x = samples.map(s => s.point[0]);
        const y = samples.map(s => s.point[1]);
        const minX = Math.min(...x);
        const maxX = Math.max(...x);
        const minY = Math.min(...y);
        const maxY = Math.max(...y);

        const bounds = {
            left: minX,
            right: maxX,
            top: maxY,
            bottom: minY,
        };

        return bounds;
    }

    #draw() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.#drawAxes();
        ctx.globalAlpha = this.transparency;
        this.#drawSamples();
        ctx.globalAlpha = 1;
    }

    #drawAxes() {
        const { ctx, canvas, axesLabels, margin } = this;
        const { left, right, top, bottom } = this.pixelBounds;

        graphics.drawText(ctx, {
            text: axesLabels[0],
            loc: [canvas.width / 2, bottom + margin / 2],
            size: margin * 0.6,
        });

        ctx.save();
        //translate :  from (0.0), entire coordinate system of the canvas context is shifted by x units horizontally and y units vertically.
        ctx.translate(left - margin / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        graphics.drawText(ctx, {
            text: axesLabels[1],
            loc: [0, 0], //translate and rotate already set the loc
            size: margin * 0.6,
        });

        ctx.restore(); //if not, everyting we draw after this will be rotated and translated

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]); //no dash line in further draw

        //the left is min km and the right is min price as point is (km, price)
        const dataMin = math.remapPoint(this.pixelBounds, this.dataBounds, [left, bottom]);
        graphics.drawText(ctx, {
            text: math.formatNumber(dataMin[0], 2),
            loc: [left, bottom],
            size: margin * 0.3,
            align: 'left',
            vAlign: 'top',
        });

        //ctx.save stores current state (like  transformations, styles) and pushed to stack
        //help to make temparory changes
        ctx.save();
        ctx.translate(left, bottom);
        ctx.rotate(-Math.PI / 2);
        graphics.drawText(ctx, {
            text: math.formatNumber(dataMin[1], 2),
            loc: [0, 0],
            size: margin * 0.3,
            align: 'left',
            vAlign: 'bottom',
        });

        //pop out from stack and restores the canvas context to the state that was last saved
        ctx.restore();

        const dataMax = math.remapPoint(this.pixelBounds, this.dataBounds, [right, top]);
        graphics.drawText(ctx, {
            text: math.formatNumber(dataMax[0], 2),
            loc: [right, bottom],
            size: margin * 0.3,
            align: 'right',
            vAlign: 'top',
        });

        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(-Math.PI / 2);
        graphics.drawText(ctx, {
            text: math.formatNumber(dataMax[1], 2),
            loc: [0, 0],
            size: margin * 0.3,
            align: 'right',
            vAlign: 'bottom',
        });
        ctx.restore();
    }

    #drawSamples() {
        const { ctx, samples, dataBounds, pixelBounds } = this;
        for (const sample of samples) {
            const { point } = sample;

            const pixelLoc = math.remapPoint(dataBounds, pixelBounds, point);

            graphics.drawPoint(ctx, pixelLoc);
        }
    }
}
