input_file = 'bars.csv'
output_file = 'bell.csv'

# Read data from CSV file
with open(input_file, 'r') as file:
    lines = file.readlines()

# Process data and save to new file
with open(output_file, 'w') as file:
    for line in lines:
        if 'blockchain' in line:
            parts = line.split(',')
            second_part = parts[1].strip()
            file.write(second_part + '\n')

print(f"Lines containing 'blockchain' have been saved to {output_file} successfully.")
