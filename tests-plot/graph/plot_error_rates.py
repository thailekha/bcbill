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
bar_width = 0.8  # You can adjust the width as needed

# Increase figure size
plt.figure(figsize=(12, 6))  # Adjust the figure size as needed

# Add horizontal lines
for y_value in np.arange(10, rate.max() + 1, 10):  # Start at 10 to skip the line for 0
    plt.axhline(y=y_value, color='gray', linestyle='-', linewidth=1)

# Plot the bar graph in grayscale
bars = plt.bar(x_values, rate, width=bar_width, color='gray', label='Error Rate (%)', zorder=2)  # Set the color to grayscale and use zorder to bring bars to the front

# Add labels and title
plt.xlabel('Client app instances')
plt.ylabel('Value')
plt.title('Error Rates')

# Set x-axis tick labels with rotation
plt.xticks(x_values, vu, rotation=60, ha='right')  # Rotate the labels by 45 degrees and align to the right

# Set the lower y-axis limit to 0
y_min = 0
y_max = rate.max() + 5
plt.ylim(y_min, y_max)

# Add values on top of bars except for 0 values
# for bar, value in zip(bars, rate):
#     if value != 0:
#         plt.text(bar.get_x() + bar.get_width() / 2, value + 1, str(round(value, 1)), ha='center', va='bottom')

plt.tight_layout()  # Ensure labels fit within the figure boundaries
plt.savefig('error_rates.png')

# Show the plot (optional)
plt.show()
