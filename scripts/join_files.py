from pathlib import Path
import pandas as pd

def extract_city_name(fileName: str) -> str:
    """
    Automatically get the name of the cty from the filename.
    :param fileName: the name of the csv file
    :return: cityName
    """
    city_name = fileName.split("_")[0].capitalize()
    return city_name

def main():
    raw_data_folder = Path("data/raw")
    output_folder = Path("data/processed")

    all_dataframes = []

    csv_files = raw_data_folder.glob("*.csv")

    if not csv_files:
        print("No CSV files found in data/raw.")
        return

    for file_path in csv_files:
        print("Reading" + file_path.name + "\n")

        # Read the current csv
        df = pd.read_csv(file_path)

        # Extract the name and add a column with that value
        city = extract_city_name(file_path.name)
        df["city"] = city

        all_dataframes.append(df)

    # We can simply merge, because all have the same structure
    merged_df = pd.concat(all_dataframes, ignore_index=True)

    output_path = output_folder / "merged_airbnb.csv"
    merged_df.to_csv(output_path, index=False)

    print(f"Merged {len(csv_files)} files.")
    print(f"Final shape: {merged_df.shape}")


if __name__ == "__main__":
    main()