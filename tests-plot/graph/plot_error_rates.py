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
bar_width = 0.85  # You can adjust the width as needed

# Calculate the new x-axis positions for the labels (centered on ticks)
x_positions = np.arange(len(vu)) + bar_width / 2

# Increase figure size
plt.figure(figsize=(12, 6))  # Adjust the figure size as needed

# Add horizontal lines
for y_value in np.arange(10, rate.max() + 1, 10):  # Start at 10 to skip the line for 0
    plt.axhline(y=y_value, color='gray', linestyle='-', linewidth=1)

# Plot the bar graph in grayscale
bars = plt.bar(x_positions, rate, width=bar_width, color='gray', label='Error Rate (%)', zorder=2)  # Set the color to grayscale and use zorder to bring bars to the front

# Add labels and title with increased font size
plt.xlabel('Client app instances', fontsize=14)
plt.ylabel('Error rate (%)', fontsize=14)
plt.title('Error Rates', fontsize=16)

# Set x-axis tick positions and labels with rotation and increased font size
plt.xticks(x_positions, vu, rotation=80, ha='center', fontsize=13)  # Center labels on ticks and increase font size

# Set custom y-axis tick positions
custom_y_ticks = np.arange(0, 101, 10)  # 0, 10, 20, 30, ..., 100
plt.yticks(custom_y_ticks, fontsize=12)  # Set custom y-axis tick positions and increase font size

# Add values on top of bars except for 0 values
# for bar, value in zip(bars, rate):
#     if value != 0:
#         plt.text(bar.get_x() + bar.get_width() / 2, value + 1, str(round(value, 1)), ha='center', va='bottom')

plt.tight_layout()  # Ensure labels fit within the figure boundaries
plt.savefig('error_rates.png')

# Show the plot (optional)
plt.show()
