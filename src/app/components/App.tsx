import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import '../styles/ui.css';
import {uint8ArrayToObjectURL} from './ImageHandling';
import Detection from './Detection';

declare function require(path: string): any;

const App = () => {
    const [assets, setAssets] = React.useState(null);
    const [checkItems, setCheckItems] = React.useState([]);
    const [detections, setDetections] = React.useState(false);

    const getPNGAssetsFromPluginMessage = async (
        pluginMessage: any
    ): Promise<{id: string; path: string; data: Uint8Array}[]> => {
        let assets: any[] = [];
        let exports = pluginMessage.exportImages;
        exports.forEach((item) => {
            assets.push({
                id: item.id,
                path: item.path,
                data: item.imageData,
            });
        });
        return assets;
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

    const handleProps = (ids: string[], assets: {id: string; path: string; data?: Uint8Array; base64?: string}[]) => {
        let images: any[] = [];
        ids.forEach((id) => {
            const image = assets.filter((x) => x.id === id);
            images.push(image[0]);
        });

        return images;
    };

    React.useEffect(() => {
        // This is how we read messages sent from the plugin controller
        window.onmessage = async (event: any) => {
            const pluginMessage = event.data.pluginMessage;
            // Export PNG
            if (pluginMessage.type === 'export-png') {
                const png = await getPNGAssetsFromPluginMessage(pluginMessage);
                setAssets(png);
                setCheckItems(createIDArray(png));
            }
            if (pluginMessage.type === 'test') {
            }
        };
    }, []);

    return (
        <div id="app">
            {/* Loading */}
            {assets === null ? (
                <React.Fragment>
                    <Box sx={{display: 'flex'}}>
                        <CircularProgress />
                    </Box>
                </React.Fragment>
            ) : detections ? (
                <React.Fragment>
                    <Detection assets={handleProps(checkItems, assets)} />
                </React.Fragment>
            ) : (
                <React.Fragment>
                    <div id="content">
                        {assets.map(
                            (asset: {id: string; path: string; data?: Uint8Array; base64?: string}, index: number) => (
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
                                setDetections(true);
                            }}
                        >
                            Next
                        </button>
                    </footer>
                </React.Fragment>
            )}
        </div>
    );
};

export default App;
