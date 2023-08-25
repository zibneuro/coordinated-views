import React, { useState } from 'react';
import { deepCopy } from './core/utilCore';

import CoordinatedView from './core/coordinatedView';
import { SelectionEvent } from './core/interactionEvent';

import 'babylonjs-loaders';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import * as BABYLONMAT from 'babylonjs-materials';
import { getBarrelModelData } from './barrel_model.js';
import { normalizeArray, blueRedColormap, getRGBFromString, getColormapIndex, hexToRgb } from './core/colorManager';
import { tokTypes } from '@babel/parser';

var greyColor = new BABYLON.Color3(50, 50, 50);
var opacityLayer = 0.5;
var colorRed = new BABYLON.Color3(255, 0, 0);
var selectedBarrelColor = new BABYLON.Color4(255, 0, 0, 0.7);
var barrelColor = new BABYLON.Color4(0, 0, 0, 0.1);
var barrelCapColor = new BABYLON.Color4(0, 0, 0, 0.05);
// var colorAntiqueWhite = new BABYLON.Color3(50, 46, 42);
var colorAntiqueWhite = new BABYLON.Color3(64, 60, 55);
var intensity = 0.02;
const opacityBarrel = 0.5;


const column_order = [
  "A1",
  "A2",
  "A3",
  "A4",
  "B1",
  "B2",
  "B3",
  "B4",
  "C1",
  "C2",
  "C3",
  "C4",
  "D1",
  "D2",
  "D3",
  "D4",
  "E1",
  "E2",
  "E3",
  "E4",
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
]


// Variable to track whether the control key is pressed
var isControlPressed = false;

// Add event listeners for keydown and keyup events
document.addEventListener("keydown", onKeyDown, false);
document.addEventListener("keyup", onKeyUp, false);

// Function to handle keydown event
function onKeyDown(event) {
  if (event.key === "Control") {
    // Set the flag indicating that the control key is pressed
    isControlPressed = true;
  }
}

// Function to handle keyup event
function onKeyUp(event) {
  if (event.key === "Control") {
    // Set the flag indicating that the control key is released
    isControlPressed = false;
  }
}


// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function getId() {
  let dt = new Date().getTime();
  let uuid =
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  return uuid;
}

function createArrow(tpl, height, material) {
  let cone = BABYLON.MeshBuilder.CreateCylinder(
    getId(),
    { diameterTop: 0, diameterBottom: 50, height: 100, tessellation: 96 },
    tpl.scene);
  cone.position.y = height;
  cone.material = material;
  let line = BABYLON.Mesh.CreateLines(
    getId(), [new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, height, 0)],
    tpl.scene);
  line.color = material.diffuseColor;
  cone.setParent(line);

  return line;
}

function createAxes(tpl) {
  const size = 800;

  let rootMesh = new BABYLON.Mesh('axes', tpl.scene);

  let xMaterial = new BABYLON.StandardMaterial('xMaterial', tpl.scene);
  xMaterial.diffuseColor = new BABYLON.Color3(255, 0, 0);

  let yMaterial = new BABYLON.StandardMaterial('yMaterial', tpl.scene);
  yMaterial.diffuseColor = new BABYLON.Color3(0, 255, 0);

  let zMaterial = new BABYLON.StandardMaterial('zMaterial', tpl.scene);
  zMaterial.diffuseColor = new BABYLON.Color3(0, 0, 255);

  let arrowZ = createArrow(tpl, size, zMaterial);
  arrowZ.setParent(rootMesh);

  let arrowY = createArrow(tpl, size, yMaterial);
  arrowY.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);
  arrowY.setParent(rootMesh);

  let arrowX = createArrow(tpl, size, xMaterial);
  arrowX.rotate(BABYLON.Axis.Z, -Math.PI / 2, BABYLON.Space.WORLD);
  arrowX.setParent(rootMesh);
}


