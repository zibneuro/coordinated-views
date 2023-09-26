# Coordinated Views — A Grammar-based Approach
## About

Supports the creation of web-based data analytics dashboards consisting of linked views. Key features:
- Integrate different JavaScript visualization libraries (e.g., Vega-Lite, Plotly.js, Babylon.js)
- Thereby enable combination of InfoVis (e.g., scatter plot, parallel coordinates) and 3D views
- Specify layout and interactions with a JSON-based grammar


## Running the application

### 1. Create Python environment
The recommended way of setting up your local Python environment is using [conda](https://docs.conda.io/projects/conda/en/stable/user-guide/index.html). A good tutorial on using conda for managing Python environments can be found [here](https://whiteboxml.com/blog/the-definitive-guide-to-python-virtual-environments-with-conda). 

Open a terminal (Linux) or Powershell (Windows) and check that conda is available:
```
conda --version
```
Note: If you did not add conda to the system PATH under Windows, you can us the the Anaconda Prompt (available in the start menu) instead of the Powershell.

In your terminal / Powershell / Anaconda Prompt navigate to this repository, create a new Python environment, and install the required packages.
```
cd <path-to-repository>
conda create --name coordinated-views python=3.8
conda activate coordinated-views
pip install -r requirements.txt
```

### 2. Start backend server
Navigate to repository, activate Python environment, and start data server (case study 1).
```
cd <path-to-repository>
conda activate coordinated-views
python data_server.py data/case_study_1
```
Data for case study 2 can be obtained [here](https://cloud.zib.de/s/jmF7dejCm92Hpi6). To view the membrane potential on the dendrite additionally start the compute server:
```
conda activate coordinated-views
python compute_server.py data/case_study_2/simulation_data
```

### 3. Start web-based frontend
Please refer to the [documentation](frontend/README.md) in the frontend folder.


## Publications
Rapid Prototyping for Coordinated Views of Multi-scale Spatial and Abstract Data: A Grammar-based Approach.
Philipp Harth, Arco Bast, Jakob Troidl, Bjorge Meulemeester, Hanspeter Pfister, Johanna Beyer, Marcel Oberlaender, Hans-Christian Hege, Daniel Baum.
<i>Eurographics Workshop on Visual Computing for Biology and Medicine (VCBM)</i>, 2023.

Ion channel distributions in cortical neurons are optimized for energy-efficient active dendritic computations. Arco Bast, Marcel Oberlaender. <i>bioRxiv</i> 2021.12.11.472235; doi: https://doi.org/10.1101/2021.12.11.472235