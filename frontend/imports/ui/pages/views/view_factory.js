export const available_views = [
    //{"type" : "vega-scatterplot", "min_num_datasources" : 2, "max_num_datasources" : 3},
    {"type" : "regl-scatterplot", "min_num_datasources" : 2, "max_num_datasources" : 3},
    {"type" : "scatterplot PCA", "min_num_datasources" : 2, "max_num_datasources" : 50},
    {"type" : "plotly-parallelcoords", "min_num_datasources" : 2, "max_num_datasources" : 30},
    {"type" : "anatomical-view", "min_num_datasources" : 0, "max_num_datasources" : 3},
    {"type" : "voltage-trace", "min_num_datasources" : 0, "max_num_datasources" : 3},
    {"type" : "time-control", "min_num_datasources" : 0, "max_num_datasources" : 3}
]


export const default_spec = [
    /*
    {
        "type": "vega-scatterplot",
        "min_num_datasources": 2,
        "max_num_datasources": 2,
        "id": 1,
        "data_sources": [
            "center_x",
            "center_y"
        ]
    },
    {
        "type": "vega-scatterplot",
        "min_num_datasources": 2,
        "max_num_datasources": 2,
        "id": 2,
        "data_sources": [
            "column_height_avg",
            "column_volume_avg"
        ]
    },
    {
        "type": "regl-scatterplot",
        "min_num_datasources": 2,
        "max_num_datasources": 2,
        "id": 3,
        "data_sources": [
            "radius",
            "barrel_volume_avg"
        ]
    },*/    
    {
        "type": "regl-scatterplot",
        "min_num_datasources": 2,
        "max_num_datasources": 3,
        "id": 7,
        "data_sources": [
            "ephys.CaDynamics_E2_v2.apic.decay",
            "ephys.CaDynamics_E2_v2.apic.gamma",
        ]
    },
    {
        "type": "regl-scatterplot",
        "min_num_datasources": 2,
        "max_num_datasources": 3,
        "id": 8,
        "data_sources": [
            "ephys.CaDynamics_E2_v2.apic.decay",
            "ephys.CaDynamics_E2_v2.axon.gamma",
        ]
    },
    {
        "type": "regl-scatterplot",
        "min_num_datasources": 2,
        "max_num_datasources": 3,
        "id": 9,
        "data_sources": [
            "ephys.Ca_LVAst.apic.gCa_LVAstbar",
            "ephys.CaDynamics_E2_v2.soma.decay",
            "ephys.Ca_LVAst.apic.gCa_LVAstbar",
        ]
    },/*
    {
        "type": "plotly-parallelcoords",
        "min_num_datasources": 2,
        "max_num_datasources": 30,
        "id": 4,
        "data_sources": [
            "barrel_bottom_avg",
            "barrel_top_avg",
            "column_height_avg",
            "column_volume_avg",
            "barrel_top_avg",
            "column_height_avg",
            "column_volume_avg",
            "center_x",
            "center_y",
            "center_z",
            "radius"
        ]
    },*/
    {
        "type": "plotly-parallelcoords",
        "min_num_datasources": 2,
        "max_num_datasources": 30,
        "id": 5,
        "data_sources": [
            "ephys.CaDynamics_E2_v2.apic.decay",
            "ephys.CaDynamics_E2_v2.apic.gamma",
            "ephys.CaDynamics_E2_v2.soma.decay",
            "ephys.CaDynamics_E2_v2.axon.gamma",
            "ephys.Ca_LVAst.apic.gCa_LVAstbar"
        ]
    },{        
        "type": "plotly-parallelcoords",
        "min_num_datasources": 2,
        "max_num_datasources": 30,
        "id": 6,
        "data_sources": [
            "1BAC_APheight.normalized",
            "1BAC_ISI.normalized",
            "1BAC_ahpdepth",
            "1BAC_caSpike_height",
            "1BAC.err"
        ]        
    },{
        "type": "anatomical-view",
        "min_num_datasources": 0,
        "max_num_datasources": 3,
        "id": 10,
        "data_sources": []
    },{
        "type": "voltage-trace",
        "min_num_datasources": 0,
        "max_num_datasources": 3,
        "id": 11,
        "data_sources": []
    },{
        "type": "time-control",
        "min_num_datasources": 0,
        "max_num_datasources": 3,
        "id": 12,
        "data_sources": []
    }
]


const default_spec_parameter_analysis = [
    
]