function initMaterials(tpl) {
  var piaMat = new BABYLON.StandardMaterial('piaSurface', tpl.scene);
  if (tpl.context === 'frontView' || tpl.context === 'gallery') {
    piaMat.diffuseColor = new BABYLON.Color3(50, 50, 50);
    piaMat.alpha = 1;
  } else {
    piaMat.diffuseColor = new BABYLON.Color3(50, 50, 50);
    piaMat.alpha = 1;
  }
  piaMat.backFaceCulling = false;

  var wmMat = new BABYLON.StandardMaterial('wmSurface', tpl.scene);
  wmMat.diffuseColor = new BABYLON.Color3(50, 50, 50);
  wmMat.alpha = 1;
  wmMat.backFaceCulling = false;

  var mat1 = new BABYLON.StandardMaterial('defaultSurface', tpl.scene);
  mat1.diffuseColor = greyColor;
  mat1.alpha = 0.3;
  mat1.backFaceCulling = false;

  var mat1 = new BABYLON.StandardMaterial('transparentDendriteSurface', tpl.scene);
  mat1.diffuseColor = greyColor;
  mat1.alpha = 0.1;
  mat1.backFaceCulling = false;

  var mat2 = new BABYLON.StandardMaterial('lightSurface', tpl.scene);
  mat2.diffuseColor = new BABYLON.Color4(255, 255, 255, 0.3);
  mat2.backFaceCulling = false;

  var mat3 = new BABYLON.StandardMaterial('selectedSurface', tpl.scene);
  mat3.diffuseColor = new BABYLON.Color3(255, 0, 0);
  mat3.alpha = 0.7;
  mat3.backFaceCulling = false;

  var mat4 = new BABYLON.StandardMaterial('defaultCylinderSurface', tpl.scene);
  mat4.diffuseColor = new BABYLON.Color3(110, 110, 110);
  // mat4.emissiveColor = new BABYLON.Color3(255, 0, 0);
  mat4.specularColor = new BABYLON.Color3(255, 255, 255);
  mat4.alpha = 0.3;
  mat4.backFaceCulling = false;

  var matProbe = new BABYLON.StandardMaterial('probe', tpl.scene);
  matProbe.diffuseColor = new BABYLON.Color3(110, 110, 110);
  // mat4.emissiveColor = new BABYLON.Color3(255, 0, 0);
  matProbe.specularColor = new BABYLON.Color3(255, 255, 255);
  matProbe.alpha = 0.5;
  matProbe.backFaceCulling = false;

  var mat5 = new BABYLON.StandardMaterial('selectedCylinderSurface', tpl.scene);
  mat5.diffuseColor = new BABYLON.Color3(255, 0, 0);
  mat5.emissiveColor = new BABYLON.Color3(255, 0, 0);
  mat5.specularColor = new BABYLON.Color3(255, 0, 0);
  mat5.alpha = 0.3;
  mat5.backFaceCulling = false;

  tpl.interpolatedMaterials_blueRed = [];
  for (let i = 0; i < blueRedColormap.length; i++) {
    const rgbValues = getRGBFromString(blueRedColormap[i]);
    let matInterp = new BABYLON.StandardMaterial('blueRed_' + i.toString(), tpl.scene);
    //matInterp.diffuseColor = new BABYLON.Color3(...rgbValues);
    //matInterp.specularColor = new BABYLON.Color3(...rgbValues);
    //matInterp.alpha = 0.5;
    matInterp.emissiveColor = new BABYLON.Color3(rgbValues[0]/255, rgbValues[1]/255, rgbValues[2]/255);
    matInterp.backFaceCulling = false;
    matInterp.freeze();
    tpl.interpolatedMaterials_blueRed.push(matInterp)
  }

  tpl.materials_categorical = [];
  const colormap_categorical = tpl.viewManager.colorManager.getDefaultPropertyColors();
  for (let i = 0; i < colormap_categorical.length; i++) {
    const rgbValues = hexToRgb(colormap_categorical[i]);
    let mat = new BABYLON.StandardMaterial('categorical_' + i.toString(), tpl.scene);
    mat.diffuseColor = new BABYLON.Color3(...rgbValues);
    mat.backFaceCulling = false;
    mat.freeze();
    tpl.materials_categorical.push(mat);
  }
}


// Event handler to log camera parameters
function logCameraParameters(camera) {
  console.log("Camera Position:", camera.position);
  console.log("Camera Target:", camera.target);
  console.log("Camera Radius:", camera.radius);
  console.log("Camera Alpha:", camera.alpha);
  console.log("Camera Beta:", camera.beta);
  console.log("Camera FoV:", camera.fov);
  console.log("Camera Near Plane:", camera.minZ);
  console.log("Camera Far Plane:", camera.maxZ);
}


