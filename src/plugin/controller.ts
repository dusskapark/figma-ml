async function getExportImagesFromLayer(layer: any) {
    let assetName = toAndroidResourceName(layer.name);

    let exportSetting: ExportSettingsImage = {
        format: 'PNG',
    };

    const imageData = await (<ExportMixin>layer).exportAsync(exportSetting);
    const images = {
        id: layer.id,
        width: Math.round(layer.width),
        height: Math.round(layer.height),
        path: assetName + '.png',
        imageData: imageData,
    };

    return images;
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

function toAndroidResourceName(name: string): string {
    name = name.substr(name.lastIndexOf('/') + 1);
    // Latin to ascii
    const latinToAsciiMapping = {
        ae: 'ä|æ|ǽ',
        oe: 'ö|œ',
        ue: 'ü',
        Ae: 'Ä',
        Ue: 'Ü',
        Oe: 'Ö',
        A: 'À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ',
        a: 'à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª',
        C: 'Ç|Ć|Ĉ|Ċ|Č',
        c: 'ç|ć|ĉ|ċ|č',
        D: 'Ð|Ď|Đ',
        d: 'ð|ď|đ',
        E: 'È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě',
        e: 'è|é|ê|ë|ē|ĕ|ė|ę|ě',
        G: 'Ĝ|Ğ|Ġ|Ģ',
        g: 'ĝ|ğ|ġ|ģ',
        H: 'Ĥ|Ħ',
        h: 'ĥ|ħ',
        I: 'Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ',
        i: 'ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı',
        J: 'Ĵ',
        j: 'ĵ',
        K: 'Ķ',
        k: 'ķ',
        L: 'Ĺ|Ļ|Ľ|Ŀ|Ł',
        l: 'ĺ|ļ|ľ|ŀ|ł',
        N: 'Ñ|Ń|Ņ|Ň',
        n: 'ñ|ń|ņ|ň|ŉ',
        O: 'Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ',
        o: 'ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º',
        R: 'Ŕ|Ŗ|Ř',
        r: 'ŕ|ŗ|ř',
        S: 'Ś|Ŝ|Ş|Š',
        s: 'ś|ŝ|ş|š|ſ',
        T: 'Ţ|Ť|Ŧ',
        t: 'ţ|ť|ŧ',
        U: 'Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ',
        u: 'ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ',
        Y: 'Ý|Ÿ|Ŷ',
        y: 'ý|ÿ|ŷ',
        W: 'Ŵ',
        w: 'ŵ',
        Z: 'Ź|Ż|Ž',
        z: 'ź|ż|ž',
        AE: 'Æ|Ǽ',
        ss: 'ß',
        IJ: 'Ĳ',
        ij: 'ĳ',
        OE: 'Œ',
        f: 'ƒ',
    };
    for (let i in latinToAsciiMapping) {
        let regexp = new RegExp(latinToAsciiMapping[i], 'g');
        name = name.replace(regexp, i);
    }
    // Remove no ascii character
    name = name.replace(/[^\u0020-\u007E]/g, '');
    // Remove not support character
    name = name.replace(/[\u0021-\u002B\u003A-\u0040\u005B-\u005E\u0060\u007B-\u007E]/g, '');
    // Remove Unix hidden file
    name = name.replace(/^\./, '');
    // Remove digit
    name = name.replace(/^\d+/, '');
    // Replace , - . to _
    name = name.replace(/[\u002C-\u002E\u005F]/g, '_');
    name = name.trim();
    // Replace space to _
    name = name.replace(/\s+/g, '_');
    name = name.toLowerCase();
    return name === '' ? 'untitled' : name;
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
            figma.root.children.forEach((page) => {
                exportableLayers = exportableLayers.concat(
                    page.findAll((child) => child.type === 'SLICE' || (<ExportMixin>child).exportSettings.length > 0)
                );
            });
        }
        if (exportableLayers.length === 0) {
            figma.closePlugin('No exportable layers in document.');
        } else {
            Promise.all(exportableLayers.map((layer) => getExportImagesFromLayer(layer)))
                .then((exportImages) => {
                    // const uiHeight = Math.min(exportableLayers.length * 48 + 16 + 48, 400);
                    // figma.showUI(__html__, {width: 300, height: uiHeight});
                    figma.showUI(__html__, {width: 360, height: 640});
                    figma.ui.postMessage({
                        type: 'export-png',
                        exportImages: exportImages,
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

                if (msg.type === 'cancel') {
                    figma.closePlugin();
                }
            };
        }
    }
}
