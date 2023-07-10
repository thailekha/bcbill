import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Read data from error_rates.csv
data = pd.read_csv('error_rates.csv')

# Extract columns
vu = data['VU']
rate = data['rate']

# Calculate the width of each bar
bar_width = np.min(np.diff(vu)) * 0.8

# Plot the bar graph
plt.bar(vu, rate, width=bar_width)

# Add labels and title
plt.xlabel('App instances')
plt.ylabel('Error rate')
plt.title('Error Rates')

# Set x-axis tick labels as integers
plt.xticks(vu, map(int, vu))

# Set the minimum and maximum values for y-axis
y_min = rate.min() - 5
y_max = rate.max() + 5
# plt.ylim(y_min, y_max)
plt.ylim(0, 100)

plt.savefig('error_rates.png')
