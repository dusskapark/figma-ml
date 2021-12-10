import * as React from 'react';
import {useTheme} from '@mui/material/styles';
import {KeyboardArrowLeft, KeyboardArrowRight} from '@mui/icons-material';
import {Box, MobileStepper, Paper, Button, AppBar, IconButton, Toolbar, Typography} from '@mui/material';
import Detection from './Detection';

function Predict(props) {
    const [activeStep, setActiveStep] = React.useState(0);

    const {model, data, classesDir, modelLayer, setAbleToPredict} = props;
    const theme = useTheme();
    const maxSteps = data.length;

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Box sx={{maxWidth: 360, flexGrow: 1}}>
            <AppBar position="static">
                <Toolbar variant="dense">
                    <IconButton
                        onClick={() => {
                            setAbleToPredict(false);
                        }}
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{mr: 2}}
                    >
                        <KeyboardArrowLeft />
                    </IconButton>
                    <Typography variant="subtitle1" color="inherit" component="div">
                        {data[activeStep].path}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Detection item={data[activeStep]} model={model} classesDir={classesDir} modelLayer={modelLayer} />

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

export default Predict;
