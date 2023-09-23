import matplotlib.pyplot as plt
import csv
import statistics
import numpy as np
from matplotlib.ticker import MaxNLocator  # Import MaxNLocator

# Read data from lines.csv
iterations = []
latency = []
vu = []

with open('lines.csv', 'r') as csvfile:
    csvreader = csv.DictReader(csvfile)
    for row in csvreader:
        iterations.append(int(row['iteration']))
        latency.append(float(row['latency']))
        vu.append(int(row['VU']))

# Calculate the average latency (rounded to 2 decimal places)
average_latency = round(sum(latency) / len(latency), 2)

# Calculate mean latency (rounded to 2 decimal places)
mean_latency = round(statistics.mean(latency), 2)

# Calculate the interquartile range (IQR) as the most common latency range
percentile_25 = np.percentile(latency, 25)
percentile_75 = np.percentile(latency, 75)
iqr = percentile_75 - percentile_25

# Calculate the lower and upper bounds of the IQR range (rounded to 2 decimal places)
iqr_lower_bound = round(percentile_25 - 1.5 * iqr, 2)
iqr_upper_bound = round(percentile_75 + 1.5 * iqr, 2)

# Find the lowest and highest latencies (rounded to 2 decimal places)
lowest_latency = round(min(latency), 2)
highest_latency = round(max(latency), 2)

# Check if iqr_lower_bound is lower than the lowest_latency
if iqr_lower_bound < lowest_latency:
    iqr_lower_bound = lowest_latency  # Set iqr_lower_bound to the lowest latency record

# Get unique VU values
unique_vu = list(set(vu))

# Create a grayscale colormap
cmap = plt.get_cmap('gray')

# Set font sizes
plt.rcParams.update({'font.size': 14})  # Set the default font size for labels and text

# Create the figure with an increased size and no margins
fig, ax = plt.subplots(figsize=(12, 6))  # Increase the size (width, height) as needed

# Plot separate scatter plots for each VU
for v in unique_vu:
    vu_iterations = [iterations[i] for i in range(len(iterations)) if vu[i] == v]
    vu_latency = [latency[i] for i in range(len(latency)) if vu[i] == v]
    ax.scatter(vu_iterations, vu_latency, marker='o', c=cmap(0), s=2)

# Set x-axis to display integer ticks
ax.xaxis.set_major_locator(MaxNLocator(integer=True))  # Display integer values on x-axis

# Add horizontal dashed lines to highlight the most common range (IQR)
ax.axhline(y=iqr_lower_bound, color='gray', linestyle='--')
ax.axhline(y=iqr_upper_bound, color='gray', linestyle='--')

# Add labels and title
ax.set_xlabel('Iterations over Time', fontsize=16)
ax.set_ylabel('Latency (ms)', fontsize=16)

# Create a text box for latency statistics and total requests sent above the graph
textbox = f'Mean Latency: {mean_latency} ms\nMost Common Range: {iqr_lower_bound} - {iqr_upper_bound} ms\nLowest Latency: {lowest_latency} ms\nHighest Latency: {highest_latency} ms\nTotal Requests Sent: {len(iterations)}'
ax.text(0.0, 1.1, textbox, ha='left', va='center', transform=ax.transAxes, bbox=dict(boxstyle='round', facecolor='lightgray', edgecolor='gray'), fontsize=14)

# Adjust the subplot to remove the gap
plt.subplots_adjust(left=0, right=1, top=1, bottom=0, wspace=0, hspace=0)

# Save the graph as a PNG image
plt.savefig('scatter.png', bbox_inches='tight', pad_inches=0)

# Display the graph
plt.show()
