import {ExtractComponents, toAndroidResourceName} from './extractComponents';

async function getExportImagesFromLayer(layer: any) {
    let assetName = toAndroidResourceName(layer.name);

    let exportSetting: ExportSettingsImage = {
        format: 'PNG',
    };

    const imageData = await (<ExportMixin>layer).exportAsync(exportSetting);
    const components = ExtractComponents(layer);

    const images = {
        id: layer.id,
        width: Math.round(layer.width),
        height: Math.round(layer.height),
        path: assetName + '.png',
        data: imageData,
        components: components,
    };

    return images;
}
const recursiveName = (node) => {
    if (node.parent == null) return;
    if (node.parent.type == 'PAGE') {
        const label = toAndroidResourceName(node.name);
        return label;
    }
    return recursiveName(node.parent);
};
async function getExportComponentFromDocumnet(componentSet: ComponentSetNode) {
    let assetName = toAndroidResourceName(componentSet.name);
    let pageName = recursiveName(componentSet);

    let exportSetting: ExportSettingsImage = {
        format: 'PNG',
    };

    const imageData = await (<ExportMixin>componentSet.defaultVariant).exportAsync(exportSetting);

    const annotation = {
        id: componentSet.id,
        name: assetName,
        path: pageName,
        children: componentSet.children,
        data: imageData,
    };

    return annotation;
}

function getParentPage(node: BaseNode): PageNode {
    let parent = node.parent;
    if (node.parent) {
        while (parent && parent.type !== 'PAGE') {
            parent = parent.parent;
        }
        return parent as PageNode;
    }
    return figma.currentPage;
}

interface Model {
    name: string;
    model: string;
    label_map: string;
    saved_model_cli: {
        boxes: number;
        scores: number;
        classes: number;
    };
}

const defaultModel: Model = {
    name: 'CLAY',
    model: 'https://raw.githubusercontent.com/dusskapark/design-system-detector/master/clay/models/mobilenetv2-8k/web-model/model.json',
    label_map:
        'https://raw.githubusercontent.com/dusskapark/design-system-detector/master/clay/models/mobilenetv2-8k/web-model/label_map.json',
    saved_model_cli: {
        boxes: 5,
        scores: 6,
        classes: 3,
    },
};

const updateModel = (message) => {
    let msg = JSON.parse(message);
    const model: Model = {
        name: msg.name,
        model: msg.model,
        label_map: msg.label_map,
        saved_model_cli: {
            boxes: msg.boxes,
            scores: msg.scores,
            classes: msg.classes,
        },
    };
    return model;
};

const recursive = (
    dataset: {id: string}[],
    _x: number,
    _y: number,
    compareHeight?: number | 0,
    node?: any[] | any[],
    nodes?: any[] | any[]
) => {
    // recursive function for manipulating components

    // pick components
    let pick = Math.floor(Math.random() * dataset.length);
    let pickedComponentId = dataset[pick].id;
    const instanced: InstanceNode = (figma.getNodeById(pickedComponentId) as ComponentNode).createInstance();

    // set initial data
    compareHeight = instanced.height > compareHeight ? instanced.height : compareHeight;

    // place instances
    if (_x + instanced.width <= 640 && _y + instanced.height <= 640) {
        instanced.x = _x;
        instanced.y = _y;
        node.push(instanced);

        _x = _x + instanced.width + 16;
    } else if (_x + instanced.width > 640 && _y + instanced.height <= 640) {
        instanced.x = 0;
        instanced.y = _y + compareHeight + 16;

        _x = 0 + instanced.width + 16;
        _y = _y + compareHeight + 16;
        compareHeight = instanced.height;
        node.push(instanced);
    } else {
        // push and reset arrays
        nodes.push(node);
        node = [];
        instanced.x = 0;
        instanced.y = 0;
        node.push(instanced);

        _x = 0 + instanced.width + 16;
        _y = 0;
        compareHeight = instanced.height;
    }

    // update the dataset
    dataset.splice(pick, 1);

    if (dataset.length > 0) {
        return recursive(dataset, _x, _y, compareHeight, node, nodes);
    } else {
        return nodes;
    }
};

