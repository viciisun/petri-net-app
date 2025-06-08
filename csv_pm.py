import pandas as pd
from pm4py.objects.conversion.log import converter as log_converter
from pm4py.algo.discovery.alpha import algorithm as alpha_miner
from pm4py.visualization.petri_net import visualizer as pn_visualizer

# Read CSV file
df = pd.read_csv('frontend/public/Event_Log.csv')

# Convert DataFrame to event log
parameters = {
    "case_id_key": "event_id",
    "activity_key": "concept:name",
    "timestamp_key": "datetime"
}

event_log = log_converter.apply(df, variant=log_converter.Variants.TO_EVENT_LOG, parameters=parameters)
# Apply Alpha Miner algorithm to generate Petri net
net, initial_marking, final_marking = alpha_miner.apply(event_log)

# Visualize Petri net
gviz = pn_visualizer.apply(net, initial_marking, final_marking)
pn_visualizer.view(gviz)