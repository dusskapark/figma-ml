import * as React from 'react';
import {useFormik} from 'formik';
import * as yup from 'yup';

import {Box, Button, Grid, TextField} from '@mui/material';

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

const Connect = (props) => {
    const config: Model = props.config;

    const formik = useFormik({
        initialValues: {
            name: config.name,
            model: config.model,
            label_map: config.label_map,
            boxes: config.saved_model_cli.boxes,
            scores: config.saved_model_cli.scores,
            classes: config.saved_model_cli.classes,
        },
        validationSchema: yup.object({
            name: yup.string().required(),
            model: yup.string().url().required('URL is required'),
            label_map: yup.string().url().required('URL is required'),
            boxes: yup.number().max(99, 'The layer number cannot exceed two digits.').required(),
            scores: yup.number().max(99, 'The layer number cannot exceed two digits.').required(),
            classes: yup.number().max(99, 'The layer number cannot exceed two digits.').required(),
        }),
        onSubmit: (values) => {
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'config-model',
                        message: JSON.stringify(values),
                    },
                },
                '*'
            );
        },
    });

    return (
        <form onSubmit={formik.handleSubmit}>
            <Box padding={2}>
                <TextField
                    required
                    id="name"
                    label="Name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    fullWidth
                    size="small"
                    margin="normal"
                />
                <TextField
                    required
                    id="model"
                    label="Model URL"
                    value={formik.values.model}
                    onChange={formik.handleChange}
                    error={formik.touched.model && Boolean(formik.errors.model)}
                    fullWidth
                    size="small"
                    margin="normal"
                />
                <TextField
                    required
                    id="label_map"
                    label="Label Map"
                    value={formik.values.label_map}
                    onChange={formik.handleChange}
                    error={formik.touched.label_map && Boolean(formik.errors.label_map)}
                    fullWidth
                    size="small"
                    margin="normal"
                />
            </Box>

            <Grid id="saved_model_cli" container spacing={{xs: 2}} marginTop={2} padding={2}>
                <Grid item xs={4}>
                    <TextField
                        required
                        id="boxes"
                        label="Boxes"
                        type="number"
                        value={formik.values.boxes}
                        onChange={formik.handleChange}
                        error={formik.touched.boxes && Boolean(formik.errors.boxes)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        margin="normal"
                    />
                </Grid>
                <Grid item xs={4}>
                    <TextField
                        required
                        id="scores"
                        label="Scores"
                        type="number"
                        value={formik.values.scores}
                        onChange={formik.handleChange}
                        error={formik.touched.scores && Boolean(formik.errors.scores)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        margin="normal"
                    />
                </Grid>
                <Grid item xs={4}>
                    <TextField
                        required
                        id="classes"
                        label="Classes"
                        type="number"
                        value={formik.values.classes}
                        onChange={formik.handleChange}
                        error={formik.touched.classes && Boolean(formik.errors.classes)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        margin="normal"
                    />
                </Grid>
            </Grid>
            <Box padding={2}>
                <Box marginTop={2}>
                    <Button size="large" variant="contained" color="primary" fullWidth type="submit">
                        Update
                    </Button>
                </Box>
            </Box>
        </form>
    );
};

export default Connect;
