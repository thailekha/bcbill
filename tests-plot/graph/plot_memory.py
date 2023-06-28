import matplotlib.pyplot as plt
import pandas as pd

# Read the CSV file
df = pd.read_csv('memory_stats.csv')

# Convert the 'Timestamp' column to datetime
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

# Plot the graph for remote memory only
plt.plot(df['Timestamp'], df['Remote Memory (%)'], label='Remote Memory')

# Customize the plot
plt.xlabel('Timestamp')
plt.ylabel('Memory (%)')
plt.title('Remote Memory Usage')
plt.legend()

# Save the plot as a PNG image file
plt.savefig('memory_stats.png')

# Close the plot
plt.close()
