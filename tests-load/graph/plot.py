import pandas as pd
import matplotlib.pyplot as plt

def plot_data(df, scenario_name):
    clients = df['Clients']
    avg = df['Avg']
    plt.plot(clients, avg, label=scenario_name)

# Read the CSV file into a pandas DataFrame
df_merged = pd.read_csv('plot/data.csv')

# Extract data for each scenario
scenarios = {
    'No access control': 'No access control',
    'With dummy proxy': 'With dummy proxy',
    'Blockchain access control': 'Blockchain access control'
}

for scenario_name, scenario_label in scenarios.items():
    df_scenario = df_merged[df_merged['Scenario'] == scenario_label]
    plot_data(df_scenario, scenario_name)

plt.title('Average Response Time')
plt.xlabel('Clients')
plt.ylabel('Average')

plt.legend()
plt.savefig('plot/line_graph.png')
plt.show()
