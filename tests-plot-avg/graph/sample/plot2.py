import pandas as pd
import matplotlib.pyplot as plt

# Read the merged data from CSV
df_merged = pd.read_csv('data_merged.csv')

# Extract data for scenario 1
df_scenario1 = df_merged[df_merged['Scenario'] == 'Scenario 1']
clients_scenario1 = df_scenario1['Clients']
avg_scenario1 = df_scenario1['Avg']

# Extract data for scenario 2
df_scenario2 = df_merged[df_merged['Scenario'] == 'Scenario 2']
clients_scenario2 = df_scenario2['Clients']
avg_scenario2 = df_scenario2['Avg']

# Plot the data for scenario 1
plt.plot(clients_scenario1, avg_scenario1, label='Scenario 1')

# Plot the data for scenario 2
plt.plot(clients_scenario2, avg_scenario2, label='Scenario 2')

# Customize the graph if needed (e.g., titles, labels, styling)
plt.title('Average Performance')
plt.xlabel('Clients')
plt.ylabel('Average')

# Add a legend
plt.legend()

# Save the graph as a PNG image
plt.savefig('line_graph.png')

# Display the graph
plt.show()