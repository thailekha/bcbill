import matplotlib.pyplot as plt
import pandas as pd

# Read data from error_rates.csv
data = pd.read_csv('error_rates.csv')

# Extract columns
vu = data['VU']
rate = data['rate']

# Plot the bar graph
plt.bar(vu, rate)

# Add labels and title
plt.xlabel('App instances')
plt.ylabel('Error rate')
plt.title('Error Rates')

# Set x-axis tick labels as integers
plt.xticks(vu, map(int, vu))

# Set the minimum and maximum values for y-axis
plt.ylim(min(rate), max(rate))

# Save the graph as a PNG image
plt.savefig('error_rates.png')

# Show the graph
# plt.show()