function createPointCloud(tpl) {
  //tpl.engine.displayLoadingUI();

  let initPCS = () => {
    let data = tpl.pcs_data;
    nPoints = data[0].length;
    console.log(nPoints);
    const pointSize = tpl.configuration.name == "soma-barrelcortex-synapses" ? 3 : 2;
    tpl.pcs = new BABYLON.PointsCloudSystem("pcs", pointSize, tpl.scene, {
      updatable : true
    });
    let x = data[0];
    let y = data[1];
    let z = data[2];
    let exc = data[3];

    let initFunction = function (particle, i, s) {
      particle.position = new BABYLON.Vector3(x[i], z[i], y[i]);
      particle.color = new BABYLON.Color4(0.6 * exc[i], 0.6 * (1 - exc[i]), 0, 1);
    }
    
    tpl.pcs.updateParticle = function(particle) {      
      if(tpl.pcs_selection[particle.idx]){
        particle.position = new BABYLON.Vector3(x[particle.idx], z[particle.idx], y[particle.idx]);
      } else {
        particle.position = new BABYLON.Vector3(0, -10000, 0);
      }     
    }    

    tpl.pcs.beforeUpdateParticles = () => {
      tpl.pcs_initialized = false;
      //tpl.engine.displayLoadingUI();
    }

    tpl.pcs.afterUpdateParticles = () => {
      tpl.pcs_initialized = true;
      //tpl.engine.hideLoadingUI();
    }
    
    tpl.pcs.addPoints(nPoints, initFunction);
    tpl.pcs.buildMeshAsync().then(() => {
      tpl.pcs_initialized = true;
      //tpl.engine.hideLoadingUI();
    });
  }

  //let key = "modelData/viewer_2020-10-02/soma/soma_positions_" + tpl.pcs_samplingFactor.toString() + ".json.zip";
  //loadZippedJson(key, "soma_positions_" + tpl.pcs_samplingFactor.toString() +".json", (data) => {

  const columns = tpl.configuration.name == "soma-barrelcortex" ?  ["soma_x", "soma_y", "soma_z", "celltype"] : ["x", "y", "z", "celltype"];

  tpl.dataManager.loadValues((serverData) => {
    const values = serverData.values;
    data = [[],[],[],[]]
    if(tpl.configuration.name == "soma-barrelcortex"){ 
      tpl.pcs_data = values.reduce((accum, x) => {
        accum[0].push(x.soma_x);
        accum[1].push(x.soma_y);
        accum[2].push(x.soma_z);
        accum[3].push(1);//x.celltype);
        return accum;
      }, data);
    } else if (tpl.configuration.name == "soma-barrelcortex-synapses"){
      tpl.pcs_data = values.reduce((accum, x) => {
        accum[0].push(x.x);
        accum[1].push(x.y);
        accum[2].push(x.z);
        accum[3].push(1);//x.celltype);
        return accum;
      }, data);
    }

    console.log(tpl.pcs_data);
    tpl.pcs_selection = values.map((x,idx) => 1);
    console.log(tpl.pcs_data);
    console.log(tpl.pcs_data);
    initPCS();
  }, tpl.table, [], columns, "expanded");  
}


