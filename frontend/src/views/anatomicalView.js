import React from 'react';
import CoordinatedView from '../core/coordinatedView';
import { SelectionEvent, CustomEvent } from '../core/interactionEvent';
import { deepCopy, getValueOrDefault, getId } from '../core/utilCore';

import * as BABYLON from 'babylonjs';
import { blueRedColormap, getRGBFromString, getColormapIndex, hexToRgb } from '../core/colorManager';
var pointInPolygon = require('point-in-polygon');


class AnatomicalView extends CoordinatedView {
    constructor(props) {
        super(props);

        this.myRef = React.createRef();

        this.showPointCloud = this.dataColumn.length >= 3;
        this.points = []
        this.pointColorRGB = getValueOrDefault(this.configuration.pointColor, [0.6, 0, 0]);
        this.pointColorDeselectedRGB = getValueOrDefault(this.configuration.deselectedColor, [0.9, 0.9, 0.9]);
        this.hideDeselected = getValueOrDefault(this.configuration.hideDeselected, 1);
        this.showAxes = getValueOrDefault(this.configuration.showAxes, false);

        // domain specific properties
        this.selectedSegments = [];
        this.morphology = getValueOrDefault(this.configuration.morphology, undefined);
        this.morphologySurfaceColor = getValueOrDefault(this.configuration.morphologySurfaceColor, "interpolateBlueRed");
        this.presetCamera = getValueOrDefault(this.configuration.presetCamera, "case-study-1-1");
        this.swapYZ = true;
        this.showProbes = this.presetCamera === "case-study-2";
        this.compareViewIndex = getValueOrDefault(this.configuration.compareViewIndex, 0);
    }

