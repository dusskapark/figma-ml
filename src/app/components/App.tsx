import * as React from 'react';
import axios from 'axios';
import {Box, CircularProgress} from '@mui/material';

import '../styles/ui.css';
import {uint8ArrayToObjectURL} from './ImageHandling';
import Predict from './Predict';
import Connect from './Connect';
import JSZip from 'jszip';

declare function require(path: string): any;

const App = () => {
    const [assets, setAssets] = React.useState(null);
    const [checkItems, setCheckItems] = React.useState([]);
    const [ableToPredict, setAbleToPredict] = React.useState(false);
    const [model, setModel] = React.useState(null);
    const [classesDir, setClassesDir] = React.useState(null);
    const [modelLayer, setModelLayer] = React.useState(null);
    const [mode, setMode] = React.useState(null);
    const [config, setConfig] = React.useState(null);
    const exportButton = React.useRef<HTMLButtonElement>(null);

    const newWindowObject = window as any;
    let tf = newWindowObject.tf;

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

    const loadModel = async (model: Model) => {
        try {
            const loadedModel = await tf.loadGraphModel(model.model);
            const classesDir = await axios.get(model.label_map);

            setModel(loadedModel);
            setClassesDir(classesDir.data);
            setModelLayer(model.saved_model_cli);
        } catch (e) {
            console.log(e);
        }
    };

    // 체크박스 전체 단일 개체 선택
    const handleSingleCheck = (checked: boolean, id: string) => {
        if (checked) {
            setCheckItems([...checkItems, id]);
        } else {
            // 체크 해제
            setCheckItems(checkItems.filter((el) => el !== id));
        }
    };

    const createIDArray = (array) => {
        const idArray = [];
        array.forEach((element: {id: string; path: string; data?: Uint8Array; base64?: string}) =>
            idArray.push(element.id)
        );
        return idArray;
    };

    // 체크박스 전체 선택
    const handleAllCheck = (checked: boolean, assets: any) => {
        if (checked) {
            // 전체 체크 박스가 체크 되면 id를 가진 모든 elements를 배열에 넣어주어서,
            // 전체 체크 박스 체크
            setCheckItems(createIDArray(assets));
        }

        // 반대의 경우 전체 체크 박스 체크 삭제
        else {
            setCheckItems([]);
        }
    };

    // 선택된 체크박스의 데이터만 전송

    const handleProps = (
        ids: string[],
        assets: {id: string; path: string; data?: Uint8Array; width: number; height: number; base64?: string}[]
    ) => {
        let images: any[] = [];
        ids.forEach((id) => {
            const image = assets.filter((x) => x.id === id);
            images.push(image[0]);
        });

        return images;
    };
    interface Component {
        id: string;
        bbox: number[];
        label: string;
    }
    const generateObjects = (components: Component[]) => {
        let annotation;
        components.forEach((component: Component) => {
            let xmin = component.bbox[0];
            let ymin = component.bbox[1];
            let xmax = component.bbox[0] + component.bbox[2];
            let ymax = component.bbox[1] + component.bbox[3];
            const object =
                '    <object>\n' +
                '        <name>' +
                component.label +
                '</name>\n' +
                '        <difficult>0</difficult>\n' +
                '        <bndbox>\n' +
                '            <xmin>' +
                xmin +
                '</xmin>\n' +
                '            <ymin>' +
                ymin +
                '</ymin>\n' +
                '            <xmax>' +
                xmax +
                '</xmax>\n' +
                '            <ymax>' +
                ymax +
                '</ymax>\n' +
                '        </bndbox>\n' +
                '    </object>\n';
            annotation += object;
        });
        return annotation;
    };

    const exportXML = (asset: {
        id: string;
        path: string;
        data?: Uint8Array;
        width: number;
        height: number;
        components: any[];
    }) => {
        const xml =
            '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<annotation>\n' +
            '    <folder />\n' +
            '    <filename>' +
            asset.id +
            '.png</filename>\n' +
            '    <path>' +
            asset.id +
            '.png</path>\n' +
            '    <source>\n' +
            '        <database>Figma ML</database>\n' +
            '    </source>\n' +
            '    <size>\n' +
            '        <width>' +
            asset.width +
            '</width>\n' +
            '        <height>' +
            asset.height +
            '</height>\n' +
            '        <depth>3</depth>\n' +
            '    </size>\n' +
            generateObjects(asset.components) +
            '\n' +
            '</annotation>';
        return xml;
    };
    const exportDataset = () => {
        if (checkItems.length === 0) {
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'alert',
                        text: 'Please select at least 1 asset to export.',
                    },
                },
                '*'
            );
            return;
        }
        exportButton.current.disabled = true;
        const zip = new JSZip();
        for (let item of checkItems) {
            let file = assets.filter((x) => x.id === item)[0];
            let xml = exportXML(file);
            console.log(file);
            zip.file(file.id + '.xml', xml);
            zip.file(file.id + '.png', file.data);
        }
        zip.generateAsync({type: 'blob'}).then((content: Blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'assets_' + formatDate() + '.zip';
            link.click();
        });
        exportButton.current.disabled = false;
    };

    function formatDate(): string {
        let d = new Date();
        let result = '' + d.getFullYear();
        result += (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1);
        result += (d.getDate() < 10 ? '0' : '') + d.getDate();
        result += (d.getHours() < 10 ? '0' : '') + d.getHours();
        result += (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        result += (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
        return result;
    }
    React.useEffect(() => {
        // This is how we read messages sent from the plugin controller
        window.onmessage = async (event: any) => {
            const pluginMessage = event.data.pluginMessage;
            // Export PNG
            if (pluginMessage.type === 'export-png') {
                const png = await pluginMessage.exportImages;
                const current_model = await pluginMessage.current_model;
                setMode('export-png');
                setAssets(png);
                setCheckItems(createIDArray(png));
                loadModel(current_model);
            }
            if (pluginMessage.type === 'model') {
                const current_model = await pluginMessage.current_model;
                setConfig(current_model);
                setMode('model');
            }
            if (pluginMessage.type === 'dataset') {
                setMode('dataset');
                const dataset = await pluginMessage.exportImages;
                setAssets(dataset);
                setCheckItems(createIDArray(dataset));
            }
        };
    }, []);

    const isReady = !!model && !!classesDir && !!assets;

    return (
        <div id="app">
            {mode === 'dataset' && !!assets ? (
                <React.Fragment>
                    <div id="content">
                        {assets.map(
                            (
                                asset: {
                                    id: string;
                                    path: string;
                                    data?: Uint8Array;
                                    width: number;
                                    height: number;
                                    base64?: string;
                                },
                                index: number
                            ) => (
                                <div key={index} className="export-item">
                                    <label className="export-item__checkbox">
                                        <input
                                            type="checkbox"
                                            id={asset.id}
                                            className="checkbox"
                                            onChange={(e) => handleSingleCheck(e.target.checked, asset.id)}
                                            checked={checkItems.indexOf(asset.id) !== -1 ? true : false}
                                        />
                                    </label>
                                    <div className="export-item__thumb">
                                        <img
                                            src={uint8ArrayToObjectURL(asset.data)}
                                            onClick={() => {
                                                parent.postMessage(
                                                    {
                                                        pluginMessage: {
                                                            type: 'showLayer',
                                                            id: asset.id,
                                                        },
                                                    },
                                                    '*'
                                                );
                                            }}
                                        />
                                    </div>
                                    <div className="type type--11-pos export-item__text">
                                        <label htmlFor={asset.id}>{asset.path}</label>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                    <footer id="footer">
                        <label className="selectAll__wrap">
                            <input
                                type="checkbox"
                                className="checkbox"
                                id="selectAll"
                                onChange={(e) => handleAllCheck(e.target.checked, assets)}
                                checked={checkItems.length === assets.length ? true : false}
                            />
                        </label>
                        <div className="type type--11-pos selectAll__label">
                            <label htmlFor="selectAll">
                                {checkItems.length} / {assets.length}
                            </label>
                        </div>
                        <button ref={exportButton} className="button button--primary" onClick={() => exportDataset()}>
                            Download
                        </button>
                    </footer>
                </React.Fragment>
            ) : null}
            {mode === 'model' ? (
                <Box p={2} sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
                    <Connect config={config} />
                </Box>
            ) : null}
            {mode === 'export-png' ? (
                !isReady ? (
                    <React.Fragment>
                        <Box
                            p={2}
                            sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}
                        >
                            <CircularProgress />
                        </Box>
                    </React.Fragment>
                ) : !ableToPredict ? (
                    <React.Fragment>
                        <div id="content">
                            {assets.map(
                                (
                                    asset: {
                                        id: string;
                                        path: string;
                                        data?: Uint8Array;
                                        width: number;
                                        height: number;
                                        base64?: string;
                                    },
                                    index: number
                                ) => (
                                    <div key={index} className="export-item">
                                        <label className="export-item__checkbox">
                                            <input
                                                type="checkbox"
                                                id={asset.id}
                                                className="checkbox"
                                                onChange={(e) => handleSingleCheck(e.target.checked, asset.id)}
                                                checked={checkItems.indexOf(asset.id) !== -1 ? true : false}
                                            />
                                        </label>
                                        <div className="export-item__thumb">
                                            <img
                                                src={uint8ArrayToObjectURL(asset.data)}
                                                onClick={() => {
                                                    parent.postMessage(
                                                        {
                                                            pluginMessage: {
                                                                type: 'showLayer',
                                                                id: asset.id,
                                                            },
                                                        },
                                                        '*'
                                                    );
                                                }}
                                            />
                                        </div>
                                        <div className="type type--11-pos export-item__text">
                                            <label htmlFor={asset.id}>{asset.path}</label>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                        <footer id="footer">
                            <label className="selectAll__wrap">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    id="selectAll"
                                    onChange={(e) => handleAllCheck(e.target.checked, assets)}
                                    checked={checkItems.length === assets.length ? true : false}
                                />
                            </label>
                            <div className="type type--11-pos selectAll__label">
                                <label htmlFor="selectAll">
                                    {checkItems.length} / {assets.length}
                                </label>
                            </div>
                            <button
                                className="button button--primary"
                                onClick={() => {
                                    setAbleToPredict(true);
                                }}
                            >
                                Next
                            </button>
                        </footer>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <Predict
                            data={handleProps(checkItems, assets)}
                            model={model}
                            classesDir={classesDir}
                            modelLayer={modelLayer}
                            setAbleToPredict={setAbleToPredict}
                        />
                    </React.Fragment>
                )
            ) : null}
        </div>
    );
};

export default App;
