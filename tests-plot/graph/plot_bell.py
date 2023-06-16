import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import norm
import csv

# Read the latency durations from the CSV file
latency_durations = []
with open('bell.csv', 'r') as file:
    reader = csv.reader(file)
    for row in reader:
        latency_durations.append(float(row[0]))

# Plot the bell curve
mu = np.mean(latency_durations)  # Mean
sigma = np.std(latency_durations)  # Standard deviation
x = np.linspace(mu - 3 * sigma, mu + 3 * sigma, 100)  # x-axis values
y = norm.pdf(x, mu, sigma)  # y-axis values (probability density function)

plt.plot(x, y)
plt.xlabel('Latency Duration')
plt.ylabel('Probability Density')
plt.title('Bell Curve of Latency Durations')
plt.grid(True)

# Decorate the graph to highlight common and anomaly regions
confidence_intervals = [0.68, 0.95, 0.99]  # Confidence intervals to highlight
colors = ['g', 'y', 'r']  # Colors for the highlighted regions

for confidence, color in zip(confidence_intervals, colors):
    lower_bound = mu - norm.ppf((1 - confidence) / 2) * sigma
    upper_bound = mu + norm.ppf((1 - confidence) / 2) * sigma
    plt.axvspan(lower_bound, upper_bound, facecolor=color, alpha=0.3,
                label=f'{int(confidence * 100)}% Confidence Interval')

plt.legend()

# Save the plot as an image
plt.savefig('bell.png')