    render() {
        return <div style={{ backgroundColor: "white", color: "white" }}><canvas ref={this.myRef} width={this.width} height={this.height} /></div>
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
                that.initEngine();
            }, this.morphology);
        } else {
            this.morphologyData = undefined;
            this.initEngine();
        }

        super.componentDidMount();
    }

    initEngine() {
        this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.createScene();

        let that = this;
        this.engine.runRenderLoop(function () {
            that.scene.render();
            if (that.pcs_initialized && that.pcs_requires_update) {
                that.pcs.setParticles();
            }
        });
    }

    componentWillUnmount() {
        super.componentWillUnmount();

        // free resources
        this.engine.stopRenderLoop();
        if (this.pcs) {
            this.pcs.dispose();
            this.pcs = null;
        }
    }


    /*  ##############################################
                      create 3D scene
        ##############################################        
    */

    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.pickable = true;

        this.setBackgroundColor();
        this.createCamera();
        this.createLights();
        this.initMaterials();

        if (this.showAxes) {
            this.createAxes();
        }

        if (this.showPointCloud) {
            this.createPointCloud();
            this.initLassoSelection();
        }

        if (this.morphologyData !== undefined) {
            this.createMorphology();
        }
    }

    setBackgroundColor() {
        if (this.presetCamera === "case-study-2") {
            this.scene.clearColor = new BABYLON.Color4(0.8, 0.8, 0.8, 1);
        } else {
            this.scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);
        }
    }

    createCamera() {

        if (this.presetCamera === "case-study-2") {
            this.camera = new BABYLON.ArcRotateCamera(
                'Camera', -3.48, 1.31, 1721, new BABYLON.Vector3(-100, 400, 0),
                this.scene);
        } else if (this.presetCamera === "case-study-1-2") {
            this.camera = new BABYLON.ArcRotateCamera(
                'Camera', 1.55, 1.56, 2245, new BABYLON.Vector3(-100, 0, 0),
                this.scene);
        } else {
            this.camera = new BABYLON.ArcRotateCamera(
                'Camera', 0.7, 1.17, 5000, new BABYLON.Vector3(0, -300, 0),
                this.scene);
        }
        this.camera.lowerBetaLimit = null;
        this.camera.upperBetaLimit = null;
        this.camera.wheelDeltaPercentage = 0.02;
        this.camera.lowerRadiusLimit = 500;
        this.camera.upperRadiusLimit = 7000;
        this.camera.attachControl(this.canvas);
    }

    createLights() {
        const intensity = 0.004;
        let light = new BABYLON.HemisphericLight(
            'HemiLight', new BABYLON.Vector3(0, 0, -1), this.scene);
        light.intensity = intensity;

        let light2 = new BABYLON.HemisphericLight(
            'HemiLight2', new BABYLON.Vector3(0, 0, 1), this.scene);
        light2.intensity = intensity;
    }

    initMaterials() {
        let mat_dend = new BABYLON.StandardMaterial('transparentDendriteSurface', this.scene);
        mat_dend.diffuseColor = new BABYLON.Color3(50, 50, 50);
        mat_dend.alpha = 0.1;
        mat_dend.backFaceCulling = false;

        var mat4 = new BABYLON.StandardMaterial('defaultCylinderSurface', this.scene);
        mat4.diffuseColor = new BABYLON.Color3(110, 110, 110);
        mat4.specularColor = new BABYLON.Color3(255, 255, 255);
        mat4.alpha = 0.3;
        mat4.backFaceCulling = false;

        var matProbe = new BABYLON.StandardMaterial('probe', this.scene);
        matProbe.diffuseColor = new BABYLON.Color3(110, 110, 110);
        matProbe.specularColor = new BABYLON.Color3(255, 255, 255);
        matProbe.alpha = 0.5;
        matProbe.backFaceCulling = false;

        var mat5 = new BABYLON.StandardMaterial('selectedCylinderSurface', this.scene);
        mat5.diffuseColor = new BABYLON.Color3(255, 0, 0);
        mat5.emissiveColor = new BABYLON.Color3(255, 0, 0);
        mat5.specularColor = new BABYLON.Color3(255, 0, 0);
        mat5.alpha = 0.3;
        mat5.backFaceCulling = false;

        this.interpolatedMaterials_blueRed = [];
        for (let i = 0; i < blueRedColormap.length; i++) {
            const rgbValues = getRGBFromString(blueRedColormap[i]);
            let matInterp = new BABYLON.StandardMaterial('blueRed_' + i.toString(), this.scene);
            matInterp.emissiveColor = new BABYLON.Color3(rgbValues[0] / 255, rgbValues[1] / 255, rgbValues[2] / 255);
            matInterp.backFaceCulling = false;
            matInterp.freeze();
            this.interpolatedMaterials_blueRed.push(matInterp)
        }

        this.materials_categorical = [];
        const colormap_categorical = this.viewManager.colorManager.getDefaultPropertyColors();
        for (let i = 0; i < colormap_categorical.length; i++) {
            const rgbValues = hexToRgb(colormap_categorical[i]);
            let mat = new BABYLON.StandardMaterial('categorical_' + i.toString(), this.scene);
            mat.diffuseColor = new BABYLON.Color3(...rgbValues);
            mat.backFaceCulling = false;
            mat.freeze();
            this.materials_categorical.push(mat);
        }
    }


    createArrow(height, material) {
        let cone = BABYLON.MeshBuilder.CreateCylinder(
            getId(),
            { diameterTop: 0, diameterBottom: 50, height: 100, tessellation: 96 },
            this.scene);
        cone.position.y = height;
        cone.material = material;
        let line = BABYLON.Mesh.CreateLines(
            getId(), [new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, height, 0)],
            this.scene);
        line.color = material.diffuseColor;
        cone.setParent(line);
        return line;
    }


    createAxes() {
        const size = 800;

        let rootMesh = new BABYLON.Mesh('axes', this.scene);

        let xMaterial = new BABYLON.StandardMaterial('xMaterial', this.scene);
        xMaterial.diffuseColor = new BABYLON.Color3(255, 0, 0);

        let yMaterial = new BABYLON.StandardMaterial('yMaterial', this.scene);
        yMaterial.diffuseColor = new BABYLON.Color3(0, 255, 0);

        let zMaterial = new BABYLON.StandardMaterial('zMaterial', this.scene);
        zMaterial.diffuseColor = new BABYLON.Color3(0, 0, 255);

        let arrowZ = this.createArrow(size, zMaterial);
        arrowZ.setParent(rootMesh);

        let arrowY = this.createArrow(size, yMaterial);
        arrowY.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);
        arrowY.setParent(rootMesh);

        let arrowX = this.createArrow(size, xMaterial);
        arrowX.rotate(BABYLON.Axis.Z, -Math.PI / 2, BABYLON.Space.WORLD);
        arrowX.setParent(rootMesh);
    }


    createPointCloud() {
        let view = this;

        let initPCS = () => {
            let data = view.pcs_data;
            let nPoints = data[0].length;
            const pointSize = view.configuration.pointSize ? view.configuration.pointSize : 2;
            view.pcs = new BABYLON.PointsCloudSystem("pcs", pointSize, view.scene, {
                updatable: true
            });


            let x = data[0];
            let y = data[1];
            let z = data[2];

            let initFunction = function (particle, i, s) {
                particle.position = new BABYLON.Vector3(x[i], z[i], y[i]);
                particle.color = new BABYLON.Color4(...view.pointColorRGB, 1);
            }

            view.pcs.updateParticle = function (particle) {
                if (view.pcs_selection[particle.idx]) {
                    particle.position = new BABYLON.Vector3(x[particle.idx], z[particle.idx], y[particle.idx]);
                    particle.color = new BABYLON.Color4(...view.pointColorRGB, 1);
                } else if (view.hideDeselected) {
                    particle.position = new BABYLON.Vector3(0, -10000, 0);
                    particle.color = new BABYLON.Color4(1, 1, 1, 1);
                } else {
                    particle.position = new BABYLON.Vector3(x[particle.idx], z[particle.idx], y[particle.idx]);
                    particle.color = new BABYLON.Color4(...view.pointColorDeselectedRGB, 1);
                }
            }

            view.pcs.afterUpdateParticles = () => {
                view.pcs_initialized = true;
                view.pcs_requires_update = false;
            }

            view.pcs.addPoints(nPoints, initFunction);
            view.pcs.buildMeshAsync().then(() => {
                view.pcs_initialized = true;
                view.pcs_requires_update = true;
            });
        }

        const columns = view.dataColumn;
        view.dataManager.loadValues((serverData) => {
            const values = serverData.values;
            let data = [[], [], [], []]
            view.pcs_data = values.reduce((accum, x) => {
                accum[0].push(x[columns[0]]);
                accum[1].push(x[columns[1]]);
                accum[2].push(x[columns[2]]);
                accum[3].push(1);
                return accum;
            }, data);
            view.pcs_selection = values.map((x, idx) => 1);
            initPCS();
        }, view.dataTable, [], columns, "expanded");
    }


    createMorphology() {
        let view = this;

        const fixOrientation = (pts) => {
            if (view.swapYZ) {
                let ptsFixed = pts.map(p => { return [p[0], p[2], p[1]] });
                return ptsFixed;
            } else {
                return pts;
            }
        }

        const points = fixOrientation(view.morphologyData.points);
        const lines = view.morphologyData.lines;

        view.tubeHandles = [];
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx];

            let path = [];
            let pointIndices = [];
            for (let k = 1; k < line.length; k++) {
                const pointIdx = line[k];
                pointIndices.push(pointIdx);
                path.push(new BABYLON.Vector3(...points[pointIdx]))
            }

            let tube = BABYLON.MeshBuilder.CreateTube("segment" + lineIdx.toString(), { path: path, radius: 3, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true }, view.scene);

            const middleIndex = Math.floor(pointIndices.length / 2)
            tube.pointIdx = lineIdx;
            if (view.morphologySurfaceColor === "transparent") {
                tube.material = view.scene.getMaterialByName('transparentDendriteSurface');
            } else {
                tube.material = view.interpolatedMaterials_blueRed[0]
            }

            // create probe
            const probePosition = new BABYLON.Vector3(...points[pointIndices[middleIndex]]);
            const coneHeight = 150
            var cone = BABYLON.MeshBuilder.CreateCylinder("cone", { height: coneHeight, diameterTop: 0, diameterBottom: 20 }, view.scene);
            cone.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);
            cone.rotate(BABYLON.Axis.Y, Math.PI / 2, BABYLON.Space.WORLD);
            cone.position = probePosition.subtract(new BABYLON.Vector3(0.5 * coneHeight, 0, 0));
            cone.setParent(tube);
            cone.isVisible = false;

            var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 25 }, view.scene);
            sphere.position = probePosition.subtract(new BABYLON.Vector3(coneHeight, 0, 0));
            sphere.setParent(cone);
            sphere.isVisible = false;

            // enable click events
            tube.actionManager = new BABYLON.ActionManager(view.scene);
            tube.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    function (event) {
                        view.onMorphologySegmentSelected(event.source);
                    }
                )
            );

            // enable click events
            cone.actionManager = new BABYLON.ActionManager(view.scene);
            cone.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    function (event) {
                        view.onMorphologySegmentSelected(tube);
                    }
                )
            );

            view.tubeHandles.push(tube);
        }
    }


    /*  ##############################################
                      handle events
        ##############################################        
    */
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

    onMorphologySegmentSelected(tube) {
        const pointIdx = tube.pointIdx;
        if (this.selectedSegments.indexOf(pointIdx) === -1) {
            this.selectedSegments.push(pointIdx);
        } else {
            this.selectedSegments = this.selectedSegments.filter(x => x !== pointIdx);
        }

        if (this.showProbes) {
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

    initLassoSelection() {
        let view = this;

        view.scene.onPointerDown = (event) => {
            if (event.altKey) {
                view.isLassoActive = true;
                view.lassoPoints = [{ x: view.scene.pointerX, y: view.scene.pointerY }];
                view.camera.detachControl(view.canvas);
            }
        };

        view.scene.onPointerMove = (event) => {
            if (view.isLassoActive) {
                view.lassoPoints.push({ x: view.scene.pointerX, y: view.scene.pointerY });

                // Update lasso mesh
                if (view.lassoMesh) {
                    view.lassoMesh.dispose();
                }
                const lassoPath = view.lassoPoints.map((screenPosition) => {
                    let ray0 = view.scene.createPickingRay(screenPosition.x, screenPosition.y);
                    let lassoPointScene = ray0.origin.add(ray0.direction);
                    return lassoPointScene;
                });
                view.lassoMesh = BABYLON.MeshBuilder.CreateLines("lassoMesh", { points: lassoPath }, view.scene);
                view.lassoMesh.enableEdgesRendering();
                view.lassoMesh.edgesWidth = 1;
                view.lassoMesh.edgesColor = new BABYLON.Color4(1, 0.65, 0, 1); // orange
            }
        };

        view.scene.onPointerUp = (event) => {
            if (view.isLassoActive) {
                // check which points are inside
                const polygon = view.lassoPoints.map((screenPosition) => [screenPosition.x, screenPosition.y]);

                let data = view.pcs_data;
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
                        view.scene.getTransformMatrix(),
                        { x: 0, y: 0, width: view.canvas.width, height: view.canvas.height } //viewport
                    );
                    if (pointInPolygon([posScreen.x, posScreen.y], polygon)) {
                        selected.push(i);
                    }
                }
                if (selected.length) {
                    view.notifyInteraction(new SelectionEvent(view.name, view.dataTable).setIndices(selected));
                }

                view.camera.attachControl(view.canvas);

                view.isLassoActive = false;
                view.lassoPoints = [];

                if (view.lassoMesh) {
                    view.lassoMesh.dispose();
                    view.lassoMesh = null;
                }
            }
        };

        view.scene.onPointerObservable.add(function (evt) {
            if (evt.type === BABYLON.PointerEventTypes.POINTERDOUBLETAP) {
                view.notifyInteraction(new SelectionEvent(view.name, view.dataTable).setDeselect());
            }
        });
    }

}

export default AnatomicalView