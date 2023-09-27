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
        latency.append(round(float(row['latency']), 3))  # Round latency to 3 decimal places
        vu.append(int(row['VU']))

# Calculate the average latency (rounded to 3 decimal places)
average_latency = round(sum(latency) / len(latency), 3)

# Calculate mean latency (rounded to 3 decimal places)
mean_latency = round(statistics.mean(latency), 3)

q1 = round(np.quantile(latency, .25), 3)
q3 = round(np.quantile(latency, .75), 3)

min_latency = round(min(latency), 3)  # Added min latency
max_latency = round(max(latency), 3)  # Added max latency

# Get unique VU values
unique_vu = list(set(vu))

# Create a grayscale colormap
cmap = plt.get_cmap('gray')

# Set font sizes
plt.rcParams.update({'font.size': 17})  # Set the default font size for labels and text

# Create the figure with an increased size and no margins
fig, ax = plt.subplots(figsize=(12, 6))  # Increase the size (width, height) as needed

# Plot separate scatter plots for each VU
for v in unique_vu:
    vu_iterations = [iterations[i] for i in range(len(iterations)) if vu[i] == v]
    vu_latency = [latency[i] for i in range(len(latency)) if vu[i] == v]
    ax.scatter(vu_iterations, vu_latency, marker='o', c=cmap(0), s=2)

# Set x-axis to display integer ticks
ax.xaxis.set_major_locator(MaxNLocator(integer=True))  # Display integer values on x-axis

# Add horizontal dashed lines to highlight the Q1 to Q3 range
ax.axhline(y=q1, color='gray', linestyle='--')
ax.axhline(y=q3, color='gray', linestyle='--')

# Add labels and title
ax.set_xlabel('Iterations over Time', fontsize=17)
ax.set_ylabel('Latency (ms)', fontsize=17)

# Create a text box for latency statistics and total requests sent above the graph
textbox = f'Q1: {q1} ms, Q3: {q3} ms\nMin: {min_latency} ms, Mean: {mean_latency} ms, Max: {max_latency} ms\nClient app count: {len(unique_vu)}, Total Requests Sent: {len(iterations)}'
ax.text(0.0, 1.2, textbox, ha='left', va='center', transform=ax.transAxes, bbox=dict(boxstyle='round', facecolor='lightgray', edgecolor='gray'), fontsize=17)

# Adjust the subplot to remove the gap
plt.subplots_adjust(left=0, right=1, top=1, bottom=0.2, wspace=0, hspace=0)

# Save the graph as a PNG image
plt.savefig('scatter.png', bbox_inches='tight', pad_inches=0)

# Display the graph
plt.show()
