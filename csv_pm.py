import pandas as pd
from pm4py.objects.conversion.log import converter as log_converter
from pm4py.algo.discovery.alpha import algorithm as alpha_miner
from pm4py.visualization.petri_net import visualizer as pn_visualizer

# 读取 CSV 文件
df = pd.read_csv('frontend/public/Event_Log.csv')

# 将 DataFrame 转换为事件日志
parameters = {
    "case_id_key": "event_id",
    "activity_key": "concept:name",
    "timestamp_key": "datetime"
}

event_log = log_converter.apply(df, variant=log_converter.Variants.TO_EVENT_LOG, parameters=parameters)
# 应用 Alpha Miner 算法生成 Petri 网
net, initial_marking, final_marking = alpha_miner.apply(event_log)

# 可视化 Petri 网
gviz = pn_visualizer.apply(net, initial_marking, final_marking)
pn_visualizer.view(gviz)