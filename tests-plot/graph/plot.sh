if [ -f "bars.csv" ]; then
    echo "bars.csv file found. Running convert_bars_data.py..."
    python3 convert_bars_data.py
    python3 plot_bars.py || true
fi

if [ -f "lines.csv" ]; then
    echo "lines.csv file found. Running convert_lines_data.py..."
    python3 plot_lines.py || true
fi

if [ -f "error_rates.csv" ]; then
    echo "error_rates.csv file found..."
    python3 plot_error_rates.py || true
fi

#python3 convert_bell_data.py
#python3 plot_bell.py || true
#python3 plot_memory.py