function createScene(tpl) {
  if (tpl.scene) {
    return;
  }

  // Create a basic BJS Scene object
  tpl.scene = new BABYLON.Scene(tpl.engine);
  tpl.scene.pickable = true;
  if (tpl.configuration.name == "single-morphology") {
    tpl.scene.clearColor = new BABYLON.Color4(0.8, 0.8, 0.8, 1);
  } else {
    tpl.scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);
  }


  var axis = new BABYLON.Vector3(0, 1, 0);
  var angle = Math.PI / 2;
  tpl.quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);

  // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}

  let alpha = 0.7;
  let beta = 1.17;
  let radius = 5000;
  let centerZ = -300;

  //let centerZ = 700;

  /*
  if (tpl.context === 'frontView' || tpl.context === 'gallery') {
    alpha = 0.59;
    beta = 1.49;
    radius = 3830;
    centerZ = -350;
  }*/

  if (tpl.configuration.name == "single-morphology") {
    tpl.camera = new BABYLON.ArcRotateCamera(
      'Camera', -3.48, 1.31, 1721, new BABYLON.Vector3(-100, 400, 0),
      tpl.scene);
    tpl.camera.lowerBetaLimit = null;
    tpl.camera.upperBetaLimit = null;
    tpl.camera.wheelDeltaPercentage = 0.02;
    tpl.camera.lowerRadiusLimit = 500;
    tpl.camera.upperRadiusLimit = 7000;
  } else if (tpl.configuration.name == "soma-barrelcortex-synapses"){
    tpl.camera = new BABYLON.ArcRotateCamera(
      'Camera', 1.55, 1.56, 2245, new BABYLON.Vector3(-100, 0, 0),
      tpl.scene);    
    tpl.camera.lowerBetaLimit = null;
    tpl.camera.upperBetaLimit = null;
    tpl.camera.wheelDeltaPercentage = 0.02;
    tpl.camera.lowerRadiusLimit = 500;
    tpl.camera.upperRadiusLimit = 7000;
  } else {
    tpl.camera = new BABYLON.ArcRotateCamera(
      'Camera', alpha, beta, radius, new BABYLON.Vector3(0, centerZ, 0),
      tpl.scene);
    // 0.64, 1.3, 5000
    // 0.92, 1.87, 5000 DENSE
    // 7.07 1.25 //DENSE cell types w grid
    // 6.73, 1.17
    // Target the camera to scene origin
    // tpl.camera.setTarget(BABYLON.Vector3.Zero());
    // Attach the camera to the canvas
    tpl.camera.lowerBetaLimit = null;
    tpl.camera.upperBetaLimit = null;
    tpl.camera.wheelDeltaPercentage = 0.02;
    tpl.camera.lowerRadiusLimit = 500;
    tpl.camera.upperRadiusLimit = 7000;
  }


  // Attach event listeners to camera properties
  //tpl.camera.onViewMatrixChangedObservable.add(logCameraParameters);
  //tpl.camera.onProjectionMatrixChangedObservable.add(logCameraParameters);


  // tpl.camera.useBouncingBehavior = true;
  // tpl.camera.useAutoRotationBehavior = true;
  tpl.camera.idleRotationWaitTime = 50000;
  tpl.camera.attachControl(tpl.canvas, false);

  //if (tpl.configuration.name != "single-morphology") {
  var light = new BABYLON.HemisphericLight(
    'HemiLight', new BABYLON.Vector3(0, 0, -1), tpl.scene);
  light.intensity = 0.2 * intensity;

  var light2 = new BABYLON.HemisphericLight(
    'HemiLight2', new BABYLON.Vector3(0, 0, 1), tpl.scene);
  light2.intensity = 0.2 * intensity;
  //}

  initMaterials(tpl);

  if (tpl.configuration.name == "soma-barrelcortex" || tpl.configuration.name == "soma-barrelcortex-synapses") {
    createAxes(tpl);
    //createColumns(tpl);
    createPointCloud(tpl);
  }

  if (!tpl.rootNodesInitialized) {
    let rootAxon = new BABYLON.Mesh('axons', tpl.scene);
    let rootDendrite = new BABYLON.Mesh('dendrites', tpl.scene);
    tpl.rootNodesInitialized = true;
  }

  /*
  initMorphologies(tpl);
  // createSomaParticleSystem(tpl);
  // loadNeuronSelection(tpl,"selection_L5PT.json");
 
  if (tpl.subcontext === 'soma') {
    createPointCloud(tpl);
  }
 
  if (tpl.subcontext === 'subcellular' ||
    tpl.subcontext === 'spatial' || tpl.context == "matrixViewDev") {
    createParticleSystem(tpl);
  }
 
  createGrid(tpl);
  if (tpl.context !== 'gallery') {
    createControls(tpl);
  }
  */

  //createColumns(tpl);
  //createLayers(tpl);
  //applySettings(tpl);

  //tpl.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);


  createMorphology(tpl)
}

// https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/custom/updatingVertices

