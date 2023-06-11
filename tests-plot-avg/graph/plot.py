import pandas as pd
import matplotlib.pyplot as plt

def plot_data(df, scenario_name):
    clients = df['Clients']
    avg = df['Avg']
    plt.plot(clients, avg, label=scenario_name)

# Read the CSV file into a pandas DataFrame
df_merged = pd.read_csv('data.csv')

# Get unique scenario names
scenario_names = df_merged['Scenario'].unique()

# Iterate over the unique scenario names and plot the data
for scenario_name in scenario_names:
    df_scenario = df_merged[df_merged['Scenario'] == scenario_name]
    plot_data(df_scenario, scenario_name)

# plt.title('Average Response Time')
plt.xlabel('Number of Clients')
plt.ylabel('Average response time')

plt.legend()
plt.savefig('line_graph.png')
plt.show()
