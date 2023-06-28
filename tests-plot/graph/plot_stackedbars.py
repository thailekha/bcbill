import pandas as pd
import matplotlib.pyplot as plt

# Read the data from the CSV file
data = pd.read_csv('stackedbars_processed.csv')

# Extract the category names
categories = data['VU']

# Extract the values for each category
# no_proxy = data['no proxy']
# dummy_proxy = data['dummy proxy']
blockchain = data['blockchain']

# Calculate the maximum value from the dataset
max_value = max(blockchain)

# Set the positions of the bars on the x-axis
bar_positions = range(len(categories))

# Plot the stacked bar graph
# plt.bar(bar_positions, no_proxy, label='No Proxy')
# plt.bar(bar_positions, dummy_proxy, bottom=no_proxy, label='Dummy Proxy')
# plt.bar(bar_positions, blockchain, bottom=no_proxy + dummy_proxy, label='Blockchain')
# plt.bar(bar_positions, no_proxy, label='No Proxy')
# plt.bar(bar_positions, dummy_proxy, bottom=no_proxy, label='Dummy Proxy')
plt.bar(bar_positions, blockchain, label='Blockchain')

# Add labels and title
plt.xlabel('Virtual users')
plt.ylabel('Latency (ms)')
plt.title('Latency')

# Add legend
plt.legend()

# Customize the x-axis tick labels
plt.xticks(bar_positions, categories, rotation=90)

# Set the upper limit of the y-axis dynamically based on the maximum value
plt.ylim(0, max_value + 500)

# Save the plot as an image file
plt.tight_layout()
plt.savefig('stackedbars.png')

# Display the plot
plt.show()
