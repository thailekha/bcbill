import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Read data from error_rates.csv
data = pd.read_csv('error_rates.csv')

# Extract columns
vu = data['VU']
rate = data['rate']

# Define evenly spaced x-axis values
x_values = np.arange(len(vu))

# Calculate the width of each bar
# bar_width = 0.8
bar_width = 6 / len(vu)

# Plot the bar graph
plt.bar(x_values, rate, width=bar_width)

# Add labels and title
plt.xlabel('App instances')
plt.ylabel('Error rate')
plt.title('Error Rates')

# Set x-axis tick labels
plt.xticks(x_values, vu)

# Set the minimum and maximum values for y-axis
y_min = rate.min() - 5
y_max = rate.max() + 5
# plt.ylim(y_min, y_max)
plt.ylim(0, 100)

plt.savefig('error_rates.png')
