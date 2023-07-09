import matplotlib.pyplot as plt
import csv

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

# Get unique VU values
unique_vu = list(set(vu))

# Plot separate lines for each VU
for v in unique_vu:
    vu_iterations = [iterations[i] for i in range(len(iterations)) if vu[i] == v]
    vu_latency = [latency[i] for i in range(len(latency)) if vu[i] == v]
    plt.plot(vu_iterations, vu_latency, marker='o', label='VU {}'.format(v))

# Add labels and title
plt.xlabel('Iterations over Time')
plt.ylabel('Latency (ms)')
plt.title('Latency over Iterations by VU')

# Set x-axis tick locations and labels as integers
plt.xticks(range(min(iterations), max(iterations) + 1))

# Add legend
plt.legend()

# Save the graph as a PNG image
plt.savefig('lines.png')

# Display the graph
plt.show()
