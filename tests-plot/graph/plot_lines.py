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

# Plot separate scatter plots for each VU
for v in unique_vu:
    vu_iterations = [iterations[i] for i in range(len(iterations)) if vu[i] == v]
    vu_latency = [latency[i] for i in range(len(latency)) if vu[i] == v]
    plt.scatter(vu_iterations, vu_latency, marker='o', label='App instance {}'.format(v))

# Add labels and title
plt.xlabel('Iterations over Time')
plt.ylabel('Latency (ms)')
# plt.title('Latency over Iterations by VU')

# Add legend
plt.legend()

# Save the graph as a PNG image
plt.savefig('scatter.png')

# Display the graph
plt.show()
