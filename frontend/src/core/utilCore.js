
import { getServerSettings } from './serverControl.js';

export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function indicesIdentical(indices1, indices2) {
    const set1 = new Set(indices1);
    const set2 = new Set(indices2);
    if (set1.size !== set2.size) {
        return false;
    }
    for (const value of set1) {
        if (!set2.has(value)) {
            return false;
        }
    }
    return true;
}


export function getComputeServerURL(endpoint) {
    if (endpoint[0] !== '/') {
        endpoint = '/' + endpoint;
    }
    if (getServerSettings().DEV) {
        return getServerSettings().SERVER_DEV + endpoint;
    } else {
        return getServerSettings().SERVER_PROD + endpoint;
    }
}



export function getColumnMinMaxValues(arr, columnNames) {
    const columnMinMax = [];
    for (let col = 0; col < arr[0].length; col++) {
        let min = arr[0][col];
        let max = arr[0][col];
        let column = columnNames[col];

        for (let row = 1; row < arr.length; row++) {
            const value = arr[row][col];
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
        columnMinMax.push({ column, min, max });
    }
    return columnMinMax;
}

export function getValueOrDefault(configValue, defaultValue) {
    return configValue === undefined ? defaultValue : configValue;
}

// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
export function getId() {
    let dt = new Date().getTime();
    let uuid =
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
        });
    return uuid;
}
