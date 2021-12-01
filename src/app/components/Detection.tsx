import * as React from 'react';
import {useTheme} from '@mui/material/styles';
import {KeyboardArrowLeft, KeyboardArrowRight} from '@mui/icons-material';
import SwipeableViews from 'react-swipeable-views';

import {Box, MobileStepper, Paper, Button} from '@mui/material';
import FullWidthTabs from './FullWidthTabs';

// import VerticalLinearStepper from './VerticalLinearStepper';

function Detection(props) {
    const [activeStep, setActiveStep] = React.useState(0);

    const {model, data, classesDir} = props;
    const theme = useTheme();
    const maxSteps = data.length;

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStepChange = (step: number) => {
        setActiveStep(step);
    };

    return (
        <Box sx={{maxWidth: 360, flexGrow: 1}}>
            <SwipeableViews
                axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                index={activeStep}
                onChangeIndex={handleStepChange}
                enableMouseEvents
            >
                {data.map((step, index) => (
                    <div key={step.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {Math.abs(activeStep - index) <= 2 ? (
                            <FullWidthTabs step={step} model={model} classesDir={classesDir} />
                        ) : null}
                    </div>
                ))}
            </SwipeableViews>
            <Paper sx={{position: 'fixed', bottom: 0, left: 0, right: 0}} elevation={3}>
                <MobileStepper
                    steps={maxSteps}
                    position="static"
                    activeStep={activeStep}
                    nextButton={
                        <Button size="small" onClick={handleNext} disabled={activeStep === maxSteps - 1}>
                            Next
                            {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
                        </Button>
                    }
                    backButton={
                        <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
                            {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
                            Back
                        </Button>
                    }
                />
            </Paper>
        </Box>
    );
}

export default Detection;
