import stringComparison from 'string-comparison';
import {getOverlapSize} from 'overlap-area';

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

export const postAlert = (type: string, message: any) => {
    parent.postMessage(
        {
            pluginMessage: {
                type: type,
                message: message,
            },
        },
        '*'
    );
};

const loadImage = (img: HTMLImageElement | null) => {
    const newWindowObject = window as any;
    const tf = newWindowObject.tf;
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

const getLabelByID = (dir: {name: string; id: number}[], i: number) => {
    let label = dir.filter((x) => x.id === i);
    return label[0].name;
};

const renderPredictions = (
    predictions: any,
    width: number,
    height: number,
    classesDir: {name: string; id: number}[],
    modelLayer: {
        boxes: number;
        scores: number;
        classes: number;
    }
) => {
    console.log('Highlighting results...');

    //Getting predictions
    const boxes = predictions[modelLayer.boxes].arraySync();
    const scores = predictions[modelLayer.scores].arraySync();
    const classes = predictions[modelLayer.classes].dataSync();

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

export const drawCanvas = (image: HTMLImageElement | null, canvas: HTMLCanvasElement | null) => {
    const context = canvas?.getContext('2d');
    if (!context || !image) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return context;
};

const drawBoxes = (
    detections: any[],
    context: any,
    font?: string,
    lineWidth?: number,
    color?: string,
    ratioX?: number,
    ratioY?: number
) => {
    detections.forEach((item: any, i: number) => {
        const x = item['bbox'][0] * (ratioX || 1);
        const y = item['bbox'][1] * (ratioY || 1);
        const width = item['bbox'][2] * (ratioX || 1);
        const height = item['bbox'][3] * (ratioY || 1);

        if (!font) {
            // Draw the bounding box.
            context.strokeStyle = color || '#00FFFF';
            context.lineWidth = lineWidth || 4;
            context.strokeRect(x, y, width, height);
            return context;
        } else {
            // const content = item['label'] + ' ' + (100 * item['score']).toFixed(2) + '%';

            // Font options.
            context.font = font;
            context.textBaseline = 'middle';
            context.textAlign = 'center';

            const textHeight = parseInt(font, 10) / 2; // base 10
            context.beginPath();
            context.strokeStyle = color || '#00FFFF';
            context.arc(x + textHeight, y + textHeight, textHeight, 0, 2 * Math.PI);

            context.stroke();
            context.fillStyle = color || '#00FFFF';
            context.fill();

            // Draw the text last to ensure it's on top.
            context.fillStyle = '#FFFFFF';
            const number = i + 1;
            context.fillText(number, x + textHeight, y + textHeight);

            return context;
        }
    });
};

interface Component {
    id: string;
    bbox: number[];
    label: string;
}

interface Components extends Array<Component> {}

export interface Item {
    id: string;
    width: number;
    height: number;
    path: string;
    data: Uint8Array;
    components: {id: string; bbox: number[]; label: string}[];
}

export interface Items extends Array<Item> {}

//BoxMatcher 코드 시작

const cosine = stringComparison.cosine;

const boxArea = ([, , w, h]) => {
    return w * h;
};

const computeOverlappingArea = ([x1, y1, w1, h1], [x2, y2, w2, h2]) => {
    const points1 = [
        [x1, y1],
        [x1 + w1, y1],
        [x1 + w1, y1 + h1],
        [x1, y1 + h1],
    ];

    const points2 = [
        [x2, y2],
        [x2 + w2, y2],
        [x2 + w2, y2 + h2],
        [x2, y2 + h2],
    ];

    return getOverlapSize(points1, points2);
};

const computeIoU = (component, detection) => {
    const overlap = computeOverlappingArea(component.bbox, detection.bbox);
    const union = boxArea(component.bbox) + boxArea(detection.bbox);

    return overlap / (union - overlap);
};

// const compareSize = (component, detection) => {
//     const overall = 360 * 640;
//     const ads: number = Math.abs(boxArea(component.bbox) / overall - boxArea(detection.bbox) / overall);
//     // console.log(ads);
//     return ads;
// };
export const matchBoxes = (components, detections) => {
    detections.forEach((detection) => {
        components.forEach((component) => {
            const iou = computeIoU(component, detection);
            const similarity = cosine.similarity(component.label, detection.label);

            // check if two boxes overlapped and Check how similar the two labels of cosine are
            if (iou >= 0.5) {
                detection['iou'] = iou;
                detection['labelSimilarity'] = similarity;
                detection['design'] = component;
            }
        });
    });

    return detections;
};

const drawCorrection = (matched) => {
    const corrections: any = [];

    matched.forEach((match) => {
        !match.iou ? corrections.push(match) : match.labelSimilarity < 0.5 ? corrections.push(match) : null;
    });
    return corrections;
};

export const runPredict = async (
    image: HTMLImageElement | null,
    c: HTMLCanvasElement | null,
    model: any,
    classesDir: {name: string; id: number}[],
    modelLayer: {
        boxes: number;
        scores: number;
        classes: number;
    },
    components: Components,
    width: number,
    height: number
) => {
    try {
        const font = '16px sans-serif';
        const context = drawCanvas(image, c);

        postAlert('alert', 'Getting Components from Figma');

        const ratioX = c.width / width;
        const ratioY = c.height / height;
        console.log('components: ', components);
        drawBoxes(components, context, null, 2, '#FFA500', ratioX, ratioY);

        // Draw Prediction
        postAlert('alert', 'Predicting...');

        const expandedimg = loadImage(image);
        const predictions = await predict(expandedimg, model);
        const detections: any = renderPredictions(
            predictions,
            image?.width || 0,
            image?.height || 0,
            classesDir,
            modelLayer
        );
        console.log('interpreted: ', detections);
        drawBoxes(detections, context, null, 2, '#00FFFF', null, null);

        // Matched designs and predictions
        const matched = matchBoxes(components, detections);
        const corrections = drawCorrection(matched);
        console.log('corrections: ', corrections);
        drawBoxes(corrections, context, font, null, '#FF0000');
    } catch (e) {
        console.log(e);
    }
};