function createMorphology(tpl) {
  if (!tpl.morphology) {
    return;
  }

  const fixOrientation = (pts) => {
    
    if(tpl.swapYZ){      
      let ptsFixed = pts.map(p => {return [p[0],p[2],p[1]]});      
      return ptsFixed;
    } else {
      return pts;
    }          
  }

  const points = fixOrientation(tpl.morphology.points);
  const lines = tpl.morphology.lines;

  tpl.tubeHandles = [];
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    let path = [];
    let pointIndices = [];
    for (let k = 1; k < line.length; k++) {
      const pointIdx = line[k];
      pointIndices.push(pointIdx);
      path.push(new BABYLON.Vector3(...points[pointIdx]))
    }

    let tube = BABYLON.MeshBuilder.CreateTube("segment" + lineIdx.toString(), { path: path, radius: 3, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true }, tpl.scene);

    const middleIndex = Math.floor(pointIndices.length / 2)
    tube.pointIdx = lineIdx;
    if(tpl.configuration.name == "soma-barrelcortex-synapses"){
      tube.material = tpl.scene.getMaterialByName('transparentDendriteSurface');
    } else {
      tube.material = tpl.interpolatedMaterials_blueRed[0]
    }
    

    // create probe
    const probePosition = new BABYLON.Vector3(...points[pointIndices[middleIndex]]);
    const coneHeight = 150
    var cone = BABYLON.MeshBuilder.CreateCylinder("cone", { height: coneHeight, diameterTop: 0, diameterBottom: 20 }, tpl.scene);
    cone.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);
    cone.rotate(BABYLON.Axis.Y, Math.PI / 2, BABYLON.Space.WORLD);
    cone.position = probePosition.subtract(new BABYLON.Vector3(0.5 * coneHeight, 0, 0));
    cone.setParent(tube);
    cone.isVisible = false;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 25 }, tpl.scene);    
    sphere.position = probePosition.subtract(new BABYLON.Vector3(coneHeight, 0, 0));
    sphere.setParent(cone);
    sphere.isVisible = false;

    // enable click events
    tube.actionManager = new BABYLON.ActionManager(tpl.scene);
    tube.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        function (event) {          
          tpl.onTubeSelected(event.source);
        }
      )
    );

    // enable click events
    cone.actionManager = new BABYLON.ActionManager(tpl.scene);
    cone.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        function (event) {          
          tpl.onTubeSelected(tube);
        }
      )
    );

  

    tpl.tubeHandles.push(tube);
  }
}

function createColumn(rootMesh, barrel, tpl) {
  let faceColors = [barrelCapColor, barrelColor, barrelCapColor];
  let selectedFaceColors = [barrelCapColor, barrelColor, barrelCapColor];

  let material = tpl.scene.getMaterialByName('defaultCylinderSurface');

  BABYLON.MeshBuilder.Create
  var cylinder = BABYLON.MeshBuilder.CreateCylinder(
    getId(), {
    diameter: 2 * barrel.radius,
    height: barrel.height,
    hasRings: true,
    enclose: true
  },
    tpl.scene);

  // cylinder.material = material;

  let phi = Math.atan2(barrel.dir_y, barrel.dir_z);
  let phi2 = Math.atan2(barrel.dir_x, barrel.dir_z);
  cylinder.rotate(BABYLON.Axis.X, phi, BABYLON.Space.WORLD)
  cylinder.rotate(BABYLON.Axis.Z, -phi2, BABYLON.Space.WORLD)

  cylinder.position =
    new BABYLON.Vector3(barrel.pos_x, barrel.pos_z, barrel.pos_y);
  // cylinder.hasVertexAlpha = true;
  cylinder.setParent(rootMesh);

  let linePoints = [];
  linePoints.push(new BABYLON.Vector3(0, -500, 0));
  linePoints.push(new BABYLON.Vector3(0, 500, 0));
  /*
  let dashedLines = BABYLON.MeshBuilder.CreateDashedLines(
      getId(), {points: linePoints, dashNb: 10}, tpl.scene);
  dashedLines.edgesWidth = 20;
  dashedLines.rotate(BABYLON.Axis.X, phi, BABYLON.Space.WORLD);
  dashedLines.rotate(BABYLON.Axis.Z, -phi2, BABYLON.Space.WORLD);
  dashedLines.position =
      new BABYLON.Vector3(barrel.pos_x, barrel.pos_z, barrel.pos_y);
  dashedLines.color = new BABYLON.Color3(0.5, 0.5, 0.5);
  dashedLines.setParent(rootMesh);
  */

  BABYLON.Tags.EnableFor(cylinder);
  let tags = 'column ' + barrel.description;
  cylinder.barrel_name = barrel.description;
  cylinder.addTags(tags);

  // Create an action manager for the mesh
  cylinder.actionManager = new BABYLON.ActionManager(tpl.scene);

  // Register a click event on the mesh
  cylinder.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPickTrigger,
      function (event) {
        // Handle the click event here
        console.log(isControlPressed);
        let index = column_order.indexOf(event.source.barrel_name);
        //tpl.viewManager.notifySelectionChanged([index]);
      }
    )
  );

  setColumnSelection(tpl, cylinder);
}

