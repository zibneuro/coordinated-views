## Backend

### Create Python environment
Install data-server python environment
Create a python 3.8. environment (e.g., using conda) and activate it
```
cd server
pip install -r requirements.txt
```

### Start server
Start data server
```
cd server
conda activate <python-env-name>
python data_server.py <path-to-data-folder>
```
