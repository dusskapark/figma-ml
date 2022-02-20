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

async function getExportComponentFromDocumnet(componentSet: any) {
    let assetName = toAndroidResourceName(componentSet.name);

    const children = [];
    componentSet.children.forEach((child) => {
        children.push({id: child.id, name: child.name});
    });

    let exportSetting: ExportSettingsImage = {
        format: 'PNG',
    };

    const imageData = await (<ExportMixin>componentSet.defaultVariant).exportAsync(exportSetting);

    const annotation = {
        id: componentSet.id,
        name: assetName,
        children: children,
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
    model: 'https://raw.githubusercontent.com/dusskapark/design-system-detector/master/clay/models/mobilenetv2-50k/web-model/model.json',
    label_map:
        'https://raw.githubusercontent.com/dusskapark/design-system-detector/master/clay/models/mobilenetv2-50k/web-model/label_map.json',
    saved_model_cli: {
        boxes: 5,
        scores: 4,
        classes: 0,
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

const recursive = (nodes, components, _x: number, _y: number, compareHeight: number) => {
    // recursive function for manipulating components
    // pick components
    let pick = Math.floor(Math.random() * components.length);
    let pickedComponent: ComponentNode = components[pick];
    let instanced: InstanceNode = pickedComponent.createInstance();

    compareHeight = instanced.height > compareHeight ? instanced.height : compareHeight;

    if (_x + instanced.width <= 640) {
        // place the component
        instanced.x = _x;
        instanced.y = _y;
        nodes.push(instanced);
    } else {
        _y = _y + compareHeight + 16;
        compareHeight = 0;
        instanced.x = 0;
        instanced.y = _y;
        nodes.push(instanced);
    }
    _x = _x + instanced.width + 16;
    if (_y < 640) {
        return recursive(nodes, components, _x, _y, compareHeight);
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
    if (figma.command === 'assets') {
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
                        type: 'assets',
                        annotation: annotation,
                    });
                })
                .catch((error) => {
                    figma.closePlugin(error.message);
                });
        }

        figma.ui.onmessage = (msg) => {
            if (msg.type === 'generate-assets') {
                // create a new page
                const newPage: PageNode = figma.createPage();
                newPage.name = 'Figma-ML';
                figma.currentPage = newPage;
                // Load components
                let components: any[] = [];
                components = components.concat(figma.root.findAll((child) => child.type === 'COMPONENT'));

                for (let index = 0; index < msg.message; index++) {
                    // create a new frame
                    const newFrame: FrameNode = figma.createFrame();
                    newFrame.name = `image_${index + 1}`;
                    newFrame.resize(640, 640);
                    newFrame.paddingRight = 20;
                    newFrame.x = 640 * (index % 19) + 20 * (index % 19);
                    newFrame.y = 640 * Math.floor(index / 19) + 20 * Math.floor(index / 19);
                    const nodes = recursive([], components, 0, 0, 0);
                    nodes.forEach((element) => {
                        newFrame.appendChild(element);
                    });
                }
            }
        };
    }
}
main();
