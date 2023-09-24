import React from 'react';
import { deepCopy, getValueOrDefault } from '../core/utilCore';

import CoordinatedView from '../core/coordinatedView';
import { SelectionEvent, CustomEvent } from '../core/interactionEvent';

import * as BABYLON from 'babylonjs';
import { blueRedColormap, getRGBFromString, getColormapIndex, hexToRgb } from '../core/colorManager';


class AnatomicalView extends CoordinatedView {
  constructor(props) {
    super(props);

    this.myRef = React.createRef();

    this.points = []
    this.pointColorRGB = getValueOrDefault(this.configuration.pointColor, [0.6, 0, 0]);
    this.pointColorDeselectedRGB = getValueOrDefault(this.configuration.deselectedColor, [0.9, 0.9, 0.9]);
    this.hideDeselected = getValueOrDefault(this.configuration.hideDeselected, 1);

    // domain specific properties
    this.selectedSegments = [];
    this.morphology = getValueOrDefault(this.configuration.morphology, undefined);
    this.morphologySurfaceColor = getValueOrDefault(this.configuration.morphologySurfaceColor, "interpolateBlueRed");
    this.presetCamera = getValueOrDefault(this.configuration.presetCamera, "case-study-1-1");
    this.swapYZ = true; //this.presetCamera === "case-study-2";
    this.showProbes = this.presetCamera === "case-study-2";
    this.compareViewIndex = getValueOrDefault(this.configuration.compareViewIndex, 0);
  }

  updateSelection() {    
    if (!this.pcs_selection) {
      return;
    }

    // flatten selection for points cloud visualization
    const selectedSet = new Set(this.selection);
    if (!selectedSet.size) {
      for (let i = 0; i < this.pcs_selection.length; i++) {
        this.pcs_selection[i] = 1;
      }
    } else {
      for (let i = 0; i < this.pcs_selection.length; i++) {
        this.pcs_selection[i] = selectedSet.has(i) ? 1 : 0;
      }
    }
    this.pcs_requires_update = true;
  }

  updateCustomData(dataType, data) {
    if (dataType === "voltage_timeseries_points") {
      console.log(data.idx, this.name, this.compareViewIndex);

      if (data.idx === undefined) {
        return;
      }

      if (data.idx !== this.compareViewIndex) {
        return;
      }

      this.state.voltage_timeseries_points = data.voltage_timeseries_points;
      if (this.state.t_step) {
        this.updateMembranePotential(this.state.t_step);
      } else {
        this.updateMembranePotential(0);
      }
    }
    if (dataType === "time") {
      this.state.t_step = data.t_step;
      this.updateMembranePotential(data.t_step);
    }
  }

  onTubeSelected(tube) {
    const pointIdx = tube.pointIdx;
    if (this.selectedSegments.indexOf(pointIdx) === -1) {
      this.selectedSegments.push(pointIdx);
    } else {
      this.selectedSegments = this.selectedSegments.filter(x => x !== pointIdx);
    }

    if(this.showProbes){
      this.updateProbes();
    }

    const data = {
      segment_ids: deepCopy(this.selectedSegments)
    }
    this.notifyInteraction(new CustomEvent(this.name, "dendrite_segment").setData(data, "dendrite_segment"));
  }

  updateProbes() {    
    for (let i = 0; i < this.tubeHandles.length; i++) {
      const tube = this.tubeHandles[i];
      const probe = tube.getChildren()[0];
      const sphere = probe.getChildren()[0];
      if (this.selectedSegments.indexOf(tube.pointIdx) === -1) {
        probe.isVisible = false;
        sphere.isVisible = false;
      } else {
        probe.isVisible = true;
        sphere.isVisible = true;
        const idx = this.selectedSegments.indexOf(tube.pointIdx)
        const materialIdx = idx % this.materials_categorical.length;
        probe.material = this.scene.getMaterialByName('probe');
        sphere.material = this.materials_categorical[materialIdx];
      }
    }
  }

  updateMembranePotential(timeStep) {
    if (!this.state.voltage_timeseries_points) {
      return;
    }

    let voltagesPoints = this.state.voltage_timeseries_points.voltage_traces[timeStep];
    for (let i = 0; i < this.tubeHandles.length; i++) {
      let tube = this.tubeHandles[i];
      let currentVoltage = voltagesPoints[tube.pointIdx];
      let colormapIdx = getColormapIndex(currentVoltage, -80, 20, blueRedColormap.length);
      tube.material = this.interpolatedMaterials_blueRed[colormapIdx]
    }
  }

  render() {
    return <div style={styleBackground}><canvas ref={this.myRef} width={this.width} height={this.height} /></div>
  }

