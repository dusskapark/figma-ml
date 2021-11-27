import * as React from 'react';
import {createAssetsPreview, getPNGAssetsFromPluginMessage} from './createAssetsPreview';
import '../styles/ui.css';

declare function require(path: string): any;

const App = () => {
    // const onCancel = () => {
    //     parent.postMessage({pluginMessage: {type: 'cancel'}}, '*');
    // };

    React.useEffect(() => {
        // This is how we read messages sent from the plugin controller
        window.onmessage = async (event) => {
            const pluginMessage = event.data.pluginMessage;
            // Export PNG
            if (pluginMessage.type === 'export-png') {
                const assets = await getPNGAssetsFromPluginMessage(pluginMessage);
                createAssetsPreview(assets);
            }
        };
    }, []);

    return (
        <div id="app">
            <div id="content"></div>
            <footer id="footer"></footer>
        </div>
    );
};

export default App;