function setColumnSelection(tpl, mesh) {
  let isSelected = false;// mesh.matchesTagsQuery(tpl.columnQuery) &&
  //  (getCondition(tpl.selection, 'nearestColumn') ||
  //    tpl.subcontext === 'geometryX');
  let material = tpl.scene.getMaterialByName('defaultCylinderSurface');
  let selectedMaterial = tpl.scene.getMaterialByName('selectedCylinderSurface');
  if (isSelected) {
    mesh.material = selectedMaterial;
  } else {
    mesh.material = material;
  }
}

function createColumns(tpl) {
  let rootMesh = new BABYLON.Mesh('columns', tpl.scene);
  let barrels = getBarrelModelData();
  tpl.selectedColumns = [];
  for (var i = 0; i < barrels.length; i++) {
    let barrel = barrels[i];
    createColumn(rootMesh, barrel, tpl);
  }
}

function initEngine(tpl) {
  if (tpl.engine) {
    return;
  }

  tpl.engine = new BABYLON.Engine(
    tpl.canvas, true, { preserveDrawingBuffer: true, stencil: true });
  tpl.engine.loadingUIBackgroundColor = "black";

  tpl.engine.onContextLostObservable.add(() => {
    console.log("context lost", tpl.name);
  });

  createScene(tpl);

  tpl.engine.runRenderLoop(function () {
    tpl.scene.render();
    if(tpl.pcs_initialized){
      tpl.pcs.setParticles();
    }
  });
}

/*
function setColumnSelection(tpl, mesh, isSelected) {
  let isSelected = mesh.matchesTagsQuery(tpl.columnQuery) &&
    (getCondition(tpl.selection, 'nearestColumn') ||
      tpl.subcontext === 'geometryX');
  let material = tpl.scene.getMaterialByName('defaultCylinderSurface');
  let selectedMaterial = tpl.scene.getMaterialByName('selectedCylinderSurface');
  if (isSelected) {
    mesh.material = selectedMaterial;
  } else {
    mesh.material = material;
  }
}*/

function joinOptions(options) {
  let condition = '';
  for (var i = 0; i < options.length; i++) {
    if (i > 0) {
      condition += ' || '
    }
    condition += options[i];
  }
  return condition;
}

function setSelection(tpl, selection) {
  if (!tpl.scene) {
    return;
  }

  // set morphology selection
  /*
  let morphologies = tpl.scene.getMeshesByTags('morphology');
  for (var i = 0; i < morphologies.length; i++) {
    setVisibilityByTag(tpl, morphologies[i]);
  }*/

  let selected_columns = [];
  for (let i = 0; i < selection.length; i++) {
    selected_columns.push(column_order[selection[i]]);
  }
  const column_query = joinOptions(selected_columns);

  let columns = tpl.scene.getMeshesByTags('column');
  for (var i = 0; i < columns.length; i++) {
    mesh = columns[i];
    if (!selection.length) {
      mesh.material = tpl.scene.getMaterialByName('defaultCylinderSurface');
    } else if (mesh.matchesTagsQuery(column_query)) {
      mesh.material = tpl.scene.getMaterialByName('selectedCylinderSurface');
    } else {
      mesh.material = tpl.scene.getMaterialByName('defaultCylinderSurface');
    }
  }

  /*
  let layers = tpl.scene.getMeshesByTags('layer');
  for (var i = 0; i < layers.length; i++) {
    setLayerSelection(tpl, layers[i]);
  }

  if (tpl.subcontext === 'soma') {
    if(tpl.pcs_initialized){
      loadPointCloudSelection(tpl, tpl.selectedKey)
    }
  }

  if (tpl.subcontext === 'subcellular' ||
    tpl.subcontext === 'spatial') {
    loadDensity(tpl, tpl.selectedKey);
  }

  if(tpl.context == "matrixViewDev") {
    setSelectedCubes(tpl, tpl.data.selectedCubes);
  }*/
}






const styleBackground = {
  backgroundColor: "white",
  color: "white"
}


class AnatomicalView extends CoordinatedView {
  constructor(props) {
    super(props);

    this.myRef = React.createRef();
    this.data_dimensions = props.data_sources;
    console.log(this.props);
    this.configuration = props.configuration;
    
    this.points = [] 

    this.name = props.name;
    this.selectedSegments = [];        
  }

