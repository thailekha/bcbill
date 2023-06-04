import pandas as pd
import matplotlib.pyplot as plt

# Read the CSV file into a pandas DataFrame
df = pd.read_csv('data.csv')

# Extract the data for plotting
clients = df['Clients']
avg = df['Avg']

# Plot the data
plt.plot(clients, avg)

# Customize the graph if needed (e.g., titles, labels, styling)

# Save the graph as a PNG image
plt.savefig('line_graph.png')

# Display the graph (optional)
plt.show()