  componentDidMount() {
    const canvas = this.myRef.current;
    this.canvas = canvas;

    let that = this;

    this.isLassoActive = false;
    this.lassoPoints = [];
    this.lassoMesh = undefined;

    if (this.morphology) {
      this.viewManager.dataManager.getResource((morphologyData) => {
        that.morphologyData = morphologyData.jsonData;
        initEngine(that);
      }, this.morphology);
    } else {
      this.morphologyData = undefined;
      initEngine(that);
    }

    super.componentDidMount();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    
    // free resources
    this.engine.stopRenderLoop();
    if(this.pcs) {
      this.pcs.dispose();
      this.pcs = null;
    }  
  }
}

var greyColor = new BABYLON.Color3(50, 50, 50);
var pointInPolygon = require('point-in-polygon');
var intensity = 0.02;

// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function getId() {
  let dt = new Date().getTime();
  let uuid =
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
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
  mat4.specularColor = new BABYLON.Color3(255, 255, 255);
  mat4.alpha = 0.3;
  mat4.backFaceCulling = false;

  var matProbe = new BABYLON.StandardMaterial('probe', tpl.scene);
  matProbe.diffuseColor = new BABYLON.Color3(110, 110, 110);
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
    matInterp.emissiveColor = new BABYLON.Color3(rgbValues[0] / 255, rgbValues[1] / 255, rgbValues[2] / 255);
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
/*
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
*/


function createPointCloud(tpl) {

  let initPCS = () => {
    let data = tpl.pcs_data;
    let nPoints = data[0].length;
    console.log(nPoints);
    const pointSize = tpl.configuration.pointSize ? tpl.configuration.pointSize : 2;
    tpl.pcs = new BABYLON.PointsCloudSystem("pcs", pointSize, tpl.scene, {
      updatable: true
    });


    let x = data[0];
    let y = data[1];
    let z = data[2];

    let initFunction = function (particle, i, s) {
      particle.position = new BABYLON.Vector3(x[i], z[i], y[i]);
      particle.color = new BABYLON.Color4(...tpl.pointColorRGB, 1);
    }

    tpl.pcs.updateParticle = function (particle) {
      if (tpl.pcs_selection[particle.idx]) {
        particle.position = new BABYLON.Vector3(x[particle.idx], z[particle.idx], y[particle.idx]);
        particle.color = new BABYLON.Color4(...tpl.pointColorRGB, 1);
      } else if (tpl.hideDeselected) {
        particle.position = new BABYLON.Vector3(0, -10000, 0);
        particle.color = new BABYLON.Color4(1, 1, 1, 1);
      } else {
        particle.position = new BABYLON.Vector3(x[particle.idx], z[particle.idx], y[particle.idx]);
        particle.color = new BABYLON.Color4(...tpl.pointColorDeselectedRGB, 1);
      }
    }

    /*
    tpl.pcs.beforeUpdateParticles = () => {
      tpl.pcs_initialized = false;
    }
    */

    tpl.pcs.afterUpdateParticles = () => {
      tpl.pcs_initialized = true;
      tpl.pcs_requires_update = false;
    }

    tpl.pcs.addPoints(nPoints, initFunction);
    tpl.pcs.buildMeshAsync().then(() => {
      tpl.pcs_initialized = true;
      tpl.pcs_requires_update = true;
    });
  }

  const columns = tpl.dataColumn;
  console.log(columns);
  tpl.dataManager.loadValues((serverData) => {
    const values = serverData.values;
    let data = [[], [], [], []]
    tpl.pcs_data = values.reduce((accum, x) => {
      accum[0].push(x[columns[0]]);
      accum[1].push(x[columns[1]]);
      accum[2].push(x[columns[2]]);
      accum[3].push(1);
      return accum;
    }, data);
    tpl.pcs_selection = values.map((x, idx) => 1);
    initPCS();
  }, tpl.dataTable, [], columns, "expanded");
}


