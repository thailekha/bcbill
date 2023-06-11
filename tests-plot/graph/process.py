import csv

def convert_data(input_data):
    output_data = [['VU','no proxy','dummy proxy','blockchain']]
    data_dict = {}

    # Split input data into key-value pairs
    for line in input_data:
        key, value = line
        prefix, suffix = key.split('_')
        if prefix not in data_dict:
            data_dict[prefix] = {}
        data_dict[prefix][suffix] = value

    # Create output data in the desired format
    for prefix, values in data_dict.items():
        output_line = [prefix]
        for suffix in ['noproxy', 'dummyproxy', 'blockchain']:
            output_line.append(values.get(suffix, ''))
        output_data.append(output_line)

    return output_data


input_file = 'stackedbars.csv'
output_file = 'stackedbars_processed.csv'

# Read data from CSV file
with open(input_file, 'r') as file:
    csv_reader = csv.reader(file)
    data = list(csv_reader)

# Convert and process data
processed_data = convert_data(data)

# Write processed data to CSV file
with open(output_file, 'w', newline='') as file:
    csv_writer = csv.writer(file)
    csv_writer.writerows(processed_data)

print(f"Data processed and written to {output_file} successfully.")
