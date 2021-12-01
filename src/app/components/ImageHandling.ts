import * as tf from '@tensorflow/tfjs';

export const uint8ArrayToObjectURL = (data: Uint8Array): string => {
    return URL.createObjectURL(new Blob([data], {type: 'image/png'}));
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
    const predictions = await model.executeAsync(inputs);
    return predictions;
};

const renderPredictions = (
    predictions: any,
    width: number,
    height: number,
    classesDir: {name: string; id: number}[]
) => {
    console.log('Highlighting results...');

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
                label: classesDir[classes[i]].name,
                score: score.toFixed(4),
                bbox: bbox,
            });
        }
    });

    return detectionObjects;
};

export const runPredict = async (
    image: HTMLImageElement | null,
    c: HTMLCanvasElement | null,
    model: any,
    classesDir: {name: string; id: number}[]
) => {
    try {
        const context = c?.getContext('2d');
        if (!context || !image) return;
        context.drawImage(image, 0, 0);

        // Font options.
        const font = '16px sans-serif';
        context.font = font;
        context.textBaseline = 'top';

        const expandedimg = loadImage(image);
        const predictions = await predict(expandedimg, model);
        const detections: any = renderPredictions(predictions, image?.width || 0, image?.height || 0, classesDir);
        console.log('interpreted: ', detections);

        detections.forEach((item: any) => {
            const x = item['bbox'][0];
            const y = item['bbox'][1];
            const width = item['bbox'][2];
            const height = item['bbox'][3];

            // Draw the bounding box.
            context.strokeStyle = '#00FFFF';
            context.lineWidth = 4;
            context.strokeRect(x, y, width, height);

            // Draw the label background.
            context.fillStyle = '#00FFFF';
            const textWidth = context.measureText(item['label'] + ' ' + (100 * item['score']).toFixed(2) + '%').width;
            const textHeight = parseInt(font, 10); // base 10
            context.fillRect(x, y, textWidth + 4, textHeight + 4);
        });

        for (let i = 0; i < detections.length; i++) {
            const item = detections[i];
            const x = item['bbox'][0];
            const y = item['bbox'][1];
            const content = item['label'] + ' ' + (100 * item['score']).toFixed(2) + '%';

            // Draw the text last to ensure it's on top.
            context.fillStyle = '#000000';
            context.fillText(content, x, y);
        }
    } catch (e) {
        console.log(e);
    }
};