function createScene(tpl) {
  if (tpl.scene) {
    return;
  }

  // Create a basic BJS Scene object
  tpl.scene = new BABYLON.Scene(tpl.engine);
  tpl.scene.pickable = true;
  if (tpl.presetCamera === "case-study-2") {
    tpl.scene.clearColor = new BABYLON.Color4(0.8, 0.8, 0.8, 1);
  } else {
    tpl.scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);
  }


  var axis = new BABYLON.Vector3(0, 1, 0);
  var angle = Math.PI / 2;
  tpl.quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);

  let alpha = 0.7;
  let beta = 1.17;
  let radius = 5000;
  let centerZ = -300;

  if (tpl.presetCamera === "case-study-2") {
    tpl.camera = new BABYLON.ArcRotateCamera(
      'Camera', -3.48, 1.31, 1721, new BABYLON.Vector3(-100, 400, 0),
      tpl.scene);
    tpl.camera.lowerBetaLimit = null;
    tpl.camera.upperBetaLimit = null;
    tpl.camera.wheelDeltaPercentage = 0.02;
    tpl.camera.lowerRadiusLimit = 500;
    tpl.camera.upperRadiusLimit = 7000;
  } else if (tpl.presetCamera === "case-study-1-2") {
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
    tpl.camera.lowerBetaLimit = null;
    tpl.camera.upperBetaLimit = null;
    tpl.camera.wheelDeltaPercentage = 0.02;
    tpl.camera.lowerRadiusLimit = 500;
    tpl.camera.upperRadiusLimit = 7000;
  }

  tpl.camera.idleRotationWaitTime = 50000;
  tpl.camera.attachControl(tpl.canvas);

  var light = new BABYLON.HemisphericLight(
    'HemiLight', new BABYLON.Vector3(0, 0, -1), tpl.scene);
  light.intensity = 0.2 * intensity;

  var light2 = new BABYLON.HemisphericLight(
    'HemiLight2', new BABYLON.Vector3(0, 0, 1), tpl.scene);
  light2.intensity = 0.2 * intensity;

  initMaterials(tpl);

  if (tpl.configuration.showAxes) {
    createAxes(tpl);
  }

  if (tpl.dataColumn.length) {
    createPointCloud(tpl);
  }

  tpl.scene.onPointerDown = (event) => {
    if (event.altKey) {
      tpl.isLassoActive = true;
      tpl.lassoPoints = [{ x: tpl.scene.pointerX, y: tpl.scene.pointerY }];
      tpl.camera.detachControl(tpl.canvas);
    }
  };

  tpl.scene.onPointerMove = (event) => {
    if (tpl.isLassoActive) {
      tpl.lassoPoints.push({ x: tpl.scene.pointerX, y: tpl.scene.pointerY });

      // Update lasso mesh
      if (tpl.lassoMesh) {
        tpl.lassoMesh.dispose();
      }
      const lassoPath = tpl.lassoPoints.map((screenPosition) => {
        let ray0 = tpl.scene.createPickingRay(screenPosition.x, screenPosition.y);
        let lassoPointScene = ray0.origin.add(ray0.direction);
        return lassoPointScene;
      });
      tpl.lassoMesh = BABYLON.MeshBuilder.CreateLines("lassoMesh", { points: lassoPath }, tpl.scene);
      tpl.lassoMesh.enableEdgesRendering();
      tpl.lassoMesh.edgesWidth = 1;
      tpl.lassoMesh.edgesColor = new BABYLON.Color4(1, 0.65, 0, 1); // orange
    }
  };

  tpl.scene.onPointerUp = (event) => {
    if (tpl.isLassoActive) {
      // check which points are inside
      const polygon = tpl.lassoPoints.map((screenPosition) => [screenPosition.x, screenPosition.y]);

      let data = tpl.pcs_data;
      let nPoints = data[0].length;

      let selected = []
      for (let i = 0; i < nPoints; i++) {
        let x = data[0][i];
        let z = data[1][i];
        let y = data[2][i];
        const pointCloutPos = new BABYLON.Vector3(x, y, z);
        const posScreen = BABYLON.Vector3.Project(
          pointCloutPos,
          BABYLON.Matrix.Identity(),
          tpl.scene.getTransformMatrix(),
          { x: 0, y: 0, width: tpl.canvas.width, height: tpl.canvas.height } //viewport
        );
        if (pointInPolygon([posScreen.x, posScreen.y], polygon)) {
          selected.push(i);
        }
      }
      if (selected.length) {
        tpl.notifyInteraction(new SelectionEvent(tpl.name, tpl.dataTable).setIndices(selected));
      }

      tpl.camera.attachControl(tpl.canvas);

      tpl.isLassoActive = false;
      tpl.lassoPoints = [];

      if (tpl.lassoMesh) {
        tpl.lassoMesh.dispose();
        tpl.lassoMesh = null;
      }
    }
  };

  tpl.scene.onPointerObservable.add(function (evt) {
    if (evt.type === BABYLON.PointerEventTypes.POINTERDOUBLETAP) {
      tpl.notifyInteraction(new SelectionEvent(tpl.name, tpl.dataTable).setDeselect());
    }
  });

  createMorphology(tpl)
}


function createMorphology(tpl) {
  if (tpl.morphologyData === undefined) {
    return;
  }

  const fixOrientation = (pts) => {

    if (tpl.swapYZ) {
      let ptsFixed = pts.map(p => { return [p[0], p[2], p[1]] });
      return ptsFixed;
    } else {
      return pts;
    }
  }

  const points = fixOrientation(tpl.morphologyData.points);
  const lines = tpl.morphologyData.lines;

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
    if (tpl.morphologySurfaceColor === "transparent") {
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
    if (tpl.pcs_initialized && tpl.pcs_requires_update) {
      tpl.pcs.setParticles();
    }
  });
}


const styleBackground = {
  backgroundColor: "white",
  color: "white"
}


export default AnatomicalView