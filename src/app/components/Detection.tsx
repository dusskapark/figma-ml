import * as React from 'react';
import {uint8ArrayToObjectURL, runPredict, Item} from './ImageHandling';

const Detection = (props: {item; model; classesDir}) => {
    const [imgId, setImgId] = React.useState(null);
    const {item, model, classesDir} = props;
    const imgRef = React.useRef<HTMLImageElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const handleImgLoad = async (item: Item) => {
        console.log('image loaded...');
        if (imgId !== item.id) {
            await runPredict(
                imgRef.current,
                canvasRef.current,
                model,
                classesDir,
                item.components,
                item.width,
                item.height
            );

            setImgId(item.id);
        }
    };

    return (
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <img
                ref={imgRef}
                style={{position: 'absolute'}}
                onLoad={() => handleImgLoad(item)}
                src={uint8ArrayToObjectURL(item.data)}
                alt={item.path}
                id={item.id}
                width="360"
                height="640"
                crossOrigin="anonymous"
            />
            <canvas ref={canvasRef} style={{position: 'relative'}} id={`canvas_${item.id}`} width="360" height="640" />
        </div>
    );
};

export default Detection;
