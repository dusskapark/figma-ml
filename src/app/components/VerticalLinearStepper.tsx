import * as React from 'react';
import {Box, Stepper, Step, StepLabel, StepContent, Button, Paper, Typography} from '@mui/material';
import {uint8ArrayToObjectURL} from './ImageHandling';

const generateSteps = (data: Uint8Array) => {
    const image = uint8ArrayToObjectURL(data);
    const steps = [
        {
            label: 'Origial',
            description: `The original screen`,
            imageData: image,
        },
        {
            label: 'TensorFlow',
            description: 'The object-detection via TensorFlow',
        },
        {
            label: 'Dictionary',
            description: `The library components in this screen.`,
        },
        {
            label: 'Spell checker',
            description: `Auto-correnctions`,
        },
    ];
    return steps;
};

export default function VerticalLinearStepper(props) {
    const [activeStep, setActiveStep] = React.useState(0);
    const steps = generateSteps(props.step.data);
    const imgRef = React.useRef<HTMLImageElement>(null);
    // const canvasRef = document.getElementById("_1");
    // const {model, data, classesDir} = props.tf;

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <Box sx={{maxWidth: 328}}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel optional={index === 3 ? <Typography variant="caption">Last step</Typography> : null}>
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            {/* <Typography>{step.description}</Typography> */}
                            {index === 0 ? (
                                <img
                                    ref={imgRef}
                                    style={{
                                        display: 'block',
                                        overflow: 'hidden',
                                        maxWidth: '288',
                                        maxHeight: '512',
                                    }}
                                    src={step.imageData}
                                    alt="original"
                                    id="preview"
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <canvas id={`_${index}`} width="288" height="512" />
                            )}
                            <Box sx={{mb: 2}}>
                                <div>
                                    <Button variant="contained" onClick={handleNext} sx={{mt: 1, mr: 1}}>
                                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                    </Button>
                                    <Button disabled={index === 0} onClick={handleBack} sx={{mt: 1, mr: 1}}>
                                        Back
                                    </Button>
                                </div>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === steps.length && (
                <Paper square elevation={0} sx={{p: 3}}>
                    <Typography>All steps completed - you&apos;re finished</Typography>
                    <Button onClick={handleReset} sx={{mt: 1, mr: 1}}>
                        Reset
                    </Button>
                </Paper>
            )}
        </Box>
    );
}
