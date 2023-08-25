
import * as d3 from 'd3';


function interpolateViridis(numSteps, reverse=false){
    const scale = d3.scaleSequential(d3.interpolateViridis).domain([0, numSteps-1]);
    let colors = [];
    for(let i=0; i<numSteps; i++){
        colors.push(scale(i));
    }
    if(reverse){
        colors.reverse();   
    }
    return colors;
}

function interpolateBlueRed(numSteps){
    const scale = d3.scaleSequential(d3.interpolateRdBu).domain([0, numSteps-1]);
    let colors = [];
    for(let i=0; i<numSteps; i++){
        colors.push(scale(i));
    }
    colors.reverse();
    return colors;
}

export const viridisColormap = interpolateViridis(100);
export const viridisColormapReverse = interpolateViridis(100, true);
export const blueRedColormap = interpolateBlueRed(100);


export function normalizeArray(arr, min, max) {
    const normalizedArr = arr.map((value) => {
        if(value < min){
            return 0;
        }
        else if(value > max){
            return 1;
        } else {
            return (value - min) / (max - min)
        }        
    });
    return normalizedArr;
}

export function getRGBFromString(colorStr){
    return colorStr.substring(colorStr.indexOf('(') + 1, colorStr.lastIndexOf(')')).split(',').map(Number);
}

export function getColormapIndex(value, min, max, colormapSize){
    if(value < min){
        return 0;
    } else if(value > max){
        return colormapSize.length;
    } else {
        let normedValue = (value - min) / (max - min)
        return Math.floor(normedValue * colormapSize);
    }        
}

export function hexToRgb(hex) {
    if (hex.startsWith("#")) {
      hex = hex.substring(1);
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    return [ r, g, b ];
  }


export const colorMapWhiteBlack = [
    '#ffffff', // White
    '#e6e6e6',
    '#cccccc',
    '#b3b3b3',
    '#999999',
    '#808080',
    '#666666',
    '#4d4d4d',
    '#333333',
    '#000000'  // Black
];
  

export class ColorManager {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.propertyColors = {}
        
        let that = this;
        /*
        this.viewManager.OnActiveProfileChanged.add(profile => {
            that.updateProfile(profile);
        });
        */

        let initialProfile = this.viewManager.dataManager.getActiveProfile();
        if(initialProfile){
            this.updateProfile(initialProfile);
        }
    }
    
    
    getDefaultPropertyColors(numProperties = 10) {
        let colorsLight24 = [
            "#FD3216",
            "#00FE35",
            "#6A76FC",
            "#FED4C4",
            "#FE00CE",
            "#0DF9FF",
            "#F6F926",
            "#FF9616",
            "#479B55",
            "#EEA6FB",
            "#DC587D",
            "#D626FF",
            "#6E899C",
            "#00B5F7",
            "#B68E00",
            "#C9FBE5",
            "#FF0092",
            "#22FFA7",
            "#E3EE9E",
            "#86CE00",
            "#BC7196",
            "#7E7DCD",
            "#FC6955",
            "#E48F72"
        ];

        let colors_Set3 = [
            "#8dd3c7",
            "#ffffb3",
            "#bebada",
            "#fb8072",
            "#80b1d3",
            "#fdb462",
            "#b3de69",
            "#fccde5",
            "#d9d9d9",
            "#bc80bd",
            "#ccebc5",
            "#ffed6f"
        ]; // Set3

        let colors_T10 = [
            "#4c78a8",
            "#f58518",
            "#e45756",
            "#72b7b2",
            "#54a24b",
            "#eeca3b",
            "#b279a2",
            "#ff9da6",
            "#9d755d",
            "#bab0ac"
        ]

        if(numProperties > 10){
            return colorsLight24;
        } else {
            return colors_T10;
        }
        
    }

    updateProfile(profile){        
        this.propertyColors = {}
        let defaultColorCounter = 0;        
        let defaultColors = this.getDefaultPropertyColors(profile.selection_properties.length);
        for (let i = 0; i < profile.selection_properties.length; i++) {
            let propertyMeta = profile.selection_properties[i];
            if (propertyMeta.property_type == "categorical") {
                if(propertyMeta.color !== undefined){
                    this.propertyColors[propertyMeta.name] = propertyMeta.color;
                } else {
                    let colorIdx = defaultColorCounter % defaultColors.length;
                    this.propertyColors[propertyMeta.name] = defaultColors[colorIdx]
                    defaultColorCounter += 1;
                }
            } else {
                throw Error()
            }
        }
    }

    getPropertyColor(propertyName){
        if(this.propertyColors[propertyName]){
            return this.propertyColors[propertyName]; 
        } else {
            return "grey";
        }
    }
}