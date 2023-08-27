# Coordinated Views — A Grammar-based Approach
## About

Supports the creation of web-based data analytics dashboards consisting of linked views. Key features:
- Integrate different JavaScript visualization libraries (e.g., Vega-Lite, Plotly.js, Babylon.js)
- Thereby enable combination of InfoVis (e.g., scatter plot, parallel coordinates) and 3D views
- Specify layout and interactions with a JSON-based grammar


## Running the application

### 1. Download example data set
[Download](https://cloud.zib.de/s/jmF7dejCm92Hpi6) one or all of the example datasets and extract the zip-file(s).

### 2. Create Python environment and start backend server(s)
The recommended way of setting up your local Python environment is using [conda](https://docs.conda.io/projects/conda/en/stable/user-guide/index.html). A good tutorial on using conda for managing Python environments can be found [here](https://whiteboxml.com/blog/the-definitive-guide-to-python-virtual-environments-with-conda). 

Open a terminal (Linux) and check that conda is available:
```
conda --version
```
In Windows do so by using a Powershell (if you added conda to the system PATH during installation) or the Anaconda Prompt from the start menu.

In your terminal/shell navigate to this repository, create a new Python environment, and install the required packages.
```
cd <path-to-repository>
conda create --name coordinated-views python=3.8
conda activate coordinated-views
pip install -r requirements.txt
```
Start data server:
```
conda activate coordinated-views
python data_server.py <path-to>/case_study_1
```
Alternatively, specify `case_study_2` or another dataset. Inspecting the membrane potentials on the dendrite surface in case study 2 will additionally require starting the compute server:
```
conda activate coordinated-views
python compute_server.py <path-to>/case_study_2/simulation_data
```

### 3. Start web-based frontend
Please refer to the [documentation](frontend/README.md) in the frontend folder.


## Publications
Rapid Prototyping for Coordinated Views of Multi-scale Spatial and Abstract Data: A Grammar-based Approach.
Philipp Harth, Arco Bast, Jakob Troidl, Bjorge Meulemeester, Hanspeter Pfister, Johanna Beyer, Marcel Oberlaender, Hans-Christian Hege, Daniel Baum.
<i>Eurographics Workshop on Visual Computing for Biology and Medicine (VCBM)</i>, 2023.

Ion channel distributions in cortical neurons are optimized for energy-efficient active dendritic computations. Arco Bast, Marcel Oberlaender. <i>bioRxiv</i> 2021.12.11.472235; doi: https://doi.org/10.1101/2021.12.11.472235