  updateSelection(interactionEvent) {        
    if(!this.pcs_selection){
      return;
    }  
    this.points = interactionEvent.applyOperations(this.name, this.table, this.points);
    const selectedSet = new Set(this.points);        
    for(let i=0; i<this.pcs_selection.length; i++){
      this.pcs_selection[i] = selectedSet.has(i) ? 1 : 0;
    }
  }

  receiveData(dataType, data){
    if(dataType == "voltage_timeseries_points"){
      console.log(data.idx, this.name);

      if(data.idx === undefined){
        return;
      }

      if(data.idx % 2 == 0 && this.name != "dendrite"){
        return;
      } else if (data.idx % 2 == 1 && this.name != "dendrite 2"){
        return;
      }

      this.state.voltage_timeseries_points = data.voltage_timeseries_points;
      if(this.state.t_step){
        this.updateMembranePotential(this.state.t_step);
      } else {
        this.updateMembranePotential(0);
      }      
    } 
    if(dataType == "time"){
      this.state.t_step = data.t_step;
      this.updateMembranePotential(data.t_step);
    }
  }

  onTubeSelected(tube) {

    if(this.configuration.name == "soma-barrelcortex"){
      this.notify(new SelectionEvent(this.name, this.table).setDeselect());
    } else {
      const pointIdx = tube.pointIdx;    
      if (this.selectedSegments.indexOf(pointIdx) == -1) {
        this.selectedSegments.push(pointIdx);            
      } else {
        this.selectedSegments = this.selectedSegments.filter(x => x != pointIdx);      
      }    
      this.updateProbes(); 
      this.notify({
        interactionType : "select",
        selectedEntityType: "dendrite_segment",
        data : {
            data_type: "dendrite_segment",
            segment_ids : deepCopy(this.selectedSegments)
        }                
      });
    }    
  }

  updateProbes(){
    // update probes
    for(let i = 0; i<this.tubeHandles.length; i++){
      const tube = this.tubeHandles[i];
      const probe = tube.getChildren()[0];
      const sphere = probe.getChildren()[0];
      if(this.selectedSegments.indexOf(tube.pointIdx) == -1){
        probe.isVisible = false;        
        sphere.isVisible = false;
      } else {
        probe.isVisible = true;
        sphere.isVisible = true;
        const idx = this.selectedSegments.indexOf(tube.pointIdx)
        const materialIdx = idx % this.materials_categorical.length;
        probe.material =  this.scene.getMaterialByName('probe');            
        sphere.material = this.materials_categorical[materialIdx];
      }
    }
  }


  updateMembranePotential(timeStep) {
    if(!this.state.voltage_timeseries_points){
      return;
    }
    
    console.log(this.state)
    let voltagesPoints = this.state.voltage_timeseries_points.voltage_traces[timeStep];
  

    for (let i = 0; i < this.tubeHandles.length; i++) {
      let tube = this.tubeHandles[i];
      let currentVoltage = voltagesPoints[tube.pointIdx];
      let colormapIdx = getColormapIndex(currentVoltage, -80, 20, blueRedColormap.length);
      tube.material = this.interpolatedMaterials_blueRed[colormapIdx]
    }
  }

  handleSelect(eventArgs) {
    this.viewManager.notifySelectionEvent(this.name, "select", deepCopy(eventArgs.points));
  }

  handleDeselect() {
    this.viewManager.notifySelectionEvent(this.name, "deselect");
  }

  render() {
    let that = this;
    return <div style={styleBackground}><canvas ref={this.myRef} width={this.width} height={this.height} /></div>
  }

  componentDidMount() {
    const canvas = this.myRef.current;
    this.canvas = canvas;

    let that = this;

    that.swapYZ = this.configuration.name == "soma-barrelcortex" || "soma-barrelcortex-synapses";

    if(this.configuration.name == "soma-barrelcortex" || this.configuration.name == "soma-barrelcortex-synapses"){
      this.viewManager.dataManager.getResource((morphology) => {
        that.morphology = morphology.jsonData;
        console.log(morphology);
        initEngine(that);
      }, "281900.json");
    } else {    
      this.viewManager.dataManager.getResource((morpholgy) => {
        that.morphology = morpholgy.jsonData;
        initEngine(that);
      }, "WR64.json");
    } 

    super.componentDidMount();
  }

  componentWillUnmount() {
    super.componentWillUnmount();   
    // free resources 
  }
}

export default AnatomicalView