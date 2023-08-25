export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function areIdentical(objA, objB) {
    return JSON.stringify(objA) === JSON.stringify(objB);
}

function isIdenticalSelection(sel1, sel2) {
    return sel1.row == sel2.row && sel1.col == sel2.col;
}

export function removeOrAppendSelection(list, newItem) {
    let newList = [];
    let remove = false;
    for (let i = 0; i < list.length; i++) {
        if (isIdenticalSelection(list[i], newItem)) {
            remove = true;
        } else {
            newList.push(list[i]);
        }
    }
    if (!remove) {
        newList.push(newItem);
    }
    return newList;
}

export function itemContainedInList(list, item) {
    for (let i = 0; i < list.length; i++) {
        if (areIdentical(item, list[i])) {
            return true;
        }
    }
    return false;
}

export function getListIntersections(list1, list2) {
    let onlyInList1 = [];
    let onlyInList2 = [];
    let inBothLists = [];

    for (let i = 0; i < list1.length; i++) {
        if (itemContainedInList(list2, list1[i])) {
            inBothLists.push(list1[i]);
        } else {
            onlyInList1.push(list1[i]);
        }
    }

    for (let i = 0; i < list2.length; i++) {
        if (!itemContainedInList(inBothLists, list2[i])) {
            onlyInList2.push(list2[i]);
        }
    }

    return {
        onlyInList1: onlyInList1, onlyInList2: onlyInList2, inBothLists: inBothLists
    }
}

export function appendNonRedundand(list, item){
    if(!itemContainedInList(list, item)){
        list.push(item);
    }
}

export function getStringListUnion(a, b) {
    let union = [];
    for(let i=0; i<a.length; i++){
        union.push(a[i]);
    }
    for(let i=0; i<b.length; i++){
        if(union.indexOf(b[i]) == -1){
            union.push(b[i]);
        }        
    }
    return union;
}

export function haveSameElementsStringList(a,b){
    if(a.length != b.length){
        return false;
    }
    for(let i=0; i<a.length; i++){
        if(b.indexOf(a[i]) == -1)
            return false;        
    }
    return true;
}

export function areIdenticalPaths(pathA, pathB) {
    if(pathA.length != pathB.length){
        return false;
    }
    for(let k=0; k<pathA.length; k++){
        if(pathA[k] != pathB[k]){
            return false;
        }
    }
    return true;
}


export function httpRequest(url, responseType) {
    return new Promise(function (resolve, reject) {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.responseType = responseType;
      req.open('GET', url);

      req.onload = function () {
        if (req.status == 200) {
          resolve(req.response);
        }
        else {
          reject(Error(req.statusText));
        }
      };
      req.onerror = function () {
        reject(Error("Network Error"));
      };
      req.send();
    });
  }


export function getComputeServerURL(endpoint) {
    if (endpoint[0] !== '/') {
        endpoint = '/' + endpoint;
    }
    if (Meteor.settings.public.DEV) {
        return Meteor.settings.public.SERVER_DEV + endpoint;
    } else {
        return Meteor.settings.public.SERVER_PROD + endpoint;
    }
}

/*
    https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Set
 */
export function setUnion(setA, setB) {
    var _union = new Set(setA);
    for (var elem of setB) {
        _union.add(elem);
    }
    return _union;
}

/*
    https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Set
 */
export function setIntersection(setA, setB) {
    var _intersection = new Set();
    for (var elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
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
  