async function main() {
    const filename = toAndroidResourceName(figma.root.name);

    // Check a currently loaded model. If undifined, set the default model.
    const current = await figma.clientStorage.getAsync(filename);
    const current_model = !current ? defaultModel : current;

    // update Client Storage
    await figma.clientStorage.setAsync(filename, current_model);

    if (figma.command === 'model') {
        figma.showUI(__html__, {width: 360, height: 480});
        figma.ui.postMessage({
            type: 'model',
            current_model: current_model,
        });
        figma.ui.onmessage = async (msg) => {
            if (msg.type === 'config-model') {
                const model_value = updateModel(msg.message);
                console.log('plugin: ', model_value);
                await figma.clientStorage.setAsync(filename, model_value);
                figma.notify(`${model_value.name} is set as a model`, {timeout: 1000});
            }
        };
    }
    if (figma.command === 'predict') {
        const currentPage = figma.currentPage;
        const selectedLayers = currentPage.selection;

        // Get all exportable layers
        let exportableLayers: any[] = [];
        if (selectedLayers.length === 0) {
            figma.closePlugin('Please select at least 1 layer.');
        } else {
            selectedLayers.forEach((layer) => {
                if (layer.type === 'SLICE' || (<ExportMixin>layer).exportSettings.length > 0) {
                    exportableLayers.push(layer);
                }
                if (layer.type === 'GROUP') {
                    exportableLayers = exportableLayers.concat(
                        (<ChildrenMixin>layer).findAll(
                            (child) => child.type === 'SLICE' || (<ExportMixin>child).exportSettings.length > 0
                        )
                    );
                }
            });

            if (exportableLayers.length === 0) {
                figma.closePlugin('No exportable layers in document.');
            } else {
                Promise.all(exportableLayers.map((layer) => getExportImagesFromLayer(layer)))
                    .then((exportImages) => {
                        // const uiHeight = Math.min(exportableLayers.length * 48 + 16 + 48, 400);
                        // figma.showUI(__html__, {width: 300, height: uiHeight});
                        figma.showUI(__html__, {width: 360, height: 640 + 48 + 48});
                        figma.ui.postMessage({
                            type: 'export-png',
                            exportImages: exportImages,
                            current_model: current_model,
                        });
                    })
                    .catch((error) => {
                        figma.closePlugin(error.message);
                    });

                figma.ui.onmessage = (msg) => {
                    // Show layer
                    if (msg.type === 'showLayer') {
                        const layerId = msg.id;
                        const layer = figma.getNodeById(layerId);
                        const page = getParentPage(layer);
                        figma.currentPage = page;
                        figma.viewport.scrollAndZoomIntoView([layer]);
                    }

                    if (msg.type === 'alert') {
                        figma.notify(msg.message, {timeout: 1000});
                    }
                };
            }
        }
    }
    if (figma.command === 'dataset') {
        const currentPage = figma.currentPage;
        const selectedLayers = currentPage.selection;

        // Get all exportable layers
        let exportableLayers: any[] = [];
        if (selectedLayers.length === 0) {
            figma.closePlugin('Please select at least 1 layer.');
        } else {
            selectedLayers.forEach((layer) => {
                if (layer.type === 'SLICE' || (<ExportMixin>layer).exportSettings.length > 0) {
                    exportableLayers.push(layer);
                }
                if (layer.type === 'GROUP') {
                    exportableLayers = exportableLayers.concat(
                        (<ChildrenMixin>layer).findAll(
                            (child) => child.type === 'SLICE' || (<ExportMixin>child).exportSettings.length > 0
                        )
                    );
                }
            });

            if (exportableLayers.length === 0) {
                figma.closePlugin('No exportable layers in document.');
            } else {
                Promise.all(exportableLayers.map((layer) => getExportImagesFromLayer(layer)))
                    .then((exportImages) => {
                        const uiHeight = Math.min(exportableLayers.length * 48 + 16 + 48, 400);
                        figma.showUI(__html__, {width: 360, height: uiHeight});
                        figma.ui.postMessage({
                            type: 'dataset',
                            exportImages: exportImages,
                        });
                    })
                    .catch((error) => {
                        figma.closePlugin(error.message);
                    });
            }
        }
    }
    if (figma.command === 'annotation') {
        // Load components
        let componentSet: any[] = [];
        componentSet = componentSet.concat(figma.root.findAll((child) => child.type === 'COMPONENT_SET'));

        if (componentSet.length === 0) {
            figma.closePlugin('No Component in document.');
        } else {
            Promise.all(componentSet.map((component) => getExportComponentFromDocumnet(component)))
                .then((annotation) => {
                    figma.showUI(__html__, {width: 360, height: 640});
                    figma.ui.postMessage({
                        type: 'annotation',
                        annotation: annotation,
                    });
                })
                .catch((error) => {
                    figma.closePlugin(error.message);
                });
        }
        const generateDataset = (data: {id: string; multiple: number; children: ComponentNode[]}[]) => {
            const dataset = [];

            data.forEach((element) => {
                const array = element.children;
                // for (let index = 0; index < element.multiple; index++) {
                array.forEach((component) => {
                    dataset.push(component);
                });
                // }
            });
            return dataset;
        };

        figma.ui.onmessage = (msg) => {
            if (msg.type === 'generate-assets') {
                // create a new page
                const newPage: PageNode = figma.createPage();
                newPage.name = 'Figma-ML';
                figma.currentPage = newPage;

                // Load components
                Promise.all(generateDataset(msg.data))
                    .then((dataset) => {
                        console.log(dataset);
                        const children = recursive(dataset, 0, 0, 0, [], []);

                        for (let index = 0; index < children.length; index++) {
                            const elements = children[index];

                            // create a new frame
                            const newFrame: FrameNode = figma.createFrame();
                            newFrame.name = `image_${index + 1}`;
                            newFrame.resize(640, 640);
                            newFrame.paddingRight = 20;
                            newFrame.x = 640 * (index % 19) + 20 * (index % 19);
                            newFrame.y = 640 * Math.floor(index / 19) + 20 * Math.floor(index / 19);

                            elements.forEach((element: InstanceNode) => {
                                newFrame.appendChild(element);
                            });
                        }
                    })
                    .catch((error) => {
                        figma.closePlugin(error.message);
                    });
            }
        };
    }
}
main();
