import * as tf from '@tensorflow/tfjs';

export const uint8ArrayToObjectURL = (data: Uint8Array): string => {
    return URL.createObjectURL(new Blob([data], {type: 'image/png'}));
};

// const getPNGAssetsFromPluginMessage = async (
//     pluginMessage: any
// ): Promise<{id: string; path: string; data: Uint8Array; width: number; height: number; components: any[]}[]> => {
//     let assets: any[] = [];
//     let exports = pluginMessage.exportImages;
//     console.log(exports);
//     exports.forEach((item) => {
//         assets.push({
//             id: item.id,
//             path: item.path,
//             data: item.imageData,
//             width: item.width,
//             height: item.height,
//             components: item.components,
//         });
//     });
//     return assets;
// };

const postAlert = (message: string) => {
    parent.postMessage(
        {
            pluginMessage: {
                type: 'alert',
                message: message,
            },
        },
        '*'
    );
};

const loadImage = (img: HTMLImageElement | null) => {
    if (!img) return;
    console.log('Pre-processing image...');

    const tfimg = tf.browser.fromPixels(img).toInt();
    const expandedimg = tfimg.expandDims();
    return expandedimg;
};

const predict = async (inputs: object, model: any) => {
    console.log('Running predictions...');
    postAlert('Running predictions...');
    const predictions = await model.executeAsync(inputs);
    return predictions;
};

const getLabelByID = (dir: {name: string; id: number}[], i: number) => {
    let label = dir.filter((x) => x.id === i);
    return label[0].name;
};

const renderPredictions = (
    predictions: any,
    width: number,
    height: number,
    classesDir: {name: string; id: number}[]
) => {
    console.log('Highlighting results...');
    postAlert('Highlighting results...');

    //Getting predictions
    const boxes = predictions[3].arraySync();
    const scores = predictions[2].arraySync();
    const classes = predictions[1].dataSync();

    let detectionObjects: any = [];

    scores[0].forEach((score: number, i: number) => {
        if (score > 0.3) {
            const bbox = [];
            const minY = boxes[0][i][0] * height;
            const minX = boxes[0][i][1] * width;
            const maxY = boxes[0][i][2] * height;
            const maxX = boxes[0][i][3] * width;
            bbox[0] = minX;
            bbox[1] = minY;
            bbox[2] = maxX - minX;
            bbox[3] = maxY - minY;

            detectionObjects.push({
                class: classes[i],
                label: getLabelByID(classesDir, classes[i]),
                score: score.toFixed(4),
                bbox: bbox,
            });
        }
    });

    return detectionObjects;
};

const drawCanvas = (image: HTMLImageElement | null, canvas: HTMLCanvasElement | null, font: string) => {
    const context = canvas?.getContext('2d');
    if (!context || !image) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Font options.
    context.font = font;
    context.textBaseline = 'top';
    return context;
};

const drawBoxes = (detections, context, font?: string, lineWidth?: number, color?: string) => {
    detections.forEach((item: any) => {
        const x = item['bbox'][0];
        const y = item['bbox'][1];
        const width = item['bbox'][2];
        const height = item['bbox'][3];

        // Draw the bounding box.
        context.strokeStyle = color || '#00FFFF';
        context.lineWidth = lineWidth || 4;
        context.strokeRect(x, y, width, height);

        if (!font) {
            return context;
        } else {
            const content = item['label'] + ' ' + (100 * item['score']).toFixed(2) + '%';
            // Draw the label background.
            context.fillStyle = color || '#00FFFF';

            const textWidth = context.measureText(content).width;
            const textHeight = parseInt(font, 10); // base 10
            context.fillRect(x, y, textWidth + 4, textHeight + 4);

            // Draw the text last to ensure it's on top.
            context.fillStyle = '#000000';
            context.fillText(content, x, y);
            return context;
        }
    });
};

export const runPredict = async (
    image: HTMLImageElement | null,
    c: HTMLCanvasElement | null,
    model: any,
    classesDir: {name: string; id: number}[]
) => {
    try {
        const font = '16px sans-serif';
        const context = drawCanvas(image, c, font);
        const expandedimg = loadImage(image);
        const predictions = await predict(expandedimg, model);
        const detections: any = renderPredictions(predictions, image?.width || 0, image?.height || 0, classesDir);
        console.log('interpreted: ', detections);
        drawBoxes(detections, context, null, 1, '#00FFFF');
    } catch (e) {
        console.log(e);
    